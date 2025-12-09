# Módulo de Calidades

## Descripción

El módulo de Calidades permite gestionar las diferentes calidades de productos (por ejemplo: Original, Alternativo Premium, Genérico, etc.). Este módulo proporciona una interfaz completa para crear, editar, visualizar, activar y desactivar calidades dentro del sistema. Las calidades se utilizan para clasificar los productos según su origen o calidad (repuestos originales, alternativos, etc.).

## Tablas de Base de Datos

### Tabla Principal: `productos.calidades`

La tabla `calidades` almacena la información de las calidades de productos. Está ubicada en el esquema `productos` de PostgreSQL.

**Estructura de la tabla:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_calidad` | INTEGER (PK) | Identificador único de la calidad |
| `codigo_calidad` | VARCHAR(30) | Código único de la calidad (ej: "ORI", "ALT", "GEN") |
| `nombre_calidad` | VARCHAR(100) | Nombre completo de la calidad (ej: "Original", "Alternativo Premium") |
| `descripcion` | VARCHAR(255) | Descripción opcional de la calidad |
| `activo` | BOOLEAN | Indica si la calidad está activa o inactiva |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro |
| `fecha_modificacion` | TIMESTAMP | Fecha de última modificación |

**Relaciones:**
- **`productos`**: Relación uno-a-muchos con la tabla `productos.maestro_productos`. Una calidad puede tener múltiples productos asociados. La relación se establece mediante `maestro_productos.id_calidad` → `calidades.id_calidad`.

## Estructura del Módulo

```
frontend/src/features/calidades/
├── components/
│   ├── CalidadForm.tsx          # Formulario para crear/editar calidades
│   └── CalidadesTable.tsx       # Tabla de visualización de calidades
├── pages/
│   └── CalidadesPage.tsx        # Página principal del módulo
├── services/
│   └── calidadService.ts       # Servicios de API (llamadas al backend)
├── types/
│   └── index.ts                # Definiciones de tipos TypeScript
└── Calidades.md                 # Este archivo
```

## Funciones y Componentes

### Frontend

#### 1. **CalidadesPage** (`pages/CalidadesPage.tsx`)
Componente principal que gestiona el estado y la lógica de la página de calidades.

**Funcionalidades:**
- Carga inicial de calidades desde el backend
- Filtro para incluir/excluir calidades inactivas
- Gestión de modal para crear/editar calidades
- Manejo de estados de carga y errores

**Estados principales:**
- `calidades`: Lista de calidades cargadas
- `loading`: Estado de carga
- `error`: Mensajes de error
- `modalOpened`: Estado del modal
- `isSubmitting`: Estado de envío del formulario
- `editingCalidad`: Calidad en modo edición
- `includeInactive`: Flag para incluir inactivas

**Funciones principales:**
- `handleSubmit(values)`: Procesa el envío del formulario (crear/actualizar)
- `handleOpenModalForCreate()`: Abre el modal en modo creación
- `handleEdit(calidad)`: Abre el modal en modo edición
- `handleDeactivate(calidad)`: Desactiva una calidad (con confirmación)
- `handleActivate(calidad)`: Activa una calidad (con confirmación)

#### 2. **CalidadForm** (`components/CalidadForm.tsx`)
Formulario reutilizable para crear y editar calidades.

**Campos:**
- `codigo_calidad` (requerido): Código único de la calidad
- `nombre_calidad` (requerido): Nombre de la calidad
- `descripcion` (opcional): Descripción de la calidad

**Validaciones:**
- Código y nombre son campos obligatorios
- El formulario se adapta automáticamente para modo creación o edición

#### 3. **CalidadesTable** (`components/CalidadesTable.tsx`)
Tabla interactiva para visualizar las calidades.

**Características:**
- Acciones por fila:
  - **Editar**: Abre el modal en modo edición
  - **Desactivar**: Desactiva la calidad (solo si está activa)
  - **Activar**: Activa la calidad (solo si está inactiva)
- Indicador visual del estado (badge verde/gris)

**Columnas:**
- Código
- Nombre
- Descripción
- Estado (Activo/Inactivo)
- Acciones

#### 4. **calidadService** (`services/calidadService.ts`)
Servicio que encapsula todas las llamadas al API del backend.

**Funciones:**
- `getCalidades(includeInactive)`: Obtiene todas las calidades (opcionalmente incluye inactivas)
- `createCalidad(data)`: Crea una nueva calidad
- `updateCalidad(id, data)`: Actualiza una calidad existente
- `deactivateCalidad(id)`: Desactiva una calidad
- `activateCalidad(id)`: Activa una calidad

**Endpoints utilizados:**
- `GET /calidades?incluir_inactivos={boolean}`: Listar calidades
- `POST /calidades`: Crear calidad
- `PUT /calidades/{id}`: Actualizar calidad
- `PUT /calidades/{id}/deactivate`: Desactivar calidad
- `PUT /calidades/{id}/activate`: Activar calidad

#### 5. **Types** (`types/index.ts`)
Definiciones de tipos TypeScript.

**Interfaces:**
- `Calidad`: Representa una calidad completa con todos sus campos
- `CalidadPayload`: Payload para crear/actualizar calidades (sin campos de auditoría)
- `CalidadFormData`: Datos del formulario de calidad

### Backend

#### 1. **Modelo Calidad** (`backend/app/models/productos/calidades.py`)
Modelo SQLAlchemy que representa la tabla `calidades`.

**Características:**
- Hereda de `MixinAuditoria` (campos `activo`, `fecha_creacion`, `fecha_modificacion`)
- Validación automática: `codigo_calidad` se convierte a mayúsculas
- Relación con `MaestroProductos` mediante `productos`

**Métodos:**
- `get_by_codigo(codigo)`: Método de clase para obtener una calidad por código (solo activas)

#### 2. **CalidadService** (`backend/app/api/v1/services/calidad_service.py`)
Servicio que contiene la lógica de negocio para las operaciones con calidades.

**Métodos estáticos:**
- `get_all_calidades(include_inactive)`: Obtiene todas las calidades, opcionalmente incluyendo inactivas
- `get_calidad_by_id(calidad_id)`: Obtiene una calidad por ID (404 si no existe)
- `create_calidad(data)`: Crea una nueva calidad
  - Valida que el código no exista
- `update_calidad(calidad_id, data)`: Actualiza una calidad
  - Valida que el nuevo código no esté en uso (si se modifica)
- `deactivate_calidad(calidad_id)`: Desactiva una calidad
  - **Regla de negocio**: No permite desactivar si tiene productos asociados
- `activate_calidad(calidad_id)`: Activa una calidad

#### 3. **Routes** (`backend/app/api/v1/routes/calidad_routes.py`)
Rutas Flask que exponen los endpoints REST.

**Endpoints:**
- `POST /calidades`: Crear calidad (requiere JWT y permiso `productos:crear`)
- `GET /calidades`: Listar calidades (requiere JWT y permiso `productos:listar`)
- `PUT /calidades/<id>`: Actualizar calidad (requiere JWT y permiso `productos:editar`)
- `PUT /calidades/<id>/deactivate`: Desactivar calidad (requiere JWT y permiso `productos:cambiar-estado`)
- `PUT /calidades/<id>/activate`: Activar calidad (requiere JWT y permiso `productos:cambiar-estado`)

**Autenticación y Permisos:**
Todos los endpoints requieren autenticación JWT mediante el decorador `@jwt_required()` y permisos específicos mediante `@permission_required()`.

#### 4. **Schemas** (`backend/app/api/v1/schemas/calidad_schemas.py`)
Schemas de Marshmallow para validación y serialización.

**Schemas:**
- `CalidadSchema`: Para serialización completa de calidades
- `UpdateCalidadSchema`: Para actualización (campos opcionales)

## Flujo de Funcionamiento

### Crear una Nueva Calidad

1. Usuario hace clic en el botón flotante "Crear Calidad"
2. Se abre el modal con `CalidadForm` en modo creación
3. Usuario completa los campos requeridos (código y nombre) y opcionalmente la descripción
4. Al enviar, `handleSubmit` llama a `createCalidad` del servicio
5. El servicio hace `POST /calidades` al backend
6. El backend valida los datos, verifica que el código no exista, crea el registro y retorna la calidad creada
7. El frontend actualiza la lista y muestra notificación de éxito

### Editar una Calidad

1. Usuario hace clic en el ícono de editar en una fila de la tabla
2. Se abre el modal con `CalidadForm` prellenado con los datos de la calidad
3. Usuario modifica los campos deseados
4. Al enviar, `handleSubmit` detecta que está en modo edición y llama a `updateCalidad`
5. El servicio hace `PUT /calidades/{id}` al backend
6. El backend valida los datos, verifica que el nuevo código no esté en uso (si se cambió), actualiza el registro y retorna la calidad actualizada
7. El frontend actualiza la lista y muestra notificación de éxito

### Desactivar una Calidad

1. Usuario hace clic en el ícono de desactivar en una fila activa
2. Se muestra un modal de confirmación
3. Al confirmar, se llama a `deactivateCalidad` del servicio
4. El servicio hace `PUT /calidades/{id}/deactivate` al backend
5. El backend verifica que la calidad no tenga productos asociados, la desactiva y retorna la calidad actualizada
6. Si hay productos asociados, retorna un error 409 (Conflict)
7. El frontend actualiza la lista y muestra notificación de éxito o error

### Activar una Calidad

1. Usuario hace clic en el ícono de activar en una fila inactiva
2. Se muestra un modal de confirmación
3. Al confirmar, se llama a `activateCalidad` del servicio
4. El servicio hace `PUT /calidades/{id}/activate` al backend
5. El backend activa la calidad y retorna la calidad actualizada
6. El frontend actualiza la lista y muestra notificación de éxito

## Reglas de Negocio

1. **Código único**: El `codigo_calidad` debe ser único en todo el sistema
2. **Normalización**: El código se almacena siempre en mayúsculas
3. **Desactivación protegida**: No se puede desactivar una calidad que tiene productos asociados
4. **Soft delete**: Las calidades no se eliminan físicamente, solo se desactivan
5. **Campos requeridos**: `codigo_calidad` y `nombre_calidad` son obligatorios
6. **Validaciones de longitud**:
   - Código: 2-30 caracteres
   - Nombre: 3-100 caracteres
   - Descripción: máximo 255 caracteres

## Notas de Implementación

- El módulo utiliza un diseño simple y directo similar al módulo de áreas
- Los errores se manejan mediante notificaciones de Mantine
- Todas las operaciones requieren autenticación JWT y permisos específicos
- El código de la calidad se normaliza automáticamente a mayúsculas tanto en frontend como backend
- La validación de productos asociados al desactivar se realiza en el backend para garantizar la integridad de los datos
- El campo descripción es opcional y puede ser null en la base de datos

