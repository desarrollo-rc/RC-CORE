# Configuración de Extracción de Pedidos B2B desde Gmail

## 📋 Resumen

Se ha implementado una funcionalidad completa para extraer pedidos B2B automáticamente desde Gmail y registrarlos en el sistema. La funcionalidad está integrada en la página de seguimiento de pedidos con un botón flotante que abre un modal para seleccionar el rango de fechas.

## 🎯 Características

- ✅ Extracción automática de correos de confirmación de pedidos B2B
- ✅ Procesamiento de información de clientes y productos
- ✅ Registro automático en la base de datos
- ✅ Interfaz visual con feedback de resultados
- ✅ Manejo de errores y validaciones
- ✅ Botón flotante (Affix) en la página de pedidos

## 📁 Archivos Creados/Modificados

### Backend

1. **`backend/automatizaciones/gmail/extractor_pedidos_b2b.py`**
   - Script principal de extracción
   - Funciones de autenticación con Gmail API
   - Procesamiento de correos y extracción de datos
   - Integración con la base de datos

2. **`backend/automatizaciones/gmail/README.md`**
   - Guía de configuración de Gmail API
   - Instrucciones para obtener credentials.json

3. **`backend/automatizaciones/gmail/.gitignore`**
   - Protección de credenciales sensibles

4. **`backend/app/api/v1/routes/pedidos_routes.py`** (modificado)
   - Nuevo endpoint: `POST /api/v1/pedidos/gmail/extraer`
   - Integra el script de extracción con la API REST

5. **`backend/requirements.txt`** (modificado)
   - Agregadas dependencias de Google API:
     - `google-auth==2.36.0`
     - `google-auth-oauthlib==1.2.1`
     - `google-auth-httplib2==0.2.0`
     - `google-api-python-client==2.156.0`
     - `beautifulsoup4==4.12.3`

### Frontend

1. **`frontend/src/features/pedidos/components/GmailExtractionModal.tsx`**
   - Modal para selección de rango de fechas
   - Visualización de resultados y errores
   - Feedback visual del proceso

2. **`frontend/src/features/pedidos/services/pedidoService.ts`** (modificado)
   - Nueva función: `extraerPedidosGmail()`
   - Interface: `GmailExtractionResult`

3. **`frontend/src/features/pedidos/pages/PedidosPage.tsx`** (modificado)
   - Botón flotante (Affix) con icono de correo
   - Integración del modal de extracción
   - Actualización automática de la lista tras extracción exitosa

## 🚀 Instalación

### 1. Instalar Dependencias del Backend

```bash
cd backend
source venv/bin/activate  # Si usas virtualenv
pip install -r requirements.txt
```

### 2. Configurar Gmail API

#### Obtener credentials.json

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la **Gmail API**:
   - API y servicios → Biblioteca
   - Busca "Gmail API"
   - Haz clic en "Habilitar"
4. Crea credenciales:
   - API y servicios → Credenciales
   - "Crear credenciales" → "ID de cliente de OAuth 2.0"
   - Tipo de aplicación: "Aplicación de escritorio"
   - Descarga el JSON

#### Colocar credentials.json

```bash
# Coloca el archivo descargado en:
backend/automatizaciones/gmail/credentials.json
```

**⚠️ IMPORTANTE**: Este archivo NO debe subirse a Git (ya está en .gitignore)

### 3. Primera Autenticación

La primera vez que se ejecute la extracción:
1. Se abrirá una ventana del navegador
2. Inicia sesión con tu cuenta de Gmail
3. Autoriza el acceso a la aplicación
4. Se generará automáticamente `token.json` en la misma carpeta

## 📖 Uso

### Desde la Interfaz Web

1. Ve a la página de **Seguimiento de Pedidos**
2. En la esquina inferior derecha verás un **botón flotante azul con icono de correo** 📧
3. Haz clic en el botón para abrir el modal
4. Selecciona el rango de fechas (o déjalo vacío para las últimas 24 horas)
5. Haz clic en "Extraer Pedidos"
6. Verás un resumen de:
   - ✅ Pedidos procesados exitosamente
   - ❌ Errores encontrados (clientes no registrados, productos faltantes, etc.)

### Desde la Línea de Comandos (para pruebas)

```bash
cd backend
source venv/bin/activate
python -m automatizaciones.gmail.extractor_pedidos_b2b
```

## 🔧 Funcionamiento Técnico

### Flujo de Datos

```
Gmail → Extractor Python → Validación → Base de Datos → API → Frontend
```

### Proceso de Extracción

