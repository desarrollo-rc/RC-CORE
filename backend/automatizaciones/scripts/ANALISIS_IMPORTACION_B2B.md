# Análisis: Importación de Clientes y Usuarios B2B

## 📊 Situación Actual

### Datos Disponibles (del CSV)

**Por Cliente:**
- ✅ `rut_cliente` - RUT del cliente
- ✅ `nombre_cliente` - Nombre del cliente
- ✅ `condicion_pago` - Texto de condición de pago (ej: "30 Dias", "45, 60, 75, 90 dias")
- ✅ `linea_credito` - Línea de crédito (formato: "65.000.000")
- ✅ `estado_cliente` - "Activo" o "Inactivo"
- ✅ `qty_usuarios_tabla` - Cantidad de usuarios (información)

**Por Usuario:**
- ✅ `username` - Nombre de usuario único
- ✅ `nombre_usuario` - Nombre completo del usuario
- ✅ `fecha_ultima_modificacion` - Fecha de última modificación
- ✅ `estado_usuario` - "Activo" o "Inactivo"

### Datos Faltantes y Cómo se Resuelven

#### Para Clientes (`MaestroClientes`)

| Campo | Estado | Solución |
|-------|--------|----------|
| `codigo_cliente` | ❌ Faltante | ✅ **Generado automáticamente**: `C{rut_cliente}` (ej: `C27090809-8`) |
| `rut_cliente` | ✅ Disponible | Se usa directamente |
| `nombre_cliente` | ✅ Disponible | Se usa directamente |
| `giro_economico` | ❌ Faltante | ⚠️ Se deja `NULL` (opcional) |
| `linea_credito` | ✅ Disponible | Se convierte de "65.000.000" a `Decimal(65000000)` |
| `activo` | ✅ Disponible | Se mapea desde `estado_cliente` |
| `b2b_habilitado` | ❌ Faltante | ✅ **Inferido**: `True` (si tiene usuarios B2B, debe estar habilitado) |
| `id_tipo_cliente` | ❌ Faltante | ⚙️ **Valor por defecto configurable**: `DEFAULT_CODIGO_TIPO_CLIENTE` |
| `id_segmento_cliente` | ❌ Faltante | ⚙️ **Valor por defecto configurable**: `DEFAULT_CODIGO_SEGMENTO_CLIENTE` |
| `id_tipo_negocio` | ❌ Faltante | ⚙️ **Valor por defecto configurable**: `DEFAULT_CODIGO_TIPO_NEGOCIO` |
| `id_lista_precios` | ❌ Faltante | ⚙️ **Valor por defecto configurable**: `DEFAULT_CODIGO_LISTA_PRECIOS` |
| `id_condicion_pago` | ⚠️ Parcial | 🔍 **Mapeo inteligente**: Se extrae código desde texto (ej: "30 Dias" → "30") |
| `id_usuario_creacion` | ❌ Faltante | ✅ **Búsqueda automática**: Primer usuario activo del sistema |

#### Para Usuarios B2B (`UsuarioB2B`)

| Campo | Estado | Solución |
|-------|--------|----------|
| `nombre_completo` | ✅ Disponible | Se usa desde `nombre_usuario` |
| `usuario` | ✅ Disponible | Se usa desde `username` (normalizado a lowercase) |
| `email` | ❌ Faltante | ✅ **Generado automáticamente**: `{username}@repuestoscenter.cl` |
| `password_hash` | ❌ Faltante | ✅ **Generado automáticamente**: `{username}.,2025.*` (formato estándar del sistema) |
| `id_cliente` | ✅ Disponible | Se obtiene después de crear/buscar el cliente |

---

## 🔧 Configuración Requerida

Antes de ejecutar el script, **debes ajustar** los siguientes valores en `importar_clientes_usuarios_b2b.py`:

```python
# Códigos o IDs por defecto para las entidades relacionadas
# Puedes usar un código (string) o un ID (entero)
DEFAULT_CODIGO_TIPO_CLIENTE = "B2B"  # o -1 para "Sin Asignar"
DEFAULT_CODIGO_SEGMENTO_CLIENTE = "STANDARD"  # o -1 para "Sin Asignar"
DEFAULT_CODIGO_TIPO_NEGOCIO = "B2B"  # o -1 para "Sin Asignar"
DEFAULT_CODIGO_LISTA_PRECIOS = "STANDARD"  # o -1 para "Sin Asignar"
```

**Nota**: Si usas un entero (ej: `-1`), el script buscará por ID. Si usas un string (ej: `"B2B"`), buscará por código.

### Cómo encontrar los códigos correctos

Ejecuta estas consultas en tu BD para ver qué códigos existen:

```sql
-- Ver tipos de cliente disponibles
SELECT codigo_tipo_cliente, nombre_tipo_cliente 
FROM entidades.tipos_cliente 
WHERE activo = true;

-- Ver segmentos de cliente disponibles
SELECT codigo_segmento_cliente, nombre_segmento_cliente 
FROM entidades.segmentos_cliente 
WHERE activo = true;

-- Ver tipos de negocio disponibles
SELECT codigo_tipo_negocio, nombre_tipo_negocio 
FROM entidades.tipo_negocio 
WHERE activo = true;

-- Ver listas de precios disponibles
SELECT codigo_lista_precios, nombre_lista_precios 
FROM entidades.listas_precios 
WHERE activo = true;
```

