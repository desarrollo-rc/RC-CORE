#!/bin/bash
# Script para importar la base de datos PostgreSQL
# Uso: ./importar_base_datos.sh [archivo_backup.sql]

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que se proporcionó el archivo
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Debes especificar el archivo de backup${NC}"
    echo "Uso: ./importar_base_datos.sh [archivo_backup.sql]"
    echo ""
    echo "Ejemplo:"
    echo "  ./importar_base_datos.sh backups/backup_repuestocenter_20250115_120000.sql"
    echo "  ./importar_base_datos.sh backups/backup_repuestocenter_20250115_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: El archivo no existe: $BACKUP_FILE${NC}"
    exit 1
fi

# Función para decodificar URL encoding (ej: %40 -> @)
decodificar_url() {
    local texto="$1"
    # Decodificar caracteres comunes de URL encoding
    texto=$(echo "$texto" | sed 's/%40/@/g')  # @
    texto=$(echo "$texto" | sed 's/%23/#/g')  # #
    texto=$(echo "$texto" | sed 's/%24/$/g')  # $
    texto=$(echo "$texto" | sed 's/%25/%/g')  # %
    texto=$(echo "$texto" | sed 's/%26/&/g')  # &
    texto=$(echo "$texto" | sed 's/%2B/+/g')  # +
    texto=$(echo "$texto" | sed 's/%3D/=/g')  # =
    texto=$(echo "$texto" | sed 's/%3F/?/g')  # ?
    texto=$(echo "$texto" | sed 's/%20/ /g')  # espacio
    echo "$texto"
}

# Función para cargar .env de forma segura (maneja caracteres especiales y URL encoding)
cargar_env() {
    if [ -f .env ]; then
        # Leer línea por línea y exportar, manejando correctamente los valores con caracteres especiales
        while IFS= read -r line || [ -n "$line" ]; do
            # Ignorar líneas vacías y comentarios
            [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
            
            # Separar clave y valor
            if [[ "$line" =~ ^([^=]+)=(.*)$ ]]; then
                key="${BASH_REMATCH[1]}"
                value="${BASH_REMATCH[2]}"
                
                # Remover espacios en blanco al inicio y final de la clave
                key=$(echo "$key" | xargs)
                
                # Remover comillas al inicio y final del valor si existen
                value=$(echo "$value" | sed -e 's/^["'\'']//' -e 's/["'\'']$//')
                
                # Si es DB_PASSWORD, decodificar URL encoding
                if [ "$key" = "DB_PASSWORD" ]; then
                    value=$(decodificar_url "$value")
                fi
                
                # Exportar la variable
                export "$key=$value"
            fi
        done < .env
    else
        echo -e "${RED}❌ Error: No se encontró el archivo .env${NC}"
        echo "Por favor, asegúrate de estar en el directorio backend y que existe el archivo .env"
        exit 1
    fi
}

# Cargar variables de entorno desde .env
cargar_env

# Verificar que las variables estén definidas
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Error: Variables de base de datos no definidas en .env${NC}"
    echo "Asegúrate de tener: DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME"
    exit 1
fi

echo -e "${YELLOW}📥 Importando base de datos...${NC}"
echo "Archivo: $BACKUP_FILE"
echo "Host: $DB_HOST:$DB_PORT"
echo "Usuario: $DB_USER"
echo "Base de datos destino: $DB_NAME"
echo ""

# Verificar si el archivo está comprimido
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}🗜️  Descomprimiendo archivo...${NC}"
    TEMP_FILE="/tmp/backup_temp_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    echo -e "${GREEN}✅ Archivo descomprimido${NC}"
    echo ""
fi

# Confirmación
echo -e "${YELLOW}⚠️  ADVERTENCIA: Esta operación reemplazará todos los datos en la base de datos${NC}"
echo -e "${YELLOW}Base de datos: ${DB_NAME}${NC}"
echo ""
read -p "¿Estás seguro de continuar? (escribe 'SI' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SI" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    [ "$TEMP_FILE" != "$BACKUP_FILE" ] && rm -f "$TEMP_FILE"
    exit 0
fi

