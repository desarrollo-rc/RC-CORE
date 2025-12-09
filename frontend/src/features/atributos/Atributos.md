# Módulo de Atributos

## Descripción

El módulo de Atributos permite gestionar los atributos de los productos y sus valores posibles. Los atributos son características que pueden tener los productos (por ejemplo: Lado, Material, Color, etc.), y cada atributo puede tener múltiples valores asociados (por ejemplo: para "Lado" puede haber "Izquierdo", "Derecho"; para "Color" puede haber "Rojo", "Azul", etc.).

Este módulo proporciona una interfaz completa para crear, editar, visualizar, activar y desactivar tanto atributos como sus valores asociados. La interfaz está dividida en dos paneles: uno para gestionar atributos y otro para gestionar los valores del atributo seleccionado.

## Tablas de Base de Datos

### Tabla Principal: `productos.atributos`

La tabla `atributos` almacena los atributos de los productos. Está ubicada en el esquema `productos` de PostgreSQL.

**Estructura de la tabla:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_atributo` | INTEGER (PK) | Identificador único del atributo |
| `codigo` | VARCHAR(10) | Código único del atributo (ej: "LAD", "MAT", "COL") |
| `nombre` | VARCHAR(100) | Nombre único del atributo (ej: "Lado", "Material", "Color") |
| `activo` | BOOLEAN | Indica si el atributo está activo o inactivo |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro |
| `fecha_modificacion` | TIMESTAMP | Fecha de última modificación |

**Relaciones:**
- **`valores`**: Relación uno-a-muchos con la tabla `productos.valores_atributo`. Un atributo puede tener múltiples valores asociados. La relación se establece mediante `valores_atributo.id_atributo` → `atributos.id_atributo`.
- **`atributos_asignados`**: Relación muchos-a-muchos con la tabla `productos.codigos_referencia` a través de la tabla intermedia `productos.atributos_asignados`.

### Tabla Secundaria: `productos.valores_atributo`

La tabla `valores_atributo` almacena los valores posibles para cada atributo.

**Estructura de la tabla:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_valor` | INTEGER (PK) | Identificador único del valor |
| `id_atributo` | INTEGER (FK) | Referencia al atributo padre |
| `codigo` | VARCHAR(30) | Código del valor (único dentro del atributo) |
| `valor` | VARCHAR(100) | Nombre del valor (ej: "Izquierdo", "Rojo", "Plástico") |
| `activo` | BOOLEAN | Indica si el valor está activo o inactivo |
| `fecha_creacion` | TIMESTAMP | Fecha de creación del registro |
| `fecha_modificacion` | TIMESTAMP | Fecha de última modificación |

**Restricciones:**
- Constraint único: `(id_atributo, codigo)` - El código debe ser único dentro de cada atributo, pero puede repetirse en diferentes atributos.

**Relaciones:**
- **`atributo`**: Relación muchos-a-uno con `productos.atributos`.
- **`atributos_asignados`**: Relación uno-a-muchos con `productos.atributos_asignados` (a través de `id_valor`).

## Estructura del Módulo

```
frontend/src/features/atributos/
├── components/
│   ├── AtributoForm.tsx          # Formulario para crear/editar atributos
│   ├── AtributosTable.tsx         # Tabla de visualización de atributos
│   ├── ValorAtributoForm.tsx      # Formulario para crear/editar valores
│   └── ValoresAtributoTable.tsx   # Tabla de visualización de valores
├── pages/
│   └── AtributosPage.tsx          # Página principal del módulo
├── services/
│   ├── atributoService.ts         # Servicios de API para atributos
│   └── valorAtributoService.ts    # Servicios de API para valores
├── types/
│   └── index.ts                  # Definiciones de tipos TypeScript
└── Atributos.md                   # Este archivo
```

## Funciones y Componentes

### Frontend

#### 1. **AtributosPage** (`pages/AtributosPage.tsx`)
Componente principal que gestiona el estado y la lógica de la página de atributos.

**Características:**
- Interfaz dividida en dos paneles (Grid layout):
  - Panel izquierdo: Lista de atributos
  - Panel derecho: Valores del atributo seleccionado
