# Configuración de Gmail API para Extracción de Pedidos B2B

## Requisitos Previos

1. Tener una cuenta de Google con acceso a Gmail
2. Tener el archivo `credentials.json` de Google Cloud Console

## Instalación

### 1. Colocar el archivo credentials.json

Coloca tu archivo `credentials.json` en esta carpeta (`backend/automatizaciones/gmail/`).

**IMPORTANTE:** El archivo `credentials.json` NO debe ser compartido ni subido al repositorio. 
Está incluido en `.gitignore` por seguridad.

### 2. Instalar dependencias

Las dependencias necesarias están en `backend/requirements.txt`:
- google-auth-oauthlib
- google-auth-httplib2
- google-api-python-client
- beautifulsoup4

### 3. Primera autenticación

La primera vez que ejecutes el extractor, se abrirá un navegador para que autorices el acceso a Gmail.
Esto generará un archivo `token.json` que se guardará en esta misma carpeta.

## Obtener credentials.json de Google Cloud Console

Si aún no tienes el archivo `credentials.json`:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Gmail API** en "APIs y servicios"
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
5. Selecciona "Aplicación de escritorio"
6. Descarga el JSON y renómbralo a `credentials.json`
7. Colócalo en esta carpeta

## Uso

El script se ejecuta automáticamente desde la API cuando se solicita desde el frontend.

También se puede ejecutar manualmente para pruebas:

```bash
cd backend
source venv/bin/activate
python -m automatizaciones.gmail.extractor_pedidos_b2b
```

## Archivos en esta carpeta

- `extractor_pedidos_b2b.py` - Script principal de extracción
- `credentials.json` - (NO incluido en repo) Credenciales de Google Cloud
- `token.json` - (Generado automáticamente) Token de autenticación
- `README.md` - Este archivo

## Seguridad

⚠️ **NUNCA** compartas o subas a Git:
- `credentials.json`
- `token.json`

Estos archivos contienen información sensible y están excluidos del repositorio.