# Función para verificar conexión con diferentes métodos
verificar_conexion() {
    local metodo=$1
    local exit_code=1
    
    case $metodo in
        pgpassword)
            export PGPASSWORD="$DB_PASSWORD"
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
                exit_code=0
            fi
            unset PGPASSWORD
            ;;
        pgpass)
            local pgpass_file="$HOME/.pgpass_temp_$$"
            echo "$DB_HOST:$DB_PORT:*:$DB_USER:$DB_PASSWORD" > "$pgpass_file"
            chmod 600 "$pgpass_file"
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
                exit_code=0
            fi
            rm -f "$pgpass_file"
            ;;
        interactive)
            if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" 2>/dev/null; then
                exit_code=0
            fi
            ;;
    esac
    
    return $exit_code
}

# Verificar conexión a PostgreSQL
echo ""
echo -e "${YELLOW}🔍 Verificando conexión a PostgreSQL...${NC}"
CONNECTION_OK=false

# Intentar con PGPASSWORD
export PGPASSWORD="$DB_PASSWORD"
if verificar_conexion "pgpassword"; then
    CONNECTION_OK=true
    echo -e "${GREEN}✅ Conexión exitosa usando PGPASSWORD${NC}"
fi
unset PGPASSWORD

# Intentar con .pgpass si PGPASSWORD falló
if [ "$CONNECTION_OK" = false ]; then
    if verificar_conexion "pgpass"; then
        CONNECTION_OK=true
        echo -e "${GREEN}✅ Conexión exitosa usando .pgpass${NC}"
    fi
fi

# Intentar interactivo si los anteriores fallaron
if [ "$CONNECTION_OK" = false ]; then
    echo -e "${YELLOW}💡 Los métodos automáticos fallaron, intentando autenticación interactiva...${NC}"
    if verificar_conexion "interactive"; then
        CONNECTION_OK=true
        echo -e "${GREEN}✅ Conexión exitosa (interactiva)${NC}"
    fi
fi

if [ "$CONNECTION_OK" = false ]; then
    echo -e "${RED}❌ Error: No se pudo conectar a PostgreSQL${NC}"
    echo ""
    echo -e "${YELLOW}💡 Verifica:${NC}"
    echo "1. Que la contraseña en .env sea correcta"
    echo "2. Que PostgreSQL esté corriendo: sudo systemctl status postgresql"
    echo "3. Que el usuario '$DB_USER' exista y tenga permisos"
    echo ""
    [ "$TEMP_FILE" != "$BACKUP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Establecer método de autenticación para usar después
export PGPASSWORD="$DB_PASSWORD"

# Verificar si la base de datos existe
echo ""
echo -e "${YELLOW}🔍 Verificando si la base de datos existe...${NC}"
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${YELLOW}⚠️  La base de datos '$DB_NAME' ya existe${NC}"
    read -p "¿Deseas eliminarla y recrearla? (escribe 'SI' para confirmar): " RECREATE
    
    if [ "$RECREATE" = "SI" ]; then
        echo -e "${YELLOW}🗑️  Eliminando base de datos existente...${NC}"
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
        echo -e "${GREEN}✅ Base de datos eliminada${NC}"
    else
        echo -e "${YELLOW}Operación cancelada${NC}"
        unset PGPASSWORD
        [ "$TEMP_FILE" != "$BACKUP_FILE" ] && rm -f "$TEMP_FILE"
        exit 0
    fi
fi

# Importar el backup
echo ""
echo -e "${YELLOW}📥 Importando datos...${NC}"
echo "Esto puede tardar varios minutos dependiendo del tamaño de la base de datos..."
echo ""

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -f "$TEMP_FILE" 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Importación completada exitosamente${NC}"
    
    # Verificar que la base de datos se creó correctamente
    echo ""
    echo -e "${YELLOW}🔍 Verificando importación...${NC}"
    TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    echo -e "${GREEN}✅ Base de datos importada con $TABLE_COUNT tablas${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Error durante la importación${NC}"
    echo "Revisa los mensajes de error arriba"
    unset PGPASSWORD
    [ "$TEMP_FILE" != "$BACKUP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Limpiar archivo temporal si se creó
[ "$TEMP_FILE" != "$BACKUP_FILE" ] && rm -f "$TEMP_FILE"

# Limpiar variable de entorno
unset PGPASSWORD

echo ""
echo -e "${GREEN}✨ Proceso completado${NC}"
echo ""
echo "Siguiente paso: Ejecuta las migraciones de Alembic si es necesario:"
echo "  flask db upgrade"

