# Módulo de Autenticación

## Descripción

El módulo de Autenticación gestiona el inicio de sesión de usuarios internos del sistema. Utiliza autenticación basada en JWT (JSON Web Tokens) con dos tipos de tokens: access token (corto plazo) y refresh token (largo plazo). El sistema implementa renovación automática de tokens mediante interceptores de axios, protegiendo las rutas del frontend y validando las credenciales contra la base de datos.

## Tablas de Base de Datos

### Tabla Principal: `entidades.usuarios`

La tabla `usuarios` almacena la información de los usuarios internos del sistema. Está ubicada en el esquema `entidades` de PostgreSQL.

**Estructura de la tabla (campos relevantes para autenticación):**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id_usuario` | INTEGER (PK) | Identificador único del usuario |
| `email` | VARCHAR(100) | Email único del usuario (usado para login) |
| `password_hash` | VARCHAR(255) | Hash de la contraseña (usando Werkzeug) |
| `nombre_completo` | VARCHAR(150) | Nombre completo del usuario |
| `activo` | BOOLEAN | Indica si el usuario está activo o inactivo |
| `fecha_ultimo_login` | TIMESTAMP | Fecha del último inicio de sesión |

**Métodos del modelo:**
- `set_password(password)`: Genera y almacena el hash de la contraseña
- `check_password(password)`: Verifica si la contraseña proporcionada coincide con el hash almacenado

**Relaciones:**
- **`area`**: Relación muchos-a-uno con `entidades.areas`
- **`roles`**: Relación muchos-a-muchos con `entidades.roles` (a través de tabla intermedia)
- **`jefe_directo`**: Relación auto-referencial (jerarquía de usuarios)

## Estructura del Módulo

```
frontend/src/features/auth/
├── LoginPage.tsx              # Página de inicio de sesión
├── LoginPage.module.css       # Estilos de la página de login
└── Auth.md                    # Este archivo

frontend/src/context/
└── AuthContext.tsx            # Contexto de React para autenticación

frontend/src/api/
├── authService.ts            # Servicios de API (login, refresh)
└── axios.ts                  # Cliente HTTP con interceptores

frontend/src/types/
└── auth.ts                   # Definiciones de tipos TypeScript

backend/app/api/v1/
├── routes/
│   └── auth_routes.py        # Rutas de autenticación
├── services/
│   └── auth_service.py       # Lógica de negocio de autenticación
└── schemas/
    └── auth_schemas.py       # Schemas de validación
