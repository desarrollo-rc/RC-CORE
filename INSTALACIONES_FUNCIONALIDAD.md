# Sistema de Gestión de Instalaciones - Documentación Funcional

## 📋 Descripción General

El sistema de instalaciones gestiona el ciclo completo de instalación del software RepuestosCenter en equipos de clientes, desde la solicitud inicial hasta la finalización con capacitación. Incluye gestión de usuarios, equipos y sincronización con portal corporativo.

---

## 🗂️ Modelo de Datos

### Tabla: `instalaciones`

```python
class Instalacion(db.Model):
    __tablename__ = 'instalaciones'
    
    # Campos principales
    id = Column(Integer, primary_key=True)
    vendedor_id = Column(Integer, ForeignKey('vendedores.id'), nullable=False)
    cliente_id = Column(Integer, ForeignKey('clientes.id'), nullable=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=True)  # Se crea cuando se aprueba
    equipo_id = Column(Integer, ForeignKey('equipos.id'), nullable=True)     # Se activa cuando se finaliza
    
    # Estados y fechas
    estado = Column(String(30), default='pendiente')  
    # Posibles valores: 'pendiente', 'aprobada', 'configuracion_pendiente', 
    #                   'usuario_creado', 'instalada', 'finalizada'
    
    fecha_solicitud = Column(DateTime, default=datetime.utcnow)
    fecha_aprobacion = Column(DateTime, nullable=True)
    fecha_instalacion = Column(DateTime, nullable=True)
    fecha_finalizacion = Column(DateTime, nullable=True)
    
    # Otros
    observaciones = Column(String(255), nullable=True)
    activa = Column(Boolean, default=True)
    
    # Relaciones
    vendedor = relationship('Vendedor')
    cliente = relationship('Cliente')
    usuario = relationship('Usuario')
    equipo = relationship('Equipo')
```

### Relaciones con Otras Tablas

#### ClienteB2B (Requerido para instalaciones)
```python
class ClienteB2B(db.Model):
    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey('clientes.id'), unique=True)
    canal_id = Column(Integer, ForeignKey('canales.id'))
    lista_precio_id = Column(Integer, ForeignKey('listas_precio.id'))
    bloqueado = Column(Boolean, default=False)
    estado = Column(String(20), default='activo')
    observaciones = Column(Text, nullable=True)
```

**Nota importante:** Si un cliente no tiene registro en `ClienteB2B`, se crea automáticamente al crear el usuario de la instalación.

#### Usuario
```python
class Usuario(db.Model):
    id = Column(Integer, primary_key=True)
    cliente_b2b_id = Column(Integer, ForeignKey('clientes_b2b.id'))
    cliente_id = Column(Integer, ForeignKey('clientes.id'))  # Compatibilidad
    nombre = Column(String(100))
    usuario = Column(String(50), unique=True)
    email = Column(String(100))
    clave = Column(String(100))  # Formato: {usuario}.,{año}.*
    numero = Column(String(20))
    estado = Column(Boolean, default=True)
```

#### Equipo
```python
class Equipo(db.Model):
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'))
    equipo = Column(String(100))  # Nombre del equipo
    mac = Column(String(17))      # Dirección MAC
    procesador = Column(String(200))
    placa = Column(String(200))
    disco = Column(String(200))
    estado = Column(Boolean, default=False)  # Activo/Inactivo
    alta = Column(Boolean, default=False)    # Aprobado/Rechazado
```

---

## 🔄 Flujo de Estados

```
┌─────────────┐
│  pendiente  │ ← Solicitud inicial creada
└──────┬──────┘
       │ (Aprobar)
       ▼
┌─────────────┐
│  aprobada   │ ← Jefatura aprueba
└──────┬──────┘
       │ (Crear usuario)
       ▼
┌──────────────────────────┐
│  usuario_creado          │ ← Usuario creado exitosamente
│                          │
│  configuracion_pendiente │ ← (Alternativo) Si falla automatización
└──────┬───────────────────┘
       │ (Instalar equipo)
       ▼
┌─────────────┐
│ instalada   │ ← Equipo asignado
└──────┬──────┘
       │ (Finalizar)
       ▼
┌─────────────┐
│ finalizada  │ ← Proceso completo
└─────────────┘
```

### Validaciones por Estado

