#!/bin/bash
# Script para exportar la base de datos PostgreSQL
# Uso: ./exportar_base_datos.sh [nombre_archivo_backup]

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para decodificar URL encoding (ej: %40 -> @)
decodificar_url() {
    local texto="$1"
    # Decodificar caracteres comunes de URL encoding
    texto=$(echo "$texto" | sed 's/%40/@/g')  # @
    texto=$(echo "$texto" | sed 's/%23/#/g')  # #
    texto=$(echo "$texto" | sed 's/%24/$/g')  # $
    texto=$(echo "$texto" | sed 's/%25/%/g')   # %
    texto=$(echo "$texto" | sed 's/%26/&/g')   # &
    texto=$(echo "$texto" | sed 's/%2B/+/g')   # +
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

# Nombre del archivo de backup
if [ -z "$1" ]; then
    BACKUP_FILE="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
else
    BACKUP_FILE="$1"
fi

# Directorio para guardar backups
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

FULL_BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo -e "${YELLOW}📦 Exportando base de datos...${NC}"
echo "Base de datos: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Usuario: $DB_USER"
echo "Archivo de salida: $FULL_BACKUP_PATH"
echo ""

# Función para intentar exportar con diferentes métodos de autenticación
exportar_con_autenticacion() {
    local metodo=$1
    local exit_code=1
    
    case $metodo in
        pgpassword)
            # Método 1: Usar PGPASSWORD
            export PGPASSWORD="$DB_PASSWORD"
            if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --no-password \
                --verbose \
                --clean \
                --if-exists \
                --create \
                --format=plain \
                --file="$FULL_BACKUP_PATH" > /dev/null 2>&1; then
                exit_code=0
            fi
            unset PGPASSWORD
            ;;
        pgpass)
            # Método 2: Usar archivo .pgpass temporal
            local pgpass_file="$HOME/.pgpass_temp_$$"
            echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASSWORD" > "$pgpass_file"
            chmod 600 "$pgpass_file"
            
            if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --no-password \
                --verbose \
                --clean \
                --if-exists \
                --create \
                --format=plain \
                --file="$FULL_BACKUP_PATH" > /dev/null 2>&1; then
                exit_code=0
            fi
            rm -f "$pgpass_file"
            ;;
        interactive)
            # Método 3: Pedir contraseña interactivamente
            echo -e "${YELLOW}Se te pedirá la contraseña de PostgreSQL...${NC}"
            if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                --verbose \
                --clean \
                --if-exists \
                --create \
                --format=plain \
                --file="$FULL_BACKUP_PATH"; then
                exit_code=0
            fi
            ;;
    esac
    
    return $exit_code
}

# Intentar exportar con diferentes métodos
EXPORT_SUCCESS=false

# Método 1: PGPASSWORD
echo -e "${YELLOW}🔐 Intentando autenticación con PGPASSWORD...${NC}"
if exportar_con_autenticacion "pgpassword"; then
    EXPORT_SUCCESS=true
    echo -e "${GREEN}✅ Autenticación exitosa con PGPASSWORD${NC}"
fi

# Método 2: .pgpass si PGPASSWORD falló
if [ "$EXPORT_SUCCESS" = false ]; then
    echo -e "${YELLOW}🔐 Intentando autenticación con archivo .pgpass...${NC}"
    if exportar_con_autenticacion "pgpass"; then
        EXPORT_SUCCESS=true
        echo -e "${GREEN}✅ Autenticación exitosa con .pgpass${NC}"
    fi
fi

# Método 3: Interactivo si los anteriores fallaron
if [ "$EXPORT_SUCCESS" = false ]; then
    echo -e "${YELLOW}🔐 Los métodos automáticos fallaron, intentando autenticación interactiva...${NC}"
    echo -e "${YELLOW}💡 Tip: Si esto falla, verifica que la contraseña en .env sea correcta${NC}"
    echo ""
    if exportar_con_autenticacion "interactive"; then
        EXPORT_SUCCESS=true
        echo -e "${GREEN}✅ Autenticación exitosa${NC}"
    fi
fi

if [ "$EXPORT_SUCCESS" = true ]; then
    echo ""
    echo -e "${GREEN}✅ Exportación completada exitosamente${NC}"
    echo -e "📁 Archivo guardado en: ${GREEN}$FULL_BACKUP_PATH${NC}"
    
    # Mostrar tamaño del archivo
    FILE_SIZE=$(du -h "$FULL_BACKUP_PATH" | cut -f1)
    echo -e "📊 Tamaño del archivo: ${GREEN}$FILE_SIZE${NC}"
    
    # También crear un backup comprimido
    echo ""
    echo -e "${YELLOW}🗜️  Creando versión comprimida...${NC}"
    gzip -c "$FULL_BACKUP_PATH" > "${FULL_BACKUP_PATH}.gz"
    COMPRESSED_SIZE=$(du -h "${FULL_BACKUP_PATH}.gz" | cut -f1)
    echo -e "${GREEN}✅ Archivo comprimido: ${FULL_BACKUP_PATH}.gz (${COMPRESSED_SIZE})${NC}"
else
    echo ""
    echo -e "${RED}❌ Error durante la exportación${NC}"
    echo ""
    echo -e "${YELLOW}💡 Soluciones posibles:${NC}"
    echo "1. Verifica que la contraseña en .env sea correcta"
    echo "2. Verifica que el usuario '$DB_USER' exista en PostgreSQL"
    echo "3. Verifica que PostgreSQL esté corriendo: sudo systemctl status postgresql"
    echo "4. Verifica la configuración de autenticación en pg_hba.conf"
    echo "5. Intenta conectarte manualmente: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    echo ""
    echo "Si la contraseña tiene caracteres especiales, intenta:"
    echo "  - Escaparlos correctamente en el archivo .env"
    echo "  - O usar comillas simples alrededor del valor en .env"
    exit 1
fi

echo ""
echo -e "${GREEN}✨ Proceso completado${NC}"
echo ""
echo "Para importar en otro equipo, usa:"
echo "  ./scripts/importar_base_datos.sh $FULL_BACKUP_PATH"

