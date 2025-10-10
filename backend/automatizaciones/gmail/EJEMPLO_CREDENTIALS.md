# 📄 Ejemplo de credentials.json

**IMPORTANTE**: Este es solo un ejemplo de cómo se ve el archivo. NO uses estos valores.

## Estructura del archivo credentials.json

Tu archivo `credentials.json` descargado de Google Cloud Console se verá similar a esto:

```json
{
  "installed": {
    "client_id": "123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com",
    "project_id": "repuestocenter-b2b-123456",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz",
    "redirect_uris": [
      "http://localhost"
    ]
  }
}
```

## Campos Importantes

- **client_id**: Identifica tu aplicación en Google Cloud
- **client_secret**: Clave secreta de tu aplicación
- **project_id**: ID de tu proyecto en Google Cloud
- **redirect_uris**: Debe contener "http://localhost" para aplicaciones de escritorio

## Ubicación Correcta

Coloca este archivo en:
```
backend/automatizaciones/gmail/credentials.json
```

## Verificación

Para verificar que el archivo está bien ubicado:

```bash
# Linux/Mac
ls -la backend/automatizaciones/gmail/credentials.json

# Windows (PowerShell)
dir backend\automatizaciones\gmail\credentials.json
```

Deberías ver algo como:
```
-rw-r--r-- 1 usuario usuario 612 Oct  9 10:30 credentials.json
```

## ⚠️ Seguridad

**NUNCA** compartas este archivo:
- ❌ NO lo subas a GitHub
- ❌ NO lo compartas por correo
- ❌ NO lo publiques en foros
- ❌ NO lo incluyas en screenshots

El archivo ya está protegido en `.gitignore` para evitar que se suba accidentalmente a Git.

## Siguientes Pasos

Una vez que tengas el archivo en su lugar:
1. Instala las dependencias: `pip install -r requirements.txt`
2. Ejecuta el script: `python -m automatizaciones.gmail.extractor_pedidos_b2b`
3. Se abrirá un navegador para autorizar el acceso
4. Se generará automáticamente `token.json`

---

**Nota**: Si ves algún error relacionado con el formato del archivo, asegúrate de que sea un JSON válido y que tenga la estructura mostrada arriba.