```python
def puede_ser_aprobada(self):
    return self.estado == 'pendiente' and self.vendedor_id is not None

def puede_crear_usuario(self):
    return self.estado == 'aprobada' and self.cliente_id is not None

def puede_ser_instalada(self):
    return self.estado in ['usuario_creado', 'configuracion_pendiente']

def puede_ser_finalizada(self):
    return self.estado == 'instalada'
```

---

## 🛣️ API Endpoints

### 1. Solicitar Instalación
```http
POST /api/instalaciones
Content-Type: application/json

{
  "vendedor_id": 1,
  "cliente_id": 5,
  "observaciones": "Instalación urgente",
  "estado": "pendiente",  // Opcional: "aprobada" para instalaciones previas
  "fecha_solicitud": "2025-01-15"  // Opcional
}
```

**Lógica importante:**
- Verificar que el cliente tenga vendedor asignado
- Si `estado: "aprobada"`, establecer automáticamente `fecha_aprobacion`
- Si el cliente NO es B2B, crear automáticamente `ClienteB2B`

### 2. Aprobar Instalación
```http
PUT /api/instalaciones/{id}/aprobar
```

**Acciones:**
- `estado` → `'aprobada'`
- `fecha_aprobacion` → `datetime.utcnow()`

### 3. Crear Usuario para Instalación
```http
POST /api/instalaciones/{id}/crear-usuario
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "usuario": "juanp",
  "email": "juan@cliente.com",
  "numero": "+56912345678",
  "existe_en_corp": false,      // Usuario ya existe en portal Corp
  "existe_en_sistema": false    // Usuario ya existe en BD local
}
```

**Lógica de creación (3 escenarios):**

#### Escenario 1: Usuario existe en sistema local
```python
if existe_en_sistema:
    # Solo vincular usuario existente
    instalacion.usuario_id = usuario_id
    instalacion.estado = 'usuario_creado'
    # NO crear ni automatizar nada
```

#### Escenario 2: Usuario existe en Corp pero NO en sistema
```python
if existe_en_corp and not existe_en_sistema:
    # Crear usuario localmente con datos proporcionados
    nuevo_usuario = Usuario(
        cliente_b2b_id=cliente_b2b.id,
        nombre=data['nombre'],
        usuario=data['usuario'],
        email=data['email'],
        numero=data['numero'],
        clave=f"{data['usuario']}.,{año_actual}.*",
        estado=True
    )
    instalacion.usuario_id = nuevo_usuario.id
    instalacion.estado = 'usuario_creado'
```

#### Escenario 3: Usuario NO existe en ningún sistema
```python
else:
    # Crear usuario localmente
    nuevo_usuario = Usuario(...)
    instalacion.usuario_id = nuevo_usuario.id
    
    # Llamar automatización para crear en Corp
    result = create_user_on_corp_site(user_data)
    
    if result['success']:
        instalacion.estado = 'usuario_creado'
    else:
        instalacion.estado = 'configuracion_pendiente'
```

**Importante:** Asegurar que exista `ClienteB2B`:
```python
cliente_b2b = ClienteB2B.query.filter_by(cliente_id=instalacion.cliente_id).first()
if not cliente_b2b:
    nuevo_cliente_b2b = ClienteB2B(
        cliente_id=instalacion.cliente_id,
        canal_id=1,  # Canal B2B por defecto
        lista_precio_id=cliente_original.lista_precio_id,
        bloqueado=False,
        observaciones='ClienteB2B creado automáticamente desde creación de usuario.'
    )
    db.session.add(nuevo_cliente_b2b)
    db.session.flush()
    cliente_b2b = nuevo_cliente_b2b
```

### 4. Vincular Usuario Existente
```http
POST /api/instalaciones/{id}/vincular-usuario
Content-Type: application/json

{
  "usuario_id": 10,
  "existe_en_corp": true,
  "existe_en_sistema": true
}
```

**Lógica:**
- Si existe en ambos: Solo vincular, no automatizar
- Si existe en sistema pero no en Corp: Vincular + automatizar creación en Corp

### 5. Continuar Configuración (Reintentar)
```http
POST /api/instalaciones/{id}/continuar-configuracion
```

**Uso:** Cuando `estado == 'configuracion_pendiente'`
- Reintenta la automatización con los datos del usuario ya creado
- Si tiene éxito: `estado` → `'usuario_creado'`

### 6. Forzar Estado Usuario Creado
```http
POST /api/instalaciones/{id}/forzar-estado-usuario-creado
```

