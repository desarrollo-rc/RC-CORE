# 📧 Instrucciones de Configuración - Gmail B2B

## Paso 1: Obtener Credenciales de Google Cloud

### 1.1 Acceder a Google Cloud Console
1. Ve a: https://console.cloud.google.com/
2. Inicia sesión con tu cuenta de Google

### 1.2 Crear o Seleccionar Proyecto
1. En la parte superior, haz clic en el selector de proyectos
2. Puedes crear un nuevo proyecto o usar uno existente
3. Nombre sugerido: "RepuestoCenter B2B"

### 1.3 Habilitar Gmail API
1. En el menú lateral: **"APIs y servicios"** → **"Biblioteca"**
2. Busca: **"Gmail API"**
3. Haz clic en el resultado y luego en **"Habilitar"**

### 1.4 Configurar Pantalla de Consentimiento OAuth (si es necesario)
1. Ve a: **"APIs y servicios"** → **"Pantalla de consentimiento de OAuth"**
2. Selecciona: **"Uso interno"** (si tu organización usa Google Workspace)
   - O **"Externo"** si usas una cuenta personal
3. Completa la información básica:
   - Nombre de la aplicación: "RepuestoCenter B2B"
   - Correo de soporte: tu correo
4. En "Scopes", no es necesario agregar nada (se configura en el código)
5. Guarda y continúa

### 1.5 Crear Credenciales OAuth 2.0
1. Ve a: **"APIs y servicios"** → **"Credenciales"**
2. Haz clic en: **"+ CREAR CREDENCIALES"**
3. Selecciona: **"ID de cliente de OAuth 2.0"**
4. En "Tipo de aplicación", selecciona: **"Aplicación de escritorio"**
5. Nombre: "RepuestoCenter Desktop Client"
6. Haz clic en **"Crear"**

### 1.6 Descargar el Archivo JSON
1. Aparecerá un diálogo con tus credenciales
2. Haz clic en **"DESCARGAR JSON"**
3. Se descargará un archivo con un nombre largo tipo: `client_secret_XXXXX.json`

## Paso 2: Colocar el Archivo de Credenciales

### 2.1 Renombrar y Mover
1. Renombra el archivo descargado a: **`credentials.json`**
2. Colócalo en: **`backend/automatizaciones/gmail/credentials.json`**

```bash
# Ejemplo en Linux/Mac:
cd ~/Descargas
mv client_secret_*.json /home/cecheverria/work/projects/RepuestoCenter/backend/automatizaciones/gmail/credentials.json

# O en Windows (PowerShell):
# Move-Item client_secret_*.json C:\...\RepuestoCenter\backend\automatizaciones\gmail\credentials.json
```

### 2.2 Verificar la Ubicación
```bash
# Debe existir:
ls -la backend/automatizaciones/gmail/credentials.json
```

## Paso 3: Instalar Dependencias

```bash
cd backend
source venv/bin/activate  # Linux/Mac
# O en Windows: venv\Scripts\activate

pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client beautifulsoup4
```

O simplemente:
```bash
pip install -r requirements.txt
```

## Paso 4: Primera Autenticación

### 4.1 Ejecutar el Script de Prueba
```bash
cd backend
python -m automatizaciones.gmail.extractor_pedidos_b2b
```

### 4.2 Proceso de Autenticación
1. Se abrirá automáticamente una ventana del navegador
2. Selecciona la cuenta de Gmail que recibirá los correos de pedidos B2B
3. Verás una advertencia: **"Esta app no está verificada"**
   - Haz clic en: **"Opciones avanzadas"** o **"Advanced"**
   - Luego en: **"Ir a RepuestoCenter B2B (no seguro)"**
4. Autoriza los permisos solicitados:
   - ✅ Ver tus mensajes de correo electrónico
5. Verás un mensaje: **"The authentication flow has completed"**
6. Cierra la ventana del navegador

### 4.3 Verificar Token Generado
```bash
# Debe existir ahora:
ls -la backend/automatizaciones/gmail/token.json
```

## Paso 5: Probar la Funcionalidad

### Desde el Backend (Terminal)
```bash
cd backend
python -m automatizaciones.gmail.extractor_pedidos_b2b
```

Deberías ver algo como:
```json
{
  "exito": true,
  "mensaje": "Se procesaron X pedidos...",
  "pedidos_procesados": [...],
  "errores": [...]
}
```

### Desde el Frontend (Interfaz Web)
1. Inicia el backend: `cd backend && python run.py`
2. Inicia el frontend: `cd frontend && npm run dev`
3. Ve a la página de **Seguimiento de Pedidos**
4. Verás un **botón flotante azul con icono de correo** en la esquina inferior derecha
5. Haz clic en el botón
6. Selecciona el rango de fechas
7. Haz clic en **"Extraer Pedidos"**

## 🔒 Seguridad

### Archivos que NO deben compartirse:
- ❌ `credentials.json` - Contiene las credenciales de tu proyecto de Google Cloud
- ❌ `token.json` - Contiene el token de acceso a tu cuenta de Gmail

Estos archivos ya están en `.gitignore` y no se subirán a Git.

## ❗ Troubleshooting

### "Error: credentials.json no encontrado"
- Verifica que el archivo esté en la ruta correcta
- Verifica el nombre del archivo (debe ser exactamente `credentials.json`)

### "Error: redirect_uri_mismatch"
- Asegúrate de haber seleccionado "Aplicación de escritorio"
- Si el error persiste, borra las credenciales y créalas de nuevo

### "Esta app no está verificada"
- Es normal si usas una cuenta personal de Google
- Haz clic en "Opciones avanzadas" → "Ir a ... (no seguro)"

### El navegador no se abre automáticamente
- Copia la URL que aparece en la terminal
- Pégala manualmente en tu navegador

### "Token has been expired or revoked"
- Elimina `token.json`
- Ejecuta de nuevo el script para re-autenticar

## ✅ Checklist Final

- [ ] Proyecto creado en Google Cloud Console
- [ ] Gmail API habilitada
- [ ] Credenciales OAuth 2.0 creadas (tipo: Aplicación de escritorio)
- [ ] Archivo `credentials.json` descargado y colocado en la carpeta correcta
- [ ] Dependencias Python instaladas
- [ ] Primera autenticación completada (token.json generado)
- [ ] Prueba exitosa desde terminal
- [ ] Prueba exitosa desde interfaz web

## 📞 Ayuda

Si tienes problemas, revisa:
1. La consola del backend para ver errores detallados
2. La consola del navegador (F12) para errores del frontend
3. Los logs de Google Cloud Console

---

**¡Listo!** Una vez completados estos pasos, podrás extraer pedidos B2B desde Gmail automáticamente.

