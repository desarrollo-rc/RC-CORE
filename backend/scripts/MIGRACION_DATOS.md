# 📦 Guía de Migración de Base de Datos

Esta guía te ayudará a migrar los datos de PostgreSQL de un equipo a otro.

## 📋 Requisitos Previos

1. **PostgreSQL instalado** en ambos equipos
2. **pg_dump y psql** disponibles (vienen con PostgreSQL)
3. **Archivo .env configurado** en ambos equipos con las credenciales correctas
4. **Acceso a la base de datos** desde ambos equipos

## 🔄 Proceso de Migración

### Paso 1: Exportar datos en el equipo ORIGEN

1. Navega al directorio `backend`:
   ```bash
   cd backend
   ```

2. Haz el script ejecutable (solo la primera vez):
   ```bash
   chmod +x scripts/exportar_base_datos.sh
   ```

3. Ejecuta el script de exportación:
   ```bash
   ./scripts/exportar_base_datos.sh
   ```

   Esto creará un archivo de backup en `backend/backups/` con un nombre como:
   - `backup_repuestocenter_20250115_120000.sql` (sin comprimir)
   - `backup_repuestocenter_20250115_120000.sql.gz` (comprimido - más pequeño)

4. **Copia el archivo de backup** al nuevo equipo usando uno de estos métodos:
   - USB/externa
   - Red compartida
   - Servicio en la nube (Google Drive, Dropbox, etc.)
   - SCP/SFTP si ambos equipos están en la red

### Paso 2: Importar datos en el equipo DESTINO

1. Asegúrate de tener el proyecto clonado y configurado:
   ```bash
   cd backend
   ```

2. Verifica que tu archivo `.env` esté configurado con las credenciales del nuevo equipo:
   ```env
   DB_USER=tu_usuario
   DB_PASSWORD=tu_contraseña
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=repuestocenter
   ```

3. Haz el script ejecutable (solo la primera vez):
   ```bash
   chmod +x scripts/importar_base_datos.sh
   ```

4. Coloca el archivo de backup en el directorio `backend/backups/` o especifica la ruta completa

5. Ejecuta el script de importación:
   ```bash
   # Si el archivo está en backups/
   ./scripts/importar_base_datos.sh backups/backup_repuestocenter_20250115_120000.sql
   
   # O con la ruta completa
   ./scripts/importar_base_datos.sh /ruta/completa/backup_repuestocenter_20250115_120000.sql
   
   # También funciona con archivos comprimidos (.gz)
   ./scripts/importar_base_datos.sh backups/backup_repuestocenter_20250115_120000.sql.gz
   ```

6. El script te pedirá confirmación antes de importar (escribe `SI` para confirmar)

7. Después de la importación, ejecuta las migraciones de Alembic si es necesario:
   ```bash
   flask db upgrade
   ```

## 🔧 Método Alternativo: Usando pg_dump/psql directamente

Si prefieres usar los comandos directamente sin los scripts:

### Exportar:
```bash
# Desde el directorio backend, carga las variables de entorno
export $(cat .env | grep -v '^#' | xargs)
export PGPASSWORD=$DB_PASSWORD

# Exportar
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --clean --if-exists --create \
    --file=backup.sql

# O comprimido
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --clean --if-exists --create \
    --file=backup.sql.gz -Fc
```

### Importar:
```bash
# Cargar variables de entorno
export $(cat .env | grep -v '^#' | xargs)
export PGPASSWORD=$DB_PASSWORD

# Importar
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f backup.sql
```

## ⚠️ Notas Importantes

1. **Backup de seguridad**: Siempre haz un backup antes de importar datos en el equipo destino, especialmente si ya tiene datos.

2. **Tamaño del archivo**: Si la base de datos es muy grande, usa la versión comprimida (.gz) para transferirla más rápido.

3. **Migraciones**: Después de importar, verifica que las migraciones de Alembic estén al día:
   ```bash
   flask db current  # Ver migración actual
   flask db heads    # Ver última migración disponible
   flask db upgrade  # Aplicar migraciones pendientes
   ```

4. **Permisos**: Asegúrate de que el usuario de PostgreSQL tenga permisos para crear bases de datos y tablas.

5. **Conexión remota**: Si la base de datos está en un servidor remoto, verifica que el firewall permita conexiones en el puerto 5432.

## 🐛 Solución de Problemas

### Error: "pg_dump: command not found"
- Instala PostgreSQL client tools:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install postgresql-client
  
  # macOS
  brew install postgresql
  ```

### Error: "password authentication failed"
Este es un error común. El script ahora intenta múltiples métodos de autenticación automáticamente:

1. **Verifica la contraseña en .env**: Asegúrate de que la contraseña sea correcta
   ```env
   DB_PASSWORD=tu_contraseña_aquí
   ```

2. **Caracteres especiales en la contraseña**: Si tu contraseña tiene caracteres especiales:
   - Usa comillas simples en el .env: `DB_PASSWORD='mi$contraseña#especial'`
   - O escapa los caracteres especiales correctamente

3. **Verifica la conexión primero**: Usa el script de verificación:
   ```bash
   ./scripts/verificar_conexion_db.sh
   ```

4. **Método manual**: Si los métodos automáticos fallan, puedes conectarte manualmente:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres
   ```
   Si esto funciona, el problema es con la variable PGPASSWORD. El script intentará usar autenticación interactiva.

5. **Configuración de PostgreSQL**: Verifica que `pg_hba.conf` permita autenticación por contraseña:
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```
   Debe tener una línea como:
   ```
   local   all             all                                     md5
   host    all             all             127.0.0.1/32            md5
   ```

### Error: "database does not exist"
- El script de importación creará la base de datos automáticamente
- Si persiste, créala manualmente:
  ```bash
  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;"
  ```

### Error: "permission denied"
- Verifica los permisos del archivo de backup
- Asegúrate de tener permisos de lectura en el directorio

## 🔍 Verificar la Conexión Antes de Migrar

Antes de exportar o importar, puedes verificar que la conexión funciona:

```bash
./scripts/verificar_conexion_db.sh
```

Este script verificará:
- ✅ Si PostgreSQL está corriendo
- ✅ Si la autenticación funciona
- ✅ Si la base de datos existe
- ✅ Cuántas tablas tiene (si existe)

## 📊 Verificar la Migración

Después de importar, verifica que los datos se importaron correctamente:

```bash
# Conectarte a la base de datos
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME

# Ver tablas
\dt

# Contar registros en una tabla (ejemplo)
SELECT COUNT(*) FROM usuarios;

# Salir
\q
```

O usando Python:
```bash
python -c "from app import create_app; from app.extensions import db; app = create_app(); app.app_context().push(); from app.models.entidades.usuarios import Usuario; print(f'Usuarios: {Usuario.query.count()}')"
```

## 🔄 Sincronización Periódica

Si necesitas sincronizar datos periódicamente entre equipos, puedes:

1. Crear un cron job que ejecute el script de exportación automáticamente
2. Usar un script de sincronización que compare y actualice solo los cambios
3. Considerar usar una base de datos compartida en un servidor central

---

**¿Necesitas ayuda?** Revisa los logs de los scripts o contacta al equipo de desarrollo.

