#!/usr/bin/env python3
"""
Script alternativo para exportar la base de datos usando Python.
Útil si no tienes acceso a pg_dump o prefieres usar Python.

Uso: python scripts/exportar_base_datos.py [nombre_archivo_backup]
"""

import os
import sys
import subprocess
from datetime import datetime
from pathlib import Path

# Agregar el directorio backend al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

def exportar_base_datos(nombre_archivo=None):
    """Exporta la base de datos PostgreSQL usando pg_dump"""
    
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
    
    # Nombre del archivo de backup
    if not nombre_archivo:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        nombre_archivo = f"backup_{db_name}_{timestamp}.sql"
    
    # Directorio para backups
    backup_dir = Path(__file__).parent.parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    
    backup_path = backup_dir / nombre_archivo
    
    print("📦 Exportando base de datos...")
    print(f"Base de datos: {db_name}")
    print(f"Host: {db_host}:{db_port}")
    print(f"Usuario: {db_user}")
    print(f"Archivo de salida: {backup_path}")
    print()
    
    # Construir comando pg_dump
    env = os.environ.copy()
    env['PGPASSWORD'] = db_password
    
    cmd = [
        'pg_dump',
        '-h', db_host,
        '-p', db_port,
        '-U', db_user,
        '-d', db_name,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=plain',
        '--file', str(backup_path)
    ]
    
    try:
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            check=True
        )
        
        print("✅ Exportación completada exitosamente")
        print(f"📁 Archivo guardado en: {backup_path}")
        
        # Mostrar tamaño del archivo
        file_size = backup_path.stat().st_size
        size_mb = file_size / (1024 * 1024)
        print(f"📊 Tamaño del archivo: {size_mb:.2f} MB")
        
        # Crear versión comprimida
        print()
        print("🗜️  Creando versión comprimida...")
        import gzip
        with open(backup_path, 'rb') as f_in:
            with gzip.open(f"{backup_path}.gz", 'wb') as f_out:
                f_out.writelines(f_in)
        
        compressed_size = Path(f"{backup_path}.gz").stat().st_size
        compressed_size_mb = compressed_size / (1024 * 1024)
        print(f"✅ Archivo comprimido: {backup_path}.gz ({compressed_size_mb:.2f} MB)")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error durante la exportación:")
        print(e.stderr)
        return False
    except FileNotFoundError:
        print("❌ Error: pg_dump no encontrado")
        print("Instala PostgreSQL client tools:")
        print("  Ubuntu/Debian: sudo apt-get install postgresql-client")
        print("  macOS: brew install postgresql")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    nombre_archivo = sys.argv[1] if len(sys.argv) > 1 else None
    success = exportar_base_datos(nombre_archivo)
    sys.exit(0 if success else 1)