**Uso:** Cuando el usuario se creó exitosamente en Corp pero falló la confirmación
- `estado` → `'usuario_creado'` (forzado manualmente)

### 7. Eliminar Usuario
```http
DELETE /api/instalaciones/{id}/eliminar-usuario
```

**Acciones:**
- Eliminar usuario de la BD
- `instalacion.usuario_id` → `NULL`
- `estado` → `'aprobada'`

### 8. Sincronizar Equipos desde Corp
```http
POST /api/instalaciones/{id}/sincronizar-equipos
```

**Respuesta:**
```json
{
  "ok": true,
  "equipos": [
    {
      "id": 1,
      "usuario_id": 5,
      "usuario": "juanp",
      "equipo": "PC-JUAN-01",
      "mac": "00:1B:63:84:45:E6",
      "procesador": "Intel Core i5-9400",
      "placa": "ASUS PRIME B365M-A",
      "disco": "Kingston 240GB SSD",
      "estado": false,    // Activo/Inactivo
      "alta": true,       // Aprobado/Rechazado
      "alta_str": "Aprobado"
    }
  ]
}
```

**Lógica de sincronización:**
- Llamar automatización `get_equipment_from_corp_site(username, cliente_nombre)`
- Para cada equipo del portal:
  - Buscar por coincidencia exacta: `(usuario_id, equipo, mac, procesador, placa, disco)`
  - Si existe: Actualizar solo `estado` y `alta`
  - Si NO existe: Crear nuevo registro
- Retornar lista completa de equipos

### 9. Activar Equipo e Instalar
```http
POST /api/instalaciones/{id}/activar-equipo
Content-Type: application/json

{
  "equipo_id": 15
}
```

**Lógica crítica:**
1. Validar que el equipo pertenece al usuario de la instalación
2. Obtener todos los equipos del usuario
3. **Filtrar equipos a desactivar:**
   - Excluir el equipo a activar
   - Excluir equipos que ya están rechazados E inactivos (`alta=False AND estado=False`)
   - Excluir equipos duplicados (mismo MAC, nombre, procesador, placa, disco)
4. Llamar automatización `manage_user_equipment_activation()` (si aplica)
5. Actualizar BD local:
   - Equipo seleccionado: `estado=True`, `alta=True`
   - Otros equipos: `estado=False`, `alta=False`

**Respuesta:**
```json
{
  "success": true,
  "message": "Equipo PC-JUAN-01 activado exitosamente y 2 equipos desactivados",
  "equipos_desactivados": 2
}
```

### 10. Instalar Equipo
```http
PUT /api/instalaciones/{id}/instalar
Content-Type: application/json

{
  "equipo_id": 15  // ID del equipo ya activado
}
```

**Acciones:**
- Asociar `equipo_id` a la instalación
- `estado` → `'instalada'`
- `fecha_instalacion` → `datetime.utcnow()`

### 11. Finalizar Instalación
```http
PUT /api/instalaciones/{id}/finalizar
Content-Type: application/json

{
  "capacitacion_realizada": true  // o false
}
```

**Acciones:**
- Agregar observación sobre capacitación
- `estado` → `'finalizada'`
- `fecha_finalizacion` → `datetime.utcnow()`
- Activar equipo: `equipo.estado = True`

### 12. Descargar Paquete de Instalación
```http
GET /api/instalaciones/{id}/paquete
```

**Respuesta:** Archivo ZIP con:
- `INSTALAR_SIN_PYTHON.bat` - Lanzador principal
- `InstalarRepuestosCenter.ps1` - Script PowerShell automático
- `automatizador_instalacion.py` - Script Python (backup manual)
- `credenciales.txt` - Credenciales del usuario
- `INSTRUCCIONES.txt` - Guía detallada

Ver sección "Generador de Paquetes" para detalles completos.

---

## 📊 Métodos del Modelo

