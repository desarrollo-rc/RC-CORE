#!/bin/bash
# Script para verificar la conexión a PostgreSQL
# Uso: ./scripts/verificar_conexion_db.sh

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🔍 Verificando conexión a PostgreSQL...${NC}"
echo "Host: $DB_HOST:$DB_PORT"
echo "Usuario: $DB_USER"
echo "Base de datos: $DB_NAME"
echo ""

# Verificar si PostgreSQL está corriendo
echo -e "${YELLOW}1. Verificando si PostgreSQL está corriendo...${NC}"
if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL está corriendo${NC}"
else
    echo -e "${RED}❌ PostgreSQL no está respondiendo${NC}"
    echo "   Intenta: sudo systemctl start postgresql"
    exit 1
fi

# Intentar conexión con diferentes métodos
echo ""
echo -e "${YELLOW}2. Verificando autenticación...${NC}"

# Método 1: PGPASSWORD
export PGPASSWORD="$DB_PASSWORD"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexión exitosa usando PGPASSWORD${NC}"
    CONNECTION_OK=true
    AUTH_METHOD="pgpassword"
else
    echo -e "${YELLOW}⚠️  PGPASSWORD no funcionó, probando otros métodos...${NC}"
    CONNECTION_OK=false
    AUTH_METHOD=""
fi
unset PGPASSWORD

# Método 2: .pgpass
if [ "$CONNECTION_OK" = false ]; then
    pgpass_file="$HOME/.pgpass_temp_$$"
    echo "$DB_HOST:$DB_PORT:*:$DB_USER:$DB_PASSWORD" > "$pgpass_file"
    chmod 600 "$pgpass_file"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Conexión exitosa usando .pgpass${NC}"
        CONNECTION_OK=true
        AUTH_METHOD="pgpass"
    fi
    rm -f "$pgpass_file"
fi

# Método 3: Interactivo
if [ "$CONNECTION_OK" = false ]; then
    echo -e "${YELLOW}💡 Intentando conexión interactiva (se pedirá la contraseña)...${NC}"
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" 2>/dev/null; then
        echo -e "${GREEN}✅ Conexión exitosa (interactiva)${NC}"
        CONNECTION_OK=true
        AUTH_METHOD="interactive"
    else
        echo -e "${RED}❌ No se pudo conectar${NC}"
    fi
fi

if [ "$CONNECTION_OK" = false ]; then
    echo ""
    echo -e "${RED}❌ No se pudo establecer conexión${NC}"
    echo ""
    echo -e "${YELLOW}💡 Verifica:${NC}"
    echo "1. Que la contraseña en .env sea correcta"
    echo "2. Que el usuario '$DB_USER' exista: sudo -u postgres psql -c \"\\du\""
    echo "3. Que la base de datos '$DB_NAME' exista (o que el usuario tenga permisos para crearla)"
    echo "4. La configuración de pg_hba.conf permite conexiones desde tu IP"
    echo ""
    exit 1
fi

# Verificar si la base de datos existe usando el método de autenticación que funcionó
echo ""
echo -e "${YELLOW}3. Verificando si la base de datos '$DB_NAME' existe...${NC}"

# Función para ejecutar consulta con el método de autenticación correcto
ejecutar_consulta() {
    local query=$1
    local db_target=$2
    
    case "$AUTH_METHOD" in
        pgpassword)
            export PGPASSWORD="$DB_PASSWORD"
            result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_target" -tAc "$query" 2>/dev/null)
            unset PGPASSWORD
            echo "$result"
            ;;
        pgpass)
            pgpass_file="$HOME/.pgpass_temp_$$"
            # Crear entradas para postgres y la base de datos específica
            echo "$DB_HOST:$DB_PORT:postgres:$DB_USER:$DB_PASSWORD" > "$pgpass_file"
            echo "$DB_HOST:$DB_PORT:$db_target:$DB_USER:$DB_PASSWORD" >> "$pgpass_file"
            echo "$DB_HOST:$DB_PORT:*:$DB_USER:$DB_PASSWORD" >> "$pgpass_file"
            chmod 600 "$pgpass_file"
            result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_target" -tAc "$query" 2>/dev/null)
            rm -f "$pgpass_file"
            echo "$result"
            ;;
        interactive)
            result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_target" -tAc "$query" 2>/dev/null)
            echo "$result"
            ;;
        *)
            # Fallback: intentar con PGPASSWORD
            export PGPASSWORD="$DB_PASSWORD"
            result=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$db_target" -tAc "$query" 2>/dev/null)
            unset PGPASSWORD
            echo "$result"
            ;;
    esac
}

DB_EXISTS=$(ejecutar_consulta "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" "postgres")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ La base de datos '$DB_NAME' existe${NC}"
    
    # Contar tablas en todos los esquemas
    TABLE_COUNT=$(ejecutar_consulta "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog', 'information_schema')" "$DB_NAME")
    
    if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" != "" ]; then
        echo -e "${GREEN}   Total de tablas: $TABLE_COUNT${NC}"
    fi
    
    # Contar tablas por esquema
    SCHEMA_INFO=$(ejecutar_consulta "SELECT schemaname, COUNT(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') GROUP BY schemaname ORDER BY schemaname" "$DB_NAME")
    if [ ! -z "$SCHEMA_INFO" ] && [ "$SCHEMA_INFO" != "" ]; then
        echo -e "${GREEN}   Tablas por esquema:${NC}"
        echo "$SCHEMA_INFO" | while IFS='|' read -r schema count; do
            echo -e "     ${GREEN}$schema${NC}: $count tablas"
        done
    fi
else
    echo -e "${YELLOW}⚠️  La base de datos '$DB_NAME' no se encontró con la consulta${NC}"
    echo "   Intentando verificación alternativa..."
    
    # Verificación alternativa: intentar conectarse directamente a la base de datos
    if [ "$AUTH_METHOD" = "pgpass" ]; then
        pgpass_file="$HOME/.pgpass_temp_$$"
        echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASSWORD" > "$pgpass_file"
        chmod 600 "$pgpass_file"
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ La base de datos '$DB_NAME' existe (verificación alternativa exitosa)${NC}"
            DB_EXISTS="1"
        fi
        rm -f "$pgpass_file"
    elif [ "$AUTH_METHOD" = "pgpassword" ]; then
        export PGPASSWORD="$DB_PASSWORD"
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ La base de datos '$DB_NAME' existe (verificación alternativa exitosa)${NC}"
            DB_EXISTS="1"
        fi
        unset PGPASSWORD
    fi
    
    if [ "$DB_EXISTS" != "1" ]; then
        echo -e "${YELLOW}⚠️  No se pudo verificar la existencia de la base de datos '$DB_NAME'${NC}"
        echo "   Se creará automáticamente al importar el backup si no existe"
    fi
fi

echo ""
echo -e "${GREEN}✨ Verificación completada${NC}"
echo ""
echo "Si todos los checks pasaron, puedes proceder con la exportación/importación."

