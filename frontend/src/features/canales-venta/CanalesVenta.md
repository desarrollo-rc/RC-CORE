# Módulo de Canales de Venta

## Descripción

El módulo de Canales de Venta gestiona los diferentes canales por los cuales se realizan las ventas (por ejemplo: B2B, Call Center, Presencial, Online, etc.). Este módulo es principalmente utilizado como un componente reutilizable (`CanalVentaSelect`) que se integra en otros módulos del sistema para permitir la selección de canales de venta. Aunque el backend proporciona endpoints completos para CRUD de canales, el frontend actualmente solo expone un componente select para su uso en formularios.

## Tablas de Base de Datos

### Tabla Principal: `negocio.canales_venta`

La tabla `canales_venta` almacena la información de los canales de venta. Está ubicada en el esquema `negocio` de PostgreSQL.

**Estructura de la tabla:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_canal` | INTEGER (PK) | Identificador único del canal |
| `codigo_canal` | VARCHAR(20) | Código único del canal (opcional, puede ser NULL) |
| `nombre` | VARCHAR(100) | Nombre único del canal (ej: "B2B", "Call Center", "Presencial") |
| `activo` | BOOLEAN | Indica si el canal está activo o inactivo |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro |
| `fecha_modificacion` | TIMESTAMP | Fecha de última modificación |

**Relaciones:**
- **`cliente_metricas_canal`**: Relación uno-a-muchos con la tabla `analitica.cliente_metricas_canal`. Un canal puede tener múltiples métricas de clientes asociadas. Esta relación se utiliza para análisis y reportes de ventas por canal.

## Estructura del Módulo

```
frontend/src/features/canales-venta/
├── components/
│   └── CanalVentaSelect.tsx    # Componente select reutilizable
├── services/
│   └── canalVentaService.ts   # Servicios de API (llamadas al backend)
├── types/
│   └── index.ts               # Definiciones de tipos TypeScript
└── CanalesVenta.md            # Este archivo
```

**Nota:** Este módulo no tiene una página de gestión propia (`pages/`), ya que se utiliza principalmente como componente auxiliar en otros módulos.

## Funciones y Componentes

### Frontend

#### 1. **CanalVentaSelect** (`components/CanalVentaSelect.tsx`)
Componente select reutilizable para seleccionar canales de venta en formularios.

**Características:**
- Integración con `react-hook-form` mediante `Controller`
- Carga automática de canales activos al montar el componente
- Búsqueda y filtrado de opciones
- Estado de carga mientras se obtienen los datos
- Manejo de errores silencioso (solo en consola)

**Props:**
- `control`: Control de react-hook-form
- `name`: Nombre del campo en el formulario
- `label`: Etiqueta del campo
- `error`: Mensaje de error opcional

**Funcionalidades:**
- Carga los canales activos desde el backend
- Convierte los datos a formato de opciones para el Select de Mantine
- Muestra solo canales activos
- Permite búsqueda dentro de las opciones
- Permite limpiar la selección

#### 2. **canalVentaService** (`services/canalVentaService.ts`)
Servicio que encapsula las llamadas al API del backend.

**Funciones:**
- `getCanalesVenta()`: Obtiene todos los canales de venta activos
  - Maneja tanto respuestas en array como respuestas paginadas
  - Retorna siempre un array de `CanalVenta`

**Endpoints utilizados:**
- `GET /canales-venta`: Listar canales de venta (solo activos)

**Nota:** Aunque el backend proporciona endpoints para crear, actualizar, activar y desactivar canales, estos no están expuestos en el frontend actualmente.

#### 3. **Types** (`types/index.ts`)
Definiciones de tipos TypeScript.

**Interfaces:**
- `CanalVenta`: Representa un canal de venta completo
  - `id_canal`: ID del canal
  - `codigo_canal`: Código del canal (puede ser null)
  - `nombre`: Nombre del canal
  - `activo`: Estado del canal
- `PaginatedCanalesVentaResponse`: Respuesta paginada (definida pero no utilizada actualmente)

### Backend

#### 1. **Modelo CanalVenta** (`backend/app/models/negocio/canales.py`)
Modelo SQLAlchemy que representa la tabla `canales_venta`.

**Características:**
- Hereda de `MixinAuditoria` (campos `activo`, `fecha_creacion`, `fecha_modificacion`)
- Validación automática: `codigo_canal` se convierte a mayúsculas (si no es null)
- `codigo_canal` es opcional (nullable=True)
- `nombre` debe ser único

**Métodos:**
- `get_by_codigo(codigo)`: Método de clase para obtener un canal por código (solo activos)

#### 2. **CanalVentaService** (`backend/app/api/v1/services/canal_venta_service.py`)
Servicio que contiene la lógica de negocio para las operaciones con canales de venta.

**Métodos estáticos:**
- `get_all_canales_venta()`: Obtiene todos los canales activos
- `get_canal_venta_by_id(canal_id)`: Obtiene un canal por ID (404 si no existe)
- `create_canal_venta(data)`: Crea un nuevo canal
  - Valida que el código no exista (si se proporciona)
- `update_canal_venta(canal_id, data)`: Actualiza un canal
  - Valida que el nuevo código no esté en uso (si se modifica)
- `deactivate_canal_venta(canal_id)`: Desactiva un canal
- `activate_canal_venta(canal_id)`: Activa un canal

#### 3. **Routes** (`backend/app/api/v1/routes/canal_venta_routes.py`)
Rutas Flask que exponen los endpoints REST.

**Endpoints:**
- `POST /canales-venta`: Crear canal (requiere JWT)
- `GET /canales-venta`: Listar canales activos (requiere JWT)
- `GET /canales-venta/<id>`: Obtener canal por ID (requiere JWT)
- `PUT /canales-venta/<id>`: Actualizar canal (requiere JWT)
- `PUT /canales-venta/<id>/deactivate`: Desactivar canal (requiere JWT)
- `PUT /canales-venta/<id>/activate`: Activar canal (requiere JWT)

**Autenticación:**
Todos los endpoints requieren autenticación JWT mediante el decorador `@jwt_required()`. A diferencia de otros módulos, no se requieren permisos específicos adicionales.

#### 4. **Schemas** (`backend/app/api/v1/schemas/canal_venta_schemas.py`)
Schemas de Marshmallow para validación y serialización.

**Schemas:**
- `CanalVentaSchema`: Para serialización completa de canales
  - `codigo_canal`: Requerido, 1-20 caracteres
  - `nombre`: Requerido, 3-100 caracteres
- `UpdateCanalVentaSchema`: Para actualización (campos opcionales)

## Flujo de Funcionamiento

### Uso del Componente Select

1. El componente `CanalVentaSelect` se importa en un formulario que necesita seleccionar un canal de venta
2. Al montar el componente, se ejecuta un `useEffect` que llama a `getCanalesVenta()`
3. El servicio hace `GET /canales-venta` al backend
4. El backend retorna solo los canales activos
5. El componente transforma los datos a formato de opciones para el Select
6. El usuario puede buscar y seleccionar un canal del dropdown
7. El valor seleccionado se integra con el formulario mediante `react-hook-form`

### Gestión de Canales (Backend)

Aunque el frontend no tiene una interfaz de gestión, el backend proporciona endpoints completos:

**Crear Canal:**
1. `POST /canales-venta` con `{ codigo_canal, nombre }`
2. El backend valida que el código no exista
3. Crea el canal y lo retorna

**Actualizar Canal:**
1. `PUT /canales-venta/<id>` con datos a actualizar
2. El backend valida que el nuevo código no esté en uso (si se modifica)
3. Actualiza el canal y lo retorna

**Desactivar/Activar Canal:**
1. `PUT /canales-venta/<id>/deactivate` o `/activate`
2. El backend cambia el estado `activo` del canal
3. Retorna el canal actualizado

## Reglas de Negocio

1. **Código opcional**: El `codigo_canal` es opcional (puede ser NULL)
2. **Código único**: Si se proporciona, el `codigo_canal` debe ser único en todo el sistema
3. **Nombre único**: El `nombre` debe ser único en todo el sistema
4. **Normalización**: El código se almacena siempre en mayúsculas (si no es null)
5. **Soft delete**: Los canales no se eliminan físicamente, solo se desactivan
6. **Solo activos en select**: El componente `CanalVentaSelect` solo muestra canales activos
7. **Validaciones de longitud**:
   - Código: 1-20 caracteres (si se proporciona)
   - Nombre: 3-100 caracteres

## Notas de Implementación

- Este módulo es principalmente un módulo auxiliar, no tiene una página de gestión propia
- El componente `CanalVentaSelect` se utiliza en otros módulos como `PedidoCreatePage`, formularios de clientes, etc.
- El backend proporciona funcionalidad completa de CRUD, pero el frontend solo expone la lectura para uso en selects
- Si se necesita gestionar canales (crear, editar, desactivar), se podría crear una página similar a las de otros módulos usando los endpoints existentes del backend
- El servicio maneja tanto respuestas en array como respuestas paginadas para mayor flexibilidad
- El código del canal es opcional, lo que permite tener canales identificados solo por nombre
- Los canales se utilizan principalmente para análisis y métricas de ventas por canal