### `to_dict()` - Serialización Completa
```python
def to_dict(self):
    cliente_principal = self.get_cliente_principal()
    
    data = {
        'id': self.id,
        'vendedor_id': self.vendedor_id,
        'vendedor_nombre': self.vendedor.nombre if self.vendedor else None,
        'cliente_id': self.cliente_id,
        'cliente_nombre': cliente_principal.nombre if cliente_principal else None,
        'usuario_id': self.usuario_id,
        'equipo_id': self.equipo_id,
        'estado': self.estado,
        'fecha_solicitud': self.fecha_solicitud.isoformat() if self.fecha_solicitud else None,
        'fecha_aprobacion': self.fecha_aprobacion.isoformat() if self.fecha_aprobacion else None,
        'fecha_instalacion': self.fecha_instalacion.isoformat() if self.fecha_instalacion else None,
        'fecha_finalizacion': self.fecha_finalizacion.isoformat() if self.fecha_finalizacion else None,
        'observaciones': self.observaciones,
        'activa': self.activa,
        'es_b2b': self.es_instalacion_b2b()
    }
    
    # Información del usuario (si existe)
    if self.usuario:
        data.update({
            'usuario_nombre': self.usuario.nombre,
            'usuario_email': self.usuario.email,
            'usuario_usuario': self.usuario.usuario,
            'cliente_b2b_id': self.usuario.cliente_b2b_id,
        })
        
        # Información del ClienteB2B
        if self.usuario.cliente_b2b:
            data['cliente_b2b'] = {
                'id': self.usuario.cliente_b2b.id,
                'estado': self.usuario.cliente_b2b.estado,
                'bloqueado': self.usuario.cliente_b2b.bloqueado,
                'observaciones': self.usuario.cliente_b2b.observaciones,
                'canales': [{'id': c.id, 'nombre': c.nombre} 
                           for c in self.usuario.cliente_b2b.canales]
            }
    
    # Información del equipo (si existe)
    if self.equipo:
        data.update({
            'equipo_nombre': self.equipo.equipo,
            'equipo_mac': self.equipo.mac,
            'equipo_procesador': self.equipo.procesador,
            'equipo_estado': self.equipo.estado,
            'equipo_alta': self.equipo.alta
        })
    
    return data
```

### `get_cliente_principal()` - Obtener Cliente Correcto
```python
def get_cliente_principal(self):
    """Obtiene el cliente principal (B2B o directo)"""
    if self.usuario and self.usuario.cliente_b2b:
        return self.usuario.cliente_b2b.cliente
    else:
        return self.cliente
```

### `es_instalacion_b2b()` - Verificar Tipo
```python
def es_instalacion_b2b(self):
    """Determina si es una instalación B2B (tiene usuario asociado)"""
    return self.usuario_id is not None
```

---

## 🎨 Frontend - Flujo de Usuario

### 1. Crear Nueva Instalación

**Formulario:**
- **Vendedor** (Select): Lista de vendedores
- **Cliente** (Select): 
  - Si hay vendedor: Solo clientes de ese vendedor
  - Modo "Selección Libre": Todos los clientes
  - Indicador visual: Verde si es B2B, Rojo si no lo es
- **Observaciones** (Textarea): Notas adicionales

**Indicadores:**
- Si cliente NO tiene usuarios: Mostrar opción "Instalaciones Previas"
- Si cliente es B2B: Mostrar badge verde
- Si cliente NO es B2B: Advertencia de creación automática

**Validaciones:**
- Cliente debe tener vendedor asignado
- Si no es B2B, confirmar creación automática de ClienteB2B

### 2. Flujo de Creación de Usuario

**Opciones (Checkboxes):**
- ☐ El usuario ya existe en mi sistema
- ☐ El usuario ya existe en el portal Corp

**Comportamiento según selección:**

| Sistema Local | Portal Corp | Acción |
|--------------|-------------|---------|
| ❌ | ❌ | Crear en ambos con automatización |
| ❌ | ✅ | Crear solo localmente (ya existe en Corp) |
| ✅ | ❌ | Vincular + crear en Corp con automatización |
| ✅ | ✅ | Solo vincular (existe en ambos) |

**Formulario Usuario Nuevo:**
```tsx
interface UsuarioForm {
  nombre: string;           // Nombre completo
  usuarioBase: string;      // Base del usuario (ej: "juanp")
  usuarioCorrelativo: string; // Número correlativo (ej: "1")
  email: string;
  numero: string;
}
```

**Generación automática de usuario:**
```typescript
// Si NO hay usuarios del cliente:
usuarioBase = clienteNombre.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toLowerCase();
correlativo = 1;

// Si YA hay usuarios del cliente:
const primerUsuario = usuariosCliente[0].usuario;
usuarioBase = primerUsuario.match(/^(\D+)/)[1];
// Calcular máximo correlativo existente + 1
correlativo = maxCorrelativo + 1;

// Usuario final: usuarioBase + correlativo (ej: "juanp1")
```