- Carga inicial de atributos desde el backend
- Carga dinámica de valores cuando se selecciona un atributo
- Filtro para incluir/excluir atributos inactivos
- Gestión de modales para crear/editar atributos y valores
- Manejo de estados de carga y errores

**Estados principales:**
- `atributos`: Lista de atributos cargados
- `loadingAtributos`: Estado de carga de atributos
- `selectedAtributo`: Atributo actualmente seleccionado
- `editingAtributo`: Atributo en modo edición
- `valores`: Lista de valores del atributo seleccionado
- `loadingValores`: Estado de carga de valores
- `editingValor`: Valor en modo edición
- `includeInactive`: Flag para incluir inactivos
- `error`: Mensajes de error
- `isSubmitting`: Estado de envío de formularios

**Funciones principales:**
- `handleSelectAtributo(atributo)`: Selecciona/deselecciona un atributo y carga sus valores
- `handleOpenAtributoModal(atributo)`: Abre el modal en modo creación o edición de atributo
- `handleOpenValorModal(valor)`: Abre el modal en modo creación o edición de valor
- `handleAtributoSubmit(values)`: Procesa el envío del formulario de atributo (crear/actualizar)
- `handleValorSubmit(values)`: Procesa el envío del formulario de valor (crear/actualizar)
- `handleDeactivateAtributo(atributo)`: Desactiva un atributo (con confirmación)
- `handleActivateAtributo(atributo)`: Activa un atributo (con confirmación)
- `handleDeactivateValor(valor)`: Desactiva un valor (con confirmación)
- `handleActivateValor(valor)`: Activa un valor (con confirmación)

#### 2. **AtributoForm** (`components/AtributoForm.tsx`)
Formulario reutilizable para crear y editar atributos.

**Campos:**
- `codigo` (requerido, 2-10 caracteres): Código único del atributo
- `nombre` (requerido, 3-100 caracteres): Nombre del atributo

**Validaciones:**
- Código y nombre son campos obligatorios
- El código debe tener entre 2 y 10 caracteres
- El nombre debe tener entre 3 y 100 caracteres
- El formulario se adapta automáticamente para modo creación o edición

#### 3. **AtributosTable** (`components/AtributosTable.tsx`)
Tabla interactiva para visualizar los atributos.

**Características:**
- Selección de filas al hacer clic (resalta la fila seleccionada)
- Acciones por fila:
  - **Editar**: Abre el modal en modo edición
  - **Desactivar**: Desactiva el atributo (solo si está activo)
  - **Activar**: Activa el atributo (solo si está inactivo)
- Indicador visual del estado (badge verde/gris)

**Columnas:**
- Código
- Atributo (nombre)
- Estado (Activo/Inactivo)
- Acciones

#### 4. **ValorAtributoForm** (`components/ValorAtributoForm.tsx`)
Formulario reutilizable para crear y editar valores de atributos.

**Campos:**
- `codigo` (requerido): Código del valor (único dentro del atributo)
- `valor` (requerido): Nombre del valor

**Validaciones:**
- Código y valor son campos obligatorios
- El formulario se adapta automáticamente para modo creación o edición

#### 5. **ValoresAtributoTable** (`components/ValoresAtributoTable.tsx`)
Tabla para visualizar los valores del atributo seleccionado.

**Características:**
- Muestra solo los valores del atributo seleccionado
- Acciones por fila:
  - **Editar**: Abre el modal en modo edición
  - **Desactivar**: Desactiva el valor (solo si está activo)
  - **Activar**: Activa el valor (solo si está inactivo)
- Indicador visual del estado (badge verde/gris)

**Columnas:**
- Código
- Valor
- Estado (Activo/Inactivo)
- Acciones

#### 6. **atributoService** (`services/atributoService.ts`)
Servicio que encapsula todas las llamadas al API del backend para atributos.

**Funciones:**
- `getAtributos(includeInactive)`: Obtiene todas las atributos (opcionalmente incluye inactivas)
- `createAtributo(data)`: Crea un nuevo atributo
- `updateAtributo(id, data)`: Actualiza un atributo existente
- `deactivateAtributo(id)`: Desactiva un atributo
- `activateAtributo(id)`: Activa un atributo

