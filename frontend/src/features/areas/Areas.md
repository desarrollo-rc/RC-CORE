# Módulo de Áreas

## Descripción

El módulo de Áreas permite gestionar las diferentes áreas o departamentos de la organización (por ejemplo: Repuesto Center S.A., Finanzas, Ventas, etc.). Este módulo proporciona una interfaz completa para crear, editar, visualizar, activar y desactivar áreas dentro del sistema.

## Tablas de Base de Datos

### Tabla Principal: `entidades.areas`

La tabla `areas` almacena la información de las áreas de la organización. Está ubicada en el esquema `entidades` de PostgreSQL.

**Estructura de la tabla:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_area` | INTEGER (PK) | Identificador único del área |
| `codigo_area` | VARCHAR(20) | Código único del área (ej: "FIN", "VTA") |
| `nombre_area` | VARCHAR(100) | Nombre completo del área |
| `descripcion_area` | VARCHAR(255) | Descripción opcional del área |
| `activo` | BOOLEAN | Indica si el área está activa o inactiva |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro |
| `fecha_modificacion` | TIMESTAMP | Fecha de última modificación |

**Relaciones:**
- **`usuarios`**: Relación uno-a-muchos con la tabla `entidades.usuarios`. Un área puede tener múltiples usuarios asignados. La relación se establece mediante `usuarios.id_area` → `areas.id_area`.

## Estructura del Módulo

```
frontend/src/features/areas/
├── components/
│   ├── AreaForm.tsx          # Formulario para crear/editar áreas
│   ├── AreasTable.tsx        # Tabla de visualización de áreas
│   └── AreasTable.module.css # Estilos de la tabla
├── pages/
│   └── AreasPage.tsx         # Página principal del módulo
├── services/
│   └── areaService.ts       # Servicios de API (llamadas al backend)
├── types/
│   └── index.ts             # Definiciones de tipos TypeScript
└── README.md                 # Este archivo
```

## Funciones y Componentes

### Frontend

#### 1. **AreasPage** (`pages/AreasPage.tsx`)
Componente principal que gestiona el estado y la lógica de la página de áreas.

**Funcionalidades:**
- Carga inicial de áreas desde el backend
- Paginación (10 registros por página)
- Ordenamiento por columnas
- Filtro para incluir/excluir áreas inactivas
- Gestión de modal para crear/editar áreas
- Manejo de estados de carga y errores

**Estados principales:**
- `areas`: Lista de áreas cargadas
- `loading`: Estado de carga
- `error`: Mensajes de error
- `page`: Página actual
- `sortStatus`: Estado de ordenamiento
- `selectedRecord`: Área seleccionada
- `editingArea`: Área en modo edición
- `includeInactive`: Flag para incluir inactivos

**Funciones principales:**
- `handleOpenModalForCreate()`: Abre el modal en modo creación
- `handleOpenModalForEdit(area)`: Abre el modal en modo edición
- `handleSubmit(values)`: Procesa el envío del formulario (crear/actualizar)
- `handleDeactivate(area)`: Desactiva un área (con confirmación)
- `handleActivate(area)`: Activa un área (con confirmación)
- `handleRecordClick(area)`: Maneja la selección de un registro en la tabla

#### 2. **AreaForm** (`components/AreaForm.tsx`)
Formulario reutilizable para crear y editar áreas.

**Campos:**
- `codigo_area` (requerido): Código único del área
- `nombre_area` (requerido): Nombre del área
- `descripcion_area` (opcional): Descripción del área

**Validaciones:**
- Código y nombre son campos obligatorios
- El formulario se adapta automáticamente para modo creación o edición

#### 3. **AreasTable** (`components/AreasTable.tsx`)
Tabla interactiva para visualizar las áreas.

**Características:**
- Ordenamiento por columnas (código, nombre, estado)
- Selección de filas al hacer clic
- Acciones por fila:
  - **Editar**: Abre el modal en modo edición
  - **Desactivar**: Desactiva el área (solo si está activa)
  - **Activar**: Activa el área (solo si está inactiva)
- Indicador visual del estado (badge verde/gris)

**Columnas:**
- Código
- Nombre
- Descripción
- Estado (Activo/Inactivo)
- Acciones

#### 4. **areaService** (`services/areaService.ts`)
Servicio que encapsula todas las llamadas al API del backend.

**Funciones:**
- `getAreas(includeInactive)`: Obtiene todas las áreas (opcionalmente incluye inactivas)
- `getAreaById(areaId)`: Obtiene un área por su ID
- `createArea(area)`: Crea una nueva área
- `updateArea(areaId, area)`: Actualiza un área existente
- `deactivateArea(areaId)`: Desactiva un área
- `activateArea(areaId)`: Activa un área

**Endpoints utilizados:**
- `GET /areas?incluir_inactivos={boolean}`: Listar áreas
- `GET /areas/{id}`: Obtener área por ID
- `POST /areas`: Crear área
- `PUT /areas/{id}`: Actualizar área
- `PUT /areas/{id}/deactivate`: Desactivar área
- `PUT /areas/{id}/activate`: Activar área

#### 5. **Types** (`types/index.ts`)
Definiciones de tipos TypeScript.

**Interfaces:**
- `Area`: Representa un área completa con todos sus campos
- `AreaPayload`: Payload para crear/actualizar áreas (sin campos de auditoría)

### Backend

#### 1. **Modelo Area** (`backend/app/models/entidades/areas.py`)
Modelo SQLAlchemy que representa la tabla `areas`.

**Características:**
- Hereda de `MixinAuditoria` (campos `activo`, `fecha_creacion`, `fecha_modificacion`)
- Validación automática: `codigo_area` se convierte a mayúsculas
- Relación con `Usuario` mediante `usuarios`

**Métodos:**
- `get_activos()`: Método de clase para obtener solo áreas activas

#### 2. **AreaService** (`backend/app/api/v1/services/area_service.py`)
Servicio que contiene la lógica de negocio para las operaciones con áreas.

**Métodos estáticos:**
- `get_all_areas(include_inactive)`: Obtiene todas las áreas, opcionalmente incluyendo inactivas
- `get_area_by_id(area_id)`: Obtiene un área por ID (404 si no existe)
- `create_area(data)`: Crea una nueva área
  - Valida que el código no exista
  - Convierte el código a mayúsculas
- `update_area(area_id, data)`: Actualiza un área
  - Valida que el nuevo código no esté en uso (si se modifica)
- `deactivate_area(area_id)`: Desactiva un área
  - **Regla de negocio**: No permite desactivar si tiene usuarios asignados
- `activate_area(area_id)`: Activa un área

#### 3. **Routes** (`backend/app/api/v1/routes/areas_routes.py`)
Rutas Flask que exponen los endpoints REST.

**Endpoints:**
- `POST /areas`: Crear área (requiere JWT)
- `GET /areas`: Listar áreas (requiere JWT)
- `GET /areas/<id>`: Obtener área por ID (requiere JWT)
- `PUT /areas/<id>`: Actualizar área (requiere JWT)
- `PUT /areas/<id>/deactivate`: Desactivar área (requiere JWT)
- `PUT /areas/<id>/activate`: Activar área (requiere JWT)

**Autenticación:**
Todos los endpoints requieren autenticación JWT mediante el decorador `@jwt_required()`.

#### 4. **Schemas** (`backend/app/api/v1/schemas/area_schemas.py`)
Schemas de Marshmallow para validación y serialización.

**Schemas:**
- `AreaSchema`: Para serialización completa de áreas
- `UpdateAreaSchema`: Para actualización (campos opcionales)

## Flujo de Funcionamiento

### Crear una Nueva Área

1. Usuario hace clic en el botón flotante "Crear Área"
2. Se abre el modal con `AreaForm` en modo creación
3. Usuario completa los campos requeridos
4. Al enviar, `handleSubmit` llama a `createArea` del servicio
5. El servicio hace `POST /areas` al backend
6. El backend valida los datos, verifica que el código no exista, crea el registro y retorna el área creada
7. El frontend actualiza la lista y muestra notificación de éxito

### Editar un Área

1. Usuario hace clic en el ícono de editar en una fila de la tabla
2. Se abre el modal con `AreaForm` prellenado con los datos del área
3. Usuario modifica los campos deseados
4. Al enviar, `handleSubmit` detecta que está en modo edición y llama a `updateArea`
5. El servicio hace `PUT /areas/{id}` al backend
6. El backend valida los datos, verifica que el nuevo código no esté en uso (si se cambió), actualiza el registro y retorna el área actualizada
7. El frontend actualiza la lista y muestra notificación de éxito

### Desactivar un Área

1. Usuario hace clic en el ícono de desactivar en una fila activa
2. Se muestra un modal de confirmación
3. Al confirmar, se llama a `deactivateArea` del servicio
4. El servicio hace `PUT /areas/{id}/deactivate` al backend
5. El backend verifica que el área no tenga usuarios asignados, la desactiva y retorna el área actualizada
6. El frontend actualiza la lista y muestra notificación de éxito

### Activar un Área

1. Usuario hace clic en el ícono de activar en una fila inactiva
2. Se muestra un modal de confirmación
3. Al confirmar, se llama a `activateArea` del servicio
4. El servicio hace `PUT /areas/{id}/activate` al backend
5. El backend activa el área y retorna el área actualizada
6. El frontend actualiza la lista y muestra notificación de éxito

## Reglas de Negocio

1. **Código único**: El `codigo_area` debe ser único en todo el sistema
2. **Normalización**: El código se almacena siempre en mayúsculas
3. **Desactivación protegida**: No se puede desactivar un área que tiene usuarios asignados
4. **Soft delete**: Las áreas no se eliminan físicamente, solo se desactivan
5. **Campos requeridos**: `codigo_area` y `nombre_area` son obligatorios

## Notas de Implementación

- El módulo utiliza paginación del lado del cliente (10 registros por página)
- El ordenamiento se realiza en memoria usando `lodash.orderBy`
- Los errores se manejan mediante notificaciones de Mantine
- Todas las operaciones requieren autenticación JWT
- El código del área se normaliza automáticamente a mayúsculas tanto en frontend como backend