**Generación de contraseña:**
```typescript
const ano_actual = new Date().getFullYear();
const clave = `${usuario_completo}.,${ano_actual}.*`;
// Ejemplo: "juanp1.,2025.*"
```

### 3. Flujo de Instalación de Equipo

**Paso 1: Sincronización Automática**
- Al abrir modal, ejecutar automáticamente `POST /instalaciones/{id}/sincronizar-equipos`
- Mostrar spinner: "Sincronizando equipos desde Corp..."
- Cargar lista de equipos disponibles

**Paso 2: Selección de Equipo**
- Radio buttons para seleccionar equipo
- Cada equipo muestra:
  - Nombre del equipo
  - MAC, Procesador, Placa, Disco
  - Badges: Estado (Activo/Inactivo), Alta (Aprobado/Rechazado)
- **Si solo hay 1 equipo:** Auto-seleccionar y proceder automáticamente si está aprobado y activo

**Paso 3: Activación + Instalación**
- Botón "Activar Equipo e Instalar"
- Ejecutar en secuencia:
  1. `POST /instalaciones/{id}/activar-equipo` con `equipo_id`
  2. `PUT /instalaciones/{id}/instalar` con `equipo_id`
- Mostrar progreso: "Activando equipo y procesando instalación..."

### 4. Finalizar Instalación

**Modal de finalización:**
- Pregunta: "¿Se realizó la capacitación correspondiente al cliente?"
- Opciones:
  - 👍 Sí, fue realizada
  - 👎 No, no fue requerida
- Botón: "Confirmar Finalización"

---

## 🔧 Utilidades y Helpers

### Endpoint: Obtener Clientes para Selección Libre
```http
GET /api/clientes-para-seleccion-libre
```

**Respuesta:**
```json
[
  {
    "value": 1,
    "label": "ACME Corp - 12.345.678-9",
    "es_b2b": true,
    "cliente_b2b_id": 5,
    "b2b_activo": true,
    "b2b_bloqueado": false,
    "vendedor_id": 3,
    "vendedor_nombre": "Juan Vendedor",
    "rut": "12.345.678-9",
    "contacto": "Pedro Manager",
    "num_contacto": "+56912345678"
  }
]
```

**SQL Query:**
```sql
SELECT 
    c.id, 
    c.nombre, 
    c.rut,
    c.contacto,
    c.num_contacto,
    CASE WHEN cb.id IS NOT NULL THEN 1 ELSE 0 END as tiene_b2b,
    cb.id as cliente_b2b_id,
    cb.estado as b2b_estado,
    cb.bloqueado as b2b_bloqueado,
    v.id as vendedor_id,
    v.nombre as vendedor_nombre
FROM clientes c
LEFT JOIN clientes_b2b cb ON c.id = cb.cliente_id
LEFT JOIN vendedores v ON c.vendedor_id = v.id
ORDER BY c.nombre
```

---

## 📦 Generador de Paquetes de Instalación

### Estructura del ZIP

```
instalador_portable_CLIENTE.zip
│
├── INSTALAR_SIN_PYTHON.bat          # Lanzador principal
├── InstalarRepuestosCenter.ps1      # Script PowerShell automático
├── automatizador_instalacion.py     # Script Python (backup)
├── credenciales.txt                 # Usuario/clave del cliente
└── INSTRUCCIONES.txt                # Guía completa
```

### Contenido de credenciales.txt
```
RUT Cliente: 12.345.678-9
Usuario: juanp1
Clave: juanp1.,2025.*
```

### Script PowerShell (InstalarRepuestosCenter.ps1)

**Funcionalidad:**
1. Crear directorio temporal en `%TEMP%`
2. Descargar Python portable (3.11.0 embebido)
3. Extraer Python
4. Habilitar pip en Python embebido
5. Instalar dependencias: `pywinauto`, `comtypes`
6. Copiar archivos necesarios
7. Ejecutar `automatizador_instalacion.py`
8. Limpiar archivos temporales

**Variables clave:**
```powershell
$PythonUrl = "https://www.python.org/ftp/python/3.11.0/python-3.11.0-embed-amd64.zip"
$TempDir = "$env:TEMP\RepuestesCenterInstaller_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
```