**Endpoints utilizados:**
- `GET /atributos?incluir_inactivos={boolean}`: Listar atributos
- `POST /atributos`: Crear atributo
- `PUT /atributos/{id}`: Actualizar atributo
- `PUT /atributos/{id}/deactivate`: Desactivar atributo
- `PUT /atributos/{id}/activate`: Activar atributo

#### 7. **valorAtributoService** (`services/valorAtributoService.ts`)
Servicio que encapsula todas las llamadas al API del backend para valores de atributos.

**Funciones:**
- `getValores(atributoId)`: Obtiene todos los valores de un atributo
- `createValor(atributoId, data)`: Crea un nuevo valor para un atributo
- `updateValor(atributoId, valorId, data)`: Actualiza un valor existente
- `deactivateValor(atributoId, valorId)`: Desactiva un valor
- `activateValor(atributoId, valorId)`: Activa un valor

**Endpoints utilizados:**
- `GET /atributos/{atributoId}/valores`: Listar valores de un atributo
- `POST /atributos/{atributoId}/valores`: Crear valor
- `PUT /atributos/{atributoId}/valores/{valorId}`: Actualizar valor
- `PUT /atributos/{atributoId}/valores/{valorId}/deactivate`: Desactivar valor
- `PUT /atributos/{atributoId}/valores/{valorId}/activate`: Activar valor

#### 8. **Types** (`types/index.ts`)
Definiciones de tipos TypeScript.

**Interfaces:**
- `Atributo`: Representa un atributo completo con todos sus campos
- `ValorAtributo`: Representa un valor de atributo
- `AtributoPayload`: Payload para crear/actualizar atributos
- `ValorAtributoPayload`: Payload para crear/actualizar valores
- `AtributoFormData`: Datos del formulario de atributo
- `ValorAtributoFormData`: Datos del formulario de valor

### Backend

#### 1. **Modelo Atributo** (`backend/app/models/productos/caracteristicas.py`)
Modelo SQLAlchemy que representa la tabla `atributos`.

**Características:**
- Hereda de `MixinAuditoria` (campos `activo`, `fecha_creacion`, `fecha_modificacion`)
- Validación automática: `codigo` se convierte a mayúsculas
- Relación con `ValorAtributo` mediante `valores` con cascade delete

**Métodos:**
- `validate_fields(key, value)`: Valida y normaliza los campos

#### 2. **Modelo ValorAtributo** (`backend/app/models/productos/caracteristicas.py`)
Modelo SQLAlchemy que representa la tabla `valores_atributo`.

**Características:**
- Hereda de `MixinAuditoria`
- Validación automática: `codigo` se convierte a mayúsculas
- Constraint único: `(id_atributo, codigo)`
- Relación con `Atributo` mediante `atributo`

**Métodos:**
- `validate_fields(key, value)`: Valida y normaliza los campos

#### 3. **AtributoService** (`backend/app/api/v1/services/atributo_service.py`)
Servicio que contiene la lógica de negocio para las operaciones con atributos.

**Métodos estáticos:**
- `get_all_atributos(include_inactive)`: Obtiene todas las atributos, opcionalmente incluyendo inactivas
- `get_atributo_by_id(atributo_id)`: Obtiene un atributo por ID (404 si no existe)
- `create_atributo(data)`: Crea un nuevo atributo
  - Valida que el código no exista
  - Valida que el nombre no exista
  - Convierte el código a mayúsculas
- `update_atributo(atributo_id, data)`: Actualiza un atributo
  - Valida que el nuevo código no esté en uso (si se modifica)
  - Valida que el nuevo nombre no esté en uso (si se modifica)
- `deactivate_atributo(atributo_id)`: Desactiva un atributo
- `activate_atributo(atributo_id)`: Activa un atributo

#### 4. **ValorAtributoService** (`backend/app/api/v1/services/valor_atributo_service.py`)
Servicio que contiene la lógica de negocio para las operaciones con valores de atributos.

**Métodos estáticos:**
- `get_valores_by_atributo_id(atributo_id, include_inactive)`: Obtiene todos los valores de un atributo
- `create_valor(atributo_id, data)`: Crea un nuevo valor
  - Valida que el atributo exista
  - Valida que el código no exista para ese atributo
  - Convierte el código a mayúsculas
