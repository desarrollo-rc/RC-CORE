#!/usr/bin/env python3
"""
Script alternativo para importar la base de datos usando Python.
Útil si no tienes acceso a psql o prefieres usar Python.

Uso: python scripts/importar_base_datos.py [archivo_backup.sql]
"""

import os
import sys
import subprocess
import gzip
from pathlib import Path

# Agregar el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def importar_base_datos(archivo_backup):
    """Importa la base de datos PostgreSQL desde un archivo de backup"""
    
    if not archivo_backup:
        print("❌ Error: Debes especificar el archivo de backup")
        print("Uso: python scripts/importar_base_datos.py [archivo_backup.sql]")
        return False
    
    backup_path = Path(archivo_backup)
    
    # Verificar que el archivo existe
    if not backup_path.exists():
        print(f"❌ Error: El archivo no existe: {backup_path}")
        return False
    
    # Obtener variables de entorno
    db_user = os.getenv('DB_USER')
    db_password = os.getenv('DB_PASSWORD')
    db_host = os.getenv('DB_HOST')
    db_port = os.getenv('DB_PORT')
    db_name = os.getenv('DB_NAME')
    
    # Validar variables
    if not all([db_user, db_password, db_host, db_port, db_name]):
        print("❌ Error: Variables de base de datos no definidas en .env")
        print("Asegúrate de tener: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME")
        return False
    
    print("📥 Importando base de datos...")
    print(f"Archivo: {backup_path}")
    print(f"Host: {db_host}:{db_port}")
    print(f"Usuario: {db_user}")
    print(f"Base de datos destino: {db_name}")
    print()
    
    # Manejar archivos comprimidos
    temp_file = backup_path
    if backup_path.suffix == '.gz':
        print("🗜️  Descomprimiendo archivo...")
        temp_file = Path('/tmp') / f"backup_temp_{os.getpid()}.sql"
        with gzip.open(backup_path, 'rb') as f_in:
            with open(temp_file, 'wb') as f_out:
                f_out.write(f_in.read())
        print("✅ Archivo descomprimido")
        print()
    
    # Confirmación
    print("⚠️  ADVERTENCIA: Esta operación reemplazará todos los datos en la base de datos")
    print(f"Base de datos: {db_name}")
    print()
    confirm = input("¿Estás seguro de continuar? (escribe 'SI' para confirmar): ")
    
    if confirm != "SI":
        print("Operación cancelada")
        if temp_file != backup_path:
            temp_file.unlink()
        return False
    
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password
    
    # Verificar conexión
    print()
    print("🔍 Verificando conexión a PostgreSQL...")
    try:
        result = subprocess.run(
            ['psql', '-h', db_host, '-p', db_port, '-U', db_user, '-d', 'postgres', '-c', 'SELECT 1;'],
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        print("✅ Conexión exitosa")
    except subprocess.CalledProcessError:
        print("❌ Error: No se pudo conectar a PostgreSQL")
        print("Verifica tus credenciales en el archivo .env")
        if temp_file != backup_path:
            temp_file.unlink()
        return False
    
    # Verificar si la base de datos existe
    print()
    print("🔍 Verificando si la base de datos existe...")
    try:
        result = subprocess.run(
            ['psql', '-h', db_host, '-p', db_port, '-U', db_user, '-d', 'postgres', 
             '-tAc', f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"],
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        if result.stdout.strip() == "1":
            print(f"⚠️  La base de datos '{db_name}' ya existe")
            recreate = input("¿Deseas eliminarla y recrearla? (escribe 'SI' para confirmar): ")
            
            if recreate == "SI":
                print("🗑️  Eliminando base de datos existente...")
                subprocess.run(
                    ['psql', '-h', db_host, '-p', db_port, '-U', db_user, '-d', 'postgres',
                     '-c', f'DROP DATABASE IF EXISTS "{db_name}";'],
                    env=env,
                    check=True
                )
                print("✅ Base de datos eliminada")
            else:
                print("Operación cancelada")
                if temp_file != backup_path:
                    temp_file.unlink()
                return False
    except subprocess.CalledProcessError as e:
        print(f"⚠️  No se pudo verificar la existencia de la base de datos: {e}")
    
    # Importar el backup
    print()
    print("📥 Importando datos...")
    print("Esto puede tardar varios minutos dependiendo del tamaño de la base de datos...")
    print()
    
    try:
        with open(temp_file, 'r') as f:
            result = subprocess.run(
                ['psql', '-h', db_host, '-p', db_port, '-U', db_user, '-d', 'postgres'],
                env=env,
                stdin=f,
                capture_output=True,
                text=True,
                check=True
            )
        
        print()
        print("✅ Importación completada exitosamente")
        
        # Verificar importación
        print()
        print("🔍 Verificando importación...")
        result = subprocess.run(
            ['psql', '-h', db_host, '-p', db_port, '-U', db_user, '-d', db_name,
             '-tAc', "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"],
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        table_count = result.stdout.strip()
        print(f"✅ Base de datos importada con {table_count} tablas")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print()
        print("❌ Error durante la importación")
        print(e.stderr)
        if temp_file != backup_path:
            temp_file.unlink()
        return False
    except FileNotFoundError:
        print("❌ Error: psql no encontrado")
        print("Instala PostgreSQL client tools:")
        print("  Ubuntu/Debian: sudo apt-get install postgresql-client")
        print("  macOS: brew install postgresql")
        if temp_file != backup_path:
            temp_file.unlink()
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        if temp_file != backup_path:
            temp_file.unlink()
        return False
    finally:
        # Limpiar archivo temporal
        if temp_file != backup_path and temp_file.exists():
            temp_file.unlink()

if __name__ == "__main__":
    archivo_backup = sys.argv[1] if len(sys.argv) > 1 else None
    success = importar_base_datos(archivo_backup)
    
    if success:
        print()
        print("✨ Proceso completado")
        print()
        print("Siguiente paso: Ejecuta las migraciones de Alembic si es necesario:")
        print("  flask db upgrade")
    
    sys.exit(0 if success else 1)