### Script Batch (INSTALAR_SIN_PYTHON.bat)

**Funcionalidad:**
1. Verificar disponibilidad de PowerShell
2. Ejecutar script PowerShell con `-ExecutionPolicy Bypass`
3. Manejar errores

```batch
@echo off
echo Iniciando instalador automatico...

powershell -Command "Write-Host 'PowerShell disponible'" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell no esta disponible
    pause
    exit /b 1
)

powershell -ExecutionPolicy Bypass -File "%~dp0InstalarRepuestosCenter.ps1"
```

### Archivo de Instrucciones

**Secciones:**
1. 🚀 Instalación sin Python (recomendada)
2. 🔧 Instalación manual (fallback)
3. 📝 ¿Qué hace el instalador?
4. ⚠️ Notas importantes
5. 🆘 Solución de problemas
6. 🎯 Ventajas del instalador automático

---

## 📊 Vista de Seguimiento

### Componente de Seguimiento Visual

**Estados visuales:**
- ✅ **Completado** (verde)
- ⏳ **En Progreso** (amarillo)
- ⏸️ **Pendiente** (gris)
- ❌ **Omitido** (rojo) - Solo para capacitación no requerida

**Pasos visuales:**
1. Aprobada
2. Usuario creado
3. Instalada
4. Capacitación
5. Finalizada

**Lógica de renderizado:**
```typescript
const visualSteps = ['aprobada', 'usuario_creado', 'instalada', 'capacitacion', 'finalizada'];
const backendStates = ['aprobada', 'usuario_creado', 'instalada', 'finalizada'];

// Capacitación omitida si:
const capacitacionOmitida = estado === 'finalizada' && 
  observaciones?.includes('La capacitación no fue requerida');
```

---

## ⚙️ Configuraciones y Consideraciones

### 1. Creación Automática de ClienteB2B

**Cuándo:** Al crear usuario para instalación si no existe
```python
ClienteB2B(
    cliente_id=instalacion.cliente_id,
    canal_id=1,  # B2B por defecto
    lista_precio_id=cliente_original.lista_precio_id,
    bloqueado=False,
    observaciones='ClienteB2B creado automáticamente desde creación de usuario.'
)
```

### 2. Gestión de Equipos - Reglas Críticas

**Solo 1 equipo activo por usuario:**
- Al activar un equipo, todos los demás se desactivan
- Excepción: Equipos ya rechazados E inactivos (no se tocan)
- Comparación por identidad física completa (MAC + nombre + procesador + placa + disco)

**Sincronización bidireccional:**
- Local → Corp: Al activar/desactivar
- Corp → Local: Al sincronizar equipos

### 3. Instalaciones Previas

**Uso:** Clientes que ya tienen el programa pero no están en el sistema

**Proceso:**
1. Verificar que cliente NO tiene usuarios
2. Mostrar opción "Instalaciones Previas"
3. Solicitar cantidad (1-10)
4. Crear todas las instalaciones con:
   - `estado = 'aprobada'` (ya aprobadas)
   - `observaciones = 'Instalación previa #{número}'`
   - `fecha_aprobacion = datetime.utcnow()`

### 4. Estados de Recuperación

**configuracion_pendiente:**
- Ocurre cuando falla automatización de creación de usuario
- Usuario YA está creado en BD local
- Opciones:
  - Reintentar configuración
  - Forzar estado a "usuario_creado"
  - Eliminar usuario y volver a aprobar

### 5. Formato de Credenciales

**Usuario:**
- Formato: `{base}{correlativo}`
- Base: 6 primeros caracteres del nombre del cliente (sin espacios/símbolos)
- Correlativo: Número secuencial empezando en 1

**Clave:**
- Formato: `{usuario}.,{año}.*`
- Ejemplo: `juanp1.,2025.*`

---

## 📝 Validaciones Importantes

### Antes de Crear Instalación
- [ ] Cliente debe existir
- [ ] Vendedor debe estar asignado al cliente
- [ ] Si cliente no es B2B, advertir sobre creación automática

### Antes de Crear Usuario
- [ ] Instalación debe estar en estado 'aprobada'
- [ ] Cliente debe tener ID válido
- [ ] Si no existe ClienteB2B, crearlo automáticamente
- [ ] Validar formato de email
- [ ] Generar usuario/clave según estándar