- `update_valor(valor_id, data)`: Actualiza un valor
  - Valida que el nuevo código no esté en uso para ese atributo (si se modifica)
- `deactivate_valor(valor_id)`: Desactiva un valor
- `activate_valor(valor_id)`: Activa un valor
- `get_valor_by_id(valor_id)`: Obtiene un valor por ID (404 si no existe)
- `get_valor_by_codigo(atributo_id, codigo)`: Obtiene un valor por código y atributo

#### 5. **Routes** (`backend/app/api/v1/routes/atributo_routes.py`)
Rutas Flask que exponen los endpoints REST para atributos.

**Endpoints:**
- `POST /atributos`: Crear atributo (requiere JWT y permiso `productos:crear`)
- `GET /atributos`: Listar atributos (requiere JWT y permiso `productos:listar`)
- `GET /atributos/<id>`: Obtener atributo por ID (requiere JWT y permiso `productos:ver`)
- `PUT /atributos/<id>`: Actualizar atributo (requiere JWT y permiso `productos:editar`)
- `PUT /atributos/<id>/deactivate`: Desactivar atributo (requiere JWT y permiso `productos:cambiar-estado`)
- `PUT /atributos/<id>/activate`: Activar atributo (requiere JWT y permiso `productos:cambiar-estado`)

**Rutas anidadas:**
El blueprint de valores está registrado como sub-blueprint, por lo que las rutas de valores son:
- `POST /atributos/<atributo_id>/valores`: Crear valor
- `GET /atributos/<atributo_id>/valores`: Listar valores
- `GET /atributos/<atributo_id>/valores/<valor_id>`: Obtener valor por ID
- `GET /atributos/<atributo_id>/valores/<codigo>`: Obtener valor por código
- `PUT /atributos/<atributo_id>/valores/<valor_id>`: Actualizar valor
- `PUT /atributos/<atributo_id>/valores/<valor_id>/activate`: Activar valor
- `PUT /atributos/<atributo_id>/valores/<valor_id>/deactivate`: Desactivar valor

**Autenticación y Permisos:**
Todos los endpoints requieren autenticación JWT mediante el decorador `@jwt_required()` y permisos específicos mediante `@permission_required()`.

#### 6. **Schemas** (`backend/app/api/v1/schemas/atributo_schemas.py`)
Schemas de Marshmallow para validación y serialización.

**Schemas:**
- `AtributoSchema`: Para serialización completa de atributos (incluye valores anidados)
- `UpdateAtributoSchema`: Para actualización de atributos (campos opcionales)
- `ValorAtributoSchema`: Para serialización de valores de atributos
- `UpdateValorAtributoSchema`: Para actualización de valores (definido en `valor_atributo_schemas.py`)

## Flujo de Funcionamiento

### Crear un Nuevo Atributo

1. Usuario hace clic en el botón flotante "Crear Atributo"
2. Se abre el modal con `AtributoForm` en modo creación
3. Usuario completa los campos requeridos (código y nombre)
4. Al enviar, `handleAtributoSubmit` llama a `createAtributo` del servicio
5. El servicio hace `POST /atributos` al backend
6. El backend valida los datos, verifica que el código y nombre no existan, crea el registro y retorna el atributo creado
7. El frontend actualiza la lista y muestra notificación de éxito

### Editar un Atributo

1. Usuario hace clic en el ícono de editar en una fila de la tabla de atributos
2. Se abre el modal con `AtributoForm` prellenado con los datos del atributo
3. Usuario modifica los campos deseados
4. Al enviar, `handleAtributoSubmit` detecta que está en modo edición y llama a `updateAtributo`
5. El servicio hace `PUT /atributos/{id}` al backend
6. El backend valida los datos, verifica que el nuevo código/nombre no estén en uso (si se cambiaron), actualiza el registro y retorna el atributo actualizado
7. El frontend actualiza la lista y muestra notificación de éxito

### Crear un Nuevo Valor

1. Usuario selecciona un atributo de la lista (panel izquierdo)
2. Se cargan automáticamente los valores del atributo seleccionado (panel derecho)
3. Usuario hace clic en el botón "Añadir Valor"
4. Se abre el modal con `ValorAtributoForm` en modo creación
5. Usuario completa los campos requeridos (código y valor)
6. Al enviar, `handleValorSubmit` llama a `createValor` del servicio
7. El servicio hace `POST /atributos/{atributoId}/valores` al backend
8. El backend valida los datos, verifica que el código no exista para ese atributo, crea el registro y retorna el valor creado
9. El frontend actualiza la lista de valores y muestra notificación de éxito