```

## Funciones y Componentes

### Frontend

#### 1. **LoginPage** (`features/auth/LoginPage.tsx`)
Componente de página para el inicio de sesión.

**Características:**
- Formulario de login con validación usando `react-hook-form`
- Campos: email y contraseña
- Diseño centrado con logo de la empresa
- Redirección automática después del login exitoso
- Manejo de errores con alertas

**Funcionalidades:**
- Validación de campos requeridos
- Integración con `AuthContext` para realizar el login
- Navegación a la página principal después del login exitoso
- Enlace para recuperación de contraseña (UI presente, funcionalidad pendiente)

#### 2. **AuthContext** (`context/AuthContext.tsx`)
Contexto de React que gestiona el estado global de autenticación.

**Estados:**
- `token`: Token de acceso actual (null si no está autenticado)
- `isLoading`: Estado de carga inicial (verificando tokens en localStorage)
- `isAuthenticated`: Boolean derivado de la existencia del token

**Funciones:**
- `login(credentials)`: Realiza el login y almacena los tokens
- `logout()`: Limpia los tokens y cierra la sesión

**Comportamiento:**
- Al cargar la aplicación, verifica si existen tokens en `localStorage`
- Solo establece el token si existen tanto `authToken` como `refreshToken`
- Si falta alguno, limpia ambos del `localStorage`
- Proporciona el hook `useAuth()` para consumir el contexto

#### 3. **authService** (`api/authService.ts`)
Servicio que encapsula las llamadas al API de autenticación.

**Funciones:**
- `login(credentials)`: Realiza el login y retorna los tokens
  - Endpoint: `POST /auth/login`
  - Payload: `{ email, password }`
  - Retorna: `{ message, access_token, refresh_token }`
- `refreshToken()`: Renueva el access token usando el refresh token
  - Endpoint: `POST /auth/refresh`
  - Headers: `Authorization: Bearer {refreshToken}`
  - Retorna: `{ access_token }`

#### 4. **axios Client** (`api/axios.ts`)
Cliente HTTP configurado con interceptores para manejo automático de tokens.

**Interceptores de Request:**
- Inyecta automáticamente el `access_token` en el header `Authorization` de todas las peticiones
- Excluye el endpoint de refresh para evitar bucles infinitos

**Interceptores de Response:**
- Detecta errores 401 (Unauthorized)
- Intenta renovar el token automáticamente usando el refresh token
- Si la renovación es exitosa, reintenta la petición original con el nuevo token
- Si la renovación falla, limpia los tokens y redirige al login

**Configuración:**
- Base URL desde variable de entorno `VITE_API_BASE_URL`
- Content-Type: `application/json`

#### 5. **Types** (`types/auth.ts`)
Definiciones de tipos TypeScript.

**Interfaces:**
- `UserCredentials`: `{ email: string, password: string }`
- `AuthResponse`: `{ message: string, access_token: string, refresh_token: string }`

#### 6. **ProtectedLayout** (`App.tsx`)
Componente wrapper que protege las rutas privadas.

**Funcionalidad:**
- Verifica si el usuario está autenticado usando `useAuth()`
- Si no está autenticado, redirige a `/login`
- Si está autenticado, renderiza el `MainLayout` con las rutas protegidas

**Uso:**
- Todas las rutas de la aplicación (excepto `/login`) están envueltas en `ProtectedLayout`
- La ruta `/login` tiene lógica inversa: redirige a `/` si ya está autenticado

### Backend

#### 1. **Modelo Usuario** (`backend/app/models/entidades/usuarios.py`)
Modelo SQLAlchemy que representa la tabla `usuarios`.

**Métodos de seguridad:**
- `set_password(password)`: Genera el hash de la contraseña usando `generate_password_hash` de Werkzeug
- `check_password(password)`: Verifica la contraseña usando `check_password_hash` de Werkzeug

**Validaciones:**
- El email debe ser único
- El usuario debe estar activo para poder hacer login

#### 2. **AuthService** (`backend/app/api/v1/services/auth_service.py`)
Servicio que contiene la lógica de negocio para la autenticación.

**Método estático:**
- `login(data)`: Procesa el login de un usuario
  1. Busca el usuario por email
  2. Valida que el usuario exista y la contraseña sea correcta
  3. Verifica que el usuario esté activo
  4. Genera access token y refresh token usando Flask-JWT-Extended
  5. Retorna los tokens junto con un mensaje de bienvenida

**Retornos:**
- Éxito (200): `{ message, access_token, refresh_token }`
- Credenciales inválidas (401): `{ error: "Credenciales inválidas" }`
- Usuario inactivo (403): `{ error: "El usuario se encuentra inactivo" }`

#### 3. **Routes** (`backend/app/api/v1/routes/auth_routes.py`)
Rutas Flask que exponen los endpoints REST de autenticación.

**Endpoints:**
- `POST /auth/login`: Inicio de sesión
  - No requiere autenticación
  - Valida los datos con `LoginSchema`
  - Llama a `AuthService.login()`
  - Retorna tokens o error

- `POST /auth/refresh`: Renovación de access token
  - Requiere refresh token válido (`@jwt_required(refresh=True)`)
  - Genera un nuevo access token
  - Retorna el nuevo access token

#### 4. **Schemas** (`backend/app/api/v1/schemas/auth_schemas.py`)
Schemas de Marshmallow para validación de datos.

**Schemas:**
- `LoginSchema`: Valida los datos de login
  - `email`: Email válido (requerido)
  - `password`: String con mínimo 8 caracteres (requerido)

## Flujo de Funcionamiento

### Proceso de Login

1. Usuario ingresa email y contraseña en `LoginPage`
2. Al enviar el formulario, se llama a `login()` del `AuthContext`
3. `AuthContext` llama a `apiLogin()` del servicio
4. El servicio hace `POST /auth/login` al backend
5. El backend:
   - Valida los datos con `LoginSchema`
   - Busca el usuario por email
   - Verifica la contraseña usando `check_password()`
   - Verifica que el usuario esté activo
   - Genera access token (30 minutos) y refresh token (30 días)
   - Retorna los tokens
6. El frontend almacena ambos tokens en `localStorage`
7. El frontend actualiza el estado `token` en `AuthContext`
8. El usuario es redirigido a la página principal

### Renovación Automática de Tokens

1. Usuario hace una petición a cualquier endpoint protegido
2. El interceptor de request inyecta el access token en el header
3. Si el access token expiró, el backend responde con 401
4. El interceptor de response detecta el 401
5. Automáticamente llama a `refreshToken()` usando el refresh token
6. Si el refresh es exitoso:
   - Actualiza el access token en `localStorage`
   - Reintenta la petición original con el nuevo token
7. Si el refresh falla:
   - Limpia ambos tokens del `localStorage`
   - Redirige al usuario a `/login`

### Protección de Rutas

1. Usuario intenta acceder a una ruta protegida
2. `ProtectedLayout` verifica `isAuthenticated` del `AuthContext`
3. Si no está autenticado, redirige a `/login`
4. Si está autenticado, renderiza el `MainLayout` con las rutas

### Logout

1. Usuario hace clic en logout (o el sistema lo fuerza por token expirado)
2. Se llama a `logout()` del `AuthContext`
3. Se eliminan ambos tokens del `localStorage`
4. Se establece `token` a `null` en el estado
5. El usuario es redirigido a `/login` (automáticamente por `ProtectedLayout`)

## Configuración JWT

### Backend (`config.py`)

```python
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'una-clave-super-secreta'
JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)  # 30 minutos
JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)    # 30 días
```

### Frontend

Los tokens se almacenan en `localStorage`:
- `authToken`: Access token
- `refreshToken`: Refresh token

## Reglas de Negocio

1. **Email único**: El email debe ser único en la tabla de usuarios
2. **Contraseña mínima**: La contraseña debe tener al menos 8 caracteres
3. **Usuario activo**: Solo usuarios con `activo = true` pueden hacer login
4. **Hash de contraseña**: Las contraseñas se almacenan como hash usando Werkzeug (PBKDF2)
5. **Tokens JWT**: 
   - Access token expira en 30 minutos
   - Refresh token expira en 30 días
   - El refresh token se usa solo para renovar el access token
6. **Renovación automática**: El sistema intenta renovar automáticamente el access token cuando expira
7. **Logout forzado**: Si el refresh token expira o es inválido, el usuario es deslogueado automáticamente

## Seguridad

### Medidas Implementadas

1. **Contraseñas hasheadas**: Nunca se almacenan en texto plano
2. **JWT con expiración**: Tokens con tiempo de vida limitado
3. **Refresh tokens**: Permiten renovar access tokens sin reingresar credenciales
4. **Validación de usuario activo**: Usuarios inactivos no pueden hacer login
5. **HTTPS recomendado**: Los tokens se transmiten en headers (requiere HTTPS en producción)
6. **Interceptores automáticos**: Renovación transparente de tokens sin intervención del usuario

### Consideraciones

- Los tokens se almacenan en `localStorage`, que es vulnerable a XSS. En aplicaciones de alta seguridad, considerar `httpOnly` cookies.
- El refresh token tiene una vida útil larga (30 días). Considerar implementar revocación de tokens.
- No se implementa rate limiting en los endpoints de autenticación (considerar para prevenir ataques de fuerza bruta).


## Notas de Implementación

- El módulo de autenticación es fundamental para el sistema y se integra con todos los demás módulos
- Todos los endpoints del backend (excepto `/auth/login`) requieren un JWT válido
- El sistema utiliza un patrón de "refresh token rotation" implícito (cada refresh genera un nuevo access token)
- La protección de rutas en el frontend es preventiva, pero el backend siempre valida los tokens
- El contexto de autenticación se inicializa en `main.tsx` envolviendo toda la aplicación con `AuthProvider`
- Los interceptores de axios manejan automáticamente la renovación de tokens, haciendo el proceso transparente para el desarrollador