---

## 📝 Uso del Script

### 1. Modo Dry Run (Recomendado primero)

Ejecuta sin guardar cambios para ver qué se haría:

```bash
cd /home/cecheverria/work/projects/RepuestoCenter
source backend/venv/bin/activate
python backend/automatizaciones/scripts/importar_clientes_usuarios_b2b.py --dry-run
```

### 2. Importación Real

Una vez que confirmes que todo está bien:

```bash
python backend/automatizaciones/scripts/importar_clientes_usuarios_b2b.py
```

### 3. Especificar CSV personalizado

```bash
python backend/automatizaciones/scripts/importar_clientes_usuarios_b2b.py --csv /ruta/al/archivo.csv
```

---

## ⚠️ Consideraciones Importantes

### 1. **Duplicados**
- El script **verifica duplicados** por RUT (clientes) y username (usuarios)
- Si un cliente ya existe, solo se habilita B2B si no lo estaba
- Si un usuario ya existe, se verifica que pertenezca al mismo cliente

### 2. **Códigos de Cliente**
- Se generan como `C{rut_cliente}`
- Si el código ya existe, se agrega un sufijo `_1`, `_2`, etc.

### 3. **Emails de Usuarios**
- Se generan como `{username}@repuestoscenter.cl`
- Si el email ya existe, se agrega un número: `{username}1@repuestoscenter.cl`

### 4. **Passwords**
- Se generan con el formato estándar: `{username}.,2025.*`
- **IMPORTANTE**: Los usuarios deberán cambiar su password en el primer login

### 5. **Condiciones de Pago**
- El script intenta mapear automáticamente desde el texto
- Si no encuentra coincidencia, se deja `NULL` (campo opcional)

### 6. **Transacciones**
- Cada cliente se procesa en una transacción separada
- Si hay un error con un cliente, se hace rollback solo de ese cliente
- Los demás clientes ya procesados se mantienen

---

## 📊 Ejemplo de Salida

```
================================================================================
IMPORTACIÓN DE CLIENTES Y USUARIOS B2B
================================================================================
CSV: /path/to/clientes_usuarios_b2b.csv
Modo: IMPORTACIÓN REAL
================================================================================

Obteniendo entidades por defecto...
  ✓ Tipo Cliente: Cliente B2B
  ✓ Segmento Cliente: Standard
  ✓ Tipo Negocio: B2B
  ✓ Lista Precios: Lista Standard
  ✓ Usuario de creación: Admin Sistema (ID: 1)

Leyendo CSV...
  ✓ 45 clientes únicos encontrados
  ✓ 1446 usuarios totales

Procesando clientes y usuarios...
--------------------------------------------------------------------------------

📋 Cliente: 27090809-8 - YONGJJIAO LU
   Usuarios en CSV: 5
  ✓ Cliente creado: 27090809-8 - YONGJJIAO LU (ID: 123, Código: C27090809-8)
    ✓ Usuario creado: yong1 - Usu Yongjiao 1 (Email: yong1@repuestoscenter.cl, Password: yong1.,2025.*)
    ✓ Usuario creado: yong2 - Usu Yongjiao 2 (Email: yong2@repuestoscenter.cl, Password: yong2.,2025.*)
    ...

================================================================================
RESUMEN DE IMPORTACIÓN
================================================================================
Clientes creados: 42
Clientes existentes: 3
Usuarios creados: 1200
Usuarios existentes: 246
================================================================================
```

---

## 🔍 Validaciones y Errores Comunes

### Error: "Faltan las siguientes entidades en la BD"

**Causa**: Los códigos por defecto no existen en tu BD.

**Solución**: 
1. Ejecuta las consultas SQL de arriba para ver qué códigos existen
2. Ajusta los valores `DEFAULT_CODIGO_*` en el script

### Error: "No se encontró ningún usuario activo para id_usuario_creacion"

**Causa**: No hay usuarios activos en la tabla `entidades.usuarios`.

**Solución**: 
1. Crea un usuario en el sistema primero, o
2. Ajusta `ID_USUARIO_CREACION` en el script con un ID específico

### Error: "El RUT 'XXX' ya está registrado"

**Causa**: El cliente ya existe en la BD.

**Comportamiento**: El script lo detecta automáticamente y continúa con los usuarios.

---

## 📋 Checklist Pre-Importación

- [ ] Verificar que el CSV existe y tiene datos
- [ ] Ajustar los códigos por defecto (`DEFAULT_CODIGO_*`)
- [ ] Ejecutar en modo `--dry-run` primero
- [ ] Revisar el resumen del dry-run
- [ ] Hacer backup de la BD (recomendado)
- [ ] Ejecutar la importación real
- [ ] Verificar que los datos se importaron correctamente
- [ ] Notificar a los usuarios sobre sus passwords temporales

---

## 🚀 Próximos Pasos

1. **Validar datos importados**: Revisar algunos clientes y usuarios en la BD
2. **Comunicar passwords**: Los usuarios necesitan sus passwords temporales
3. **Forzar cambio de password**: Configurar política para que cambien en el primer login
4. **Sincronización futura**: Considerar automatizar la sincronización periódica