### Editar un Valor

1. Usuario selecciona un atributo y luego hace clic en el ícono de editar en una fila de la tabla de valores
2. Se abre el modal con `ValorAtributoForm` prellenado con los datos del valor
3. Usuario modifica los campos deseados
4. Al enviar, `handleValorSubmit` detecta que está en modo edición y llama a `updateValor`
5. El servicio hace `PUT /atributos/{atributoId}/valores/{valorId}` al backend
6. El backend valida los datos, verifica que el nuevo código no esté en uso para ese atributo (si se cambió), actualiza el registro y retorna el valor actualizado
7. El frontend actualiza la lista de valores y muestra notificación de éxito

### Desactivar un Atributo o Valor

1. Usuario hace clic en el ícono de desactivar en una fila activa
2. Se muestra un modal de confirmación
3. Al confirmar, se llama al servicio correspondiente (`deactivateAtributo` o `deactivateValor`)
4. El servicio hace `PUT /atributos/{id}/deactivate` o `PUT /atributos/{atributoId}/valores/{valorId}/deactivate` al backend
5. El backend desactiva el registro y retorna el registro actualizado
6. El frontend actualiza la lista y muestra notificación de éxito

### Activar un Atributo o Valor

1. Usuario hace clic en el ícono de activar en una fila inactiva
2. Se muestra un modal de confirmación
3. Al confirmar, se llama al servicio correspondiente (`activateAtributo` o `activateValor`)
4. El servicio hace `PUT /atributos/{id}/activate` o `PUT /atributos/{atributoId}/valores/{valorId}/activate` al backend
5. El backend activa el registro y retorna el registro actualizado
6. El frontend actualiza la lista y muestra notificación de éxito

## Reglas de Negocio

1. **Código único de atributo**: El `codigo` del atributo debe ser único en todo el sistema
2. **Nombre único de atributo**: El `nombre` del atributo debe ser único en todo el sistema
3. **Código único de valor por atributo**: El `codigo` del valor debe ser único dentro de cada atributo, pero puede repetirse en diferentes atributos
4. **Normalización**: Los códigos se almacenan siempre en mayúsculas
5. **Cascade delete**: Si se elimina un atributo, se eliminan automáticamente todos sus valores (configurado en la relación SQLAlchemy)
6. **Soft delete**: Los atributos y valores no se eliminan físicamente, solo se desactivan
7. **Campos requeridos**: 
   - Atributo: `codigo` y `nombre` son obligatorios
   - Valor: `codigo` y `valor` son obligatorios
8. **Validaciones de longitud**:
   - Código de atributo: 2-10 caracteres
   - Nombre de atributo: 3-100 caracteres
   - Código de valor: máximo 30 caracteres
   - Valor: máximo 100 caracteres

## Dependencias

### Frontend
- `@mantine/core`: Componentes UI
- `@mantine/hooks`: Hooks (useDisclosure)
- `@mantine/notifications`: Sistema de notificaciones
- `@mantine/modals`: Modales de confirmación
- `axios`: Cliente HTTP (a través de `apiClient`)

### Backend
- `Flask`: Framework web
- `SQLAlchemy`: ORM
- `Marshmallow`: Validación y serialización
- `Flask-JWT-Extended`: Autenticación JWT

## Notas de Implementación

- El módulo utiliza una interfaz de dos paneles: atributos a la izquierda, valores a la derecha
- La carga de valores es dinámica y se realiza automáticamente al seleccionar un atributo
- Los errores se manejan mediante notificaciones de Mantine
- Todas las operaciones requieren autenticación JWT y permisos específicos
- Los códigos se normalizan automáticamente a mayúsculas tanto en frontend como backend
- La relación entre atributos y valores es jerárquica: los valores no pueden existir sin un atributo padre
- El módulo está diseñado para ser usado en la gestión de características de productos, permitiendo definir atributos genéricos (como "Color") y sus valores específicos (como "Rojo", "Azul", etc.)