### Antes de Instalar Equipo
- [ ] Instalación debe estar en 'usuario_creado' o 'configuracion_pendiente'
- [ ] Usuario debe estar asignado
- [ ] Equipo debe existir en la sincronización
- [ ] Equipo debe pertenecer al usuario de la instalación

### Antes de Finalizar
- [ ] Instalación debe estar en estado 'instalada'
- [ ] Debe tener usuario_id y equipo_id
- [ ] Debe indicarse si hubo capacitación

---

## 🔄 Casos de Uso Completos

### Caso 1: Instalación Nueva (Usuario Nuevo)
```
1. POST /instalaciones → estado: pendiente
2. PUT /instalaciones/{id}/aprobar → estado: aprobada
3. POST /instalaciones/{id}/crear-usuario (nuevo) → estado: usuario_creado
   (automatización crea en Corp)
4. POST /instalaciones/{id}/sincronizar-equipos → obtiene equipos
5. POST /instalaciones/{id}/activar-equipo → activa 1, desactiva otros
6. PUT /instalaciones/{id}/instalar → estado: instalada
7. PUT /instalaciones/{id}/finalizar → estado: finalizada
```

### Caso 2: Instalación con Usuario Existente
```
1. POST /instalaciones → estado: pendiente
2. PUT /instalaciones/{id}/aprobar → estado: aprobada
3. POST /instalaciones/{id}/vincular-usuario → estado: usuario_creado
   (solo vincula, no crea)
4. POST /instalaciones/{id}/sincronizar-equipos → obtiene equipos
5. POST /instalaciones/{id}/activar-equipo → activa 1, desactiva otros
6. PUT /instalaciones/{id}/instalar → estado: instalada
7. PUT /instalaciones/{id}/finalizar → estado: finalizada
```

### Caso 3: Instalaciones Previas (Múltiples)
```
1. POST /instalaciones (x5) → todas con estado: aprobada
2. Para cada instalación:
   a. POST /instalaciones/{id}/crear-usuario → estado: usuario_creado
   b. POST /instalaciones/{id}/sincronizar-equipos
   c. POST /instalaciones/{id}/activar-equipo
   d. PUT /instalaciones/{id}/instalar → estado: instalada
   e. PUT /instalaciones/{id}/finalizar → estado: finalizada
```

### Caso 4: Recuperación por Fallo de Automatización
```
1. POST /instalaciones/{id}/crear-usuario → estado: configuracion_pendiente
2. Opciones:
   a. POST /instalaciones/{id}/continuar-configuracion → reintentar
   b. POST /instalaciones/{id}/forzar-estado-usuario-creado → forzar
   c. DELETE /instalaciones/{id}/eliminar-usuario → volver a aprobada
```

---

## 📊 Respuestas de Error

### Errores Comunes

**400 Bad Request:**
```json
{
  "error": "El cliente seleccionado no tiene un vendedor asignado"
}
```

**404 Not Found:**
```json
{
  "error": "Usuario del sistema no encontrado"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Falló la creación del usuario en el sitio corporativo",
  "details": "Timeout al conectar con el portal"
}
```

---

## 🎯 Mejores Prácticas

1. **Siempre verificar ClienteB2B** antes de crear usuario
2. **Sincronizar equipos** antes de mostrar opciones de instalación
3. **Validar pertenencia** de equipos al usuario
4. **Comparar equipos por identidad física completa** (no solo MAC)
5. **Omitir equipos ya rechazados e inactivos** en desactivación masiva
6. **Registrar todas las fechas** de cambio de estado
7. **Agregar observaciones** significativas en cada paso
8. **Manejar estados de error** con opciones de recuperación
9. **Generar credenciales** siguiendo el formato estándar
10. **Proveer paquetes de instalación** automáticos y manuales

---

## 📚 Dependencias Requeridas

### Backend
- Flask / FastAPI
- SQLAlchemy
- Python 3.8+
- datetime

### Frontend
- React / Vue / Angular
- react-select (para selects mejorados)
- react-data-table-component (para tablas)
- Iconos: react-icons

### Para Automatización (Ver documento separado)
- Playwright / Selenium
- pywinauto
- comtypes

---

## 🔗 Referencias Cruzadas

- Ver `INSTALACIONES_AUTOMATIZACION.md` para detalles de automatización
- Ver modelos relacionados: Cliente, Usuario, Equipo, ClienteB2B
- Ver servicios: VendedorService, ClienteService, UsuarioService