1. **Autenticación**: Se conecta a Gmail usando OAuth2
2. **Búsqueda**: Filtra correos de `no-reply@repuestocenter.cl` con asunto "Confirmación Pedido B2B"
3. **Extracción**: 
   - Código B2B del pedido
   - Información del cliente (RUT, razón social, dirección, comuna)
   - Lista de productos (SKU, cantidad, precio)
4. **Validación**:
   - Verifica que el pedido no exista (por código B2B)
   - Busca el cliente por RUT
   - Verifica que los productos existan por SKU
5. **Registro**:
   - Crea el pedido con estado "pendiente"
   - Crea los detalles del pedido
   - Registra observaciones con información adicional

### Manejo de Errores

La función maneja varios casos:
- ✅ **Cliente no encontrado**: Retorna error indicando que debe crearse manualmente
- ✅ **Producto no encontrado**: Crea el pedido sin ese producto, indicando cuáles faltaron
- ✅ **Pedido duplicado**: Omite el pedido y notifica
- ✅ **Error de Gmail API**: Captura y reporta errores de autenticación/conexión

## 🔒 Seguridad

### Archivos Protegidos

Los siguientes archivos están en `.gitignore` y NO deben compartirse:
- `credentials.json` - Credenciales de Google Cloud
- `token.json` - Token de autenticación de usuario

### Permisos Requeridos

El usuario debe tener el permiso `pedidos:crear` para usar la funcionalidad.

## 📝 Estructura de la Respuesta

### Respuesta Exitosa

```json
{
  "exito": true,
  "mensaje": "Se procesaron 3 pedidos exitosamente.",
  "pedidos_procesados": [
    {
      "codigo_b2b": "B2B-12345",
      "id_pedido": 789,
      "mensaje": "Pedido B2B-12345 registrado exitosamente",
      "productos_count": 5
    }
  ],
  "errores": []
}
```

### Respuesta con Errores

```json
{
  "exito": false,
  "mensaje": "No se pudo procesar ningún pedido. Se encontraron 2 errores.",
  "pedidos_procesados": [],
  "errores": [
    {
      "codigo_b2b": "B2B-12346",
      "mensaje": "Cliente con RUT 12345678-9 no encontrado en el sistema"
    },
    {
      "codigo_b2b": "B2B-12347",
      "mensaje": "El pedido B2B-12347 ya existe"
    }
  ]
}
```

## 🎨 Interfaz de Usuario

### Botón Flotante (Affix)
- **Ubicación**: Esquina inferior derecha
- **Color**: Azul (`color="blue"`)
- **Icono**: `IconMail` (sobre de correo)
- **Tamaño**: 60px de diámetro
- **Forma**: Circular (`radius="xl"`)

### Modal de Extracción
- **Tamaño**: Large (`size="lg"`)
- **Campos**:
  - Fecha desde (opcional)
  - Fecha hasta (opcional)
- **Botones**:
  - Cerrar (outline)
  - Extraer Pedidos (principal, con loading state)
- **Resultados**: Alert con lista de pedidos procesados y errores

## 🐛 Troubleshooting

### Error: "credentials.json no encontrado"

**Solución**: Coloca el archivo `credentials.json` en `backend/automatizaciones/gmail/`

### Error: "Cliente no encontrado"

**Solución**: El cliente con ese RUT no existe en el sistema. Créalo manualmente primero.

### Error: "Productos no encontrados"

**Solución**: Los SKUs del pedido no existen en el catálogo. El pedido se crea sin esos productos.

### La primera autenticación falla

**Solución**: 
1. Elimina `token.json` si existe
2. Asegúrate de que la cuenta de Gmail tiene acceso a los correos
3. Verifica que el proyecto de Google Cloud tiene la Gmail API habilitada

## 📚 Referencias

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Console](https://console.cloud.google.com/)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/bs4/doc/)

## ✅ Checklist de Implementación

- [x] Backend: Script de extracción
- [x] Backend: Endpoint API
- [x] Backend: Dependencias
- [x] Frontend: Servicio de API
- [x] Frontend: Componente Modal
- [x] Frontend: Integración con PedidosPage
- [x] Documentación: README de Gmail
- [x] Seguridad: .gitignore
- [ ] **Pendiente**: Colocar `credentials.json`
- [ ] **Pendiente**: Primera autenticación
- [ ] **Pendiente**: Instalar dependencias

## 🎉 ¡Listo!

La funcionalidad está completamente implementada. Solo falta:
1. Instalar las nuevas dependencias Python
2. Configurar las credenciales de Gmail
3. Realizar la primera autenticación

Una vez completados estos pasos, podrás extraer pedidos B2B directamente desde Gmail con solo un clic en el botón flotante de la página de pedidos.

