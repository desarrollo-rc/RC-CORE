## Recomendaciones para recursos con Modelo + Servicio + Rutas + Endpoints

Recursos analizados: `Area`, `Usuario`, `Rol`, `Permiso`, `Contacto`, `Direccion`, `TipoCliente`, `SegmentoCliente`, `ListaPrecios`, `CondicionPago`, `Empresa`, `MaestroClientes` (Clientes), `CanalVenta`, `Vendedor`.

Objetivo: dejar estos recursos consolidados y homogéneos para acelerar la creación de APIs del resto de modelos.

---

### Cambios transversales (estándar de la API)

- Autenticación JWT
  - Unificar el tipo de `identity` de JWT como entero en la creación del token.
    - Archivo: `backend/app/api/v1/services/auth_service.py`
    - Cambio: usar `create_access_token(identity=user.id_usuario)` (entero), y en todas las rutas consumir `get_jwt_identity()` sin casteos ad-hoc.

- Decoradores de permisos
  - Aplicar `permission_required` en todas las rutas CRUD con un esquema consistente por recurso:
    - Crear: `<recurso>:crear`
    - Listar: `<recurso>:listar`
    - Ver: `<recurso>:ver`
    - Editar: `<recurso>:editar`
    - Desactivar/Activar: `<recurso>:cambiar-estado`
    - Eliminar: `<recurso>:eliminar`
  - Archivos: todos los `..._routes.py` (ver secciones por recurso abajo).

- Manejo de errores
  - Asegurar bloques `except` completos (sin `pass`) y respuestas homogéneas `{ "error": string }` con `status_code` apropiado.
  - En servicios, ante excepciones no controladas, hacer `db.session.rollback()` antes de propagar.
  - Archivos: varios `..._routes.py` y servicios listados abajo.

- Consistencia de acceso a la sesión
  - Unificar import a `from app.extensions import db` en todos los servicios.
  - Archivos: `area_service.py`, `empresa_service.py`, `canal_venta_service.py`, `usuario_service.py`, `cliente_service.py`, etc.

- Convención de soft-delete
  - Donde el modelo tiene `MixinAuditoria` (`activo`), preferir `activate/deactivate` en lugar de `DELETE` físico; exponer endpoints de activación/desactivación y eliminar el borrado duro.
  - Archivos: `contacto_routes.py`, `direccion_routes.py`, `contacto_service.py`, `direccion_service.py`.

- Respuestas de lista
  - Homogeneizar con `schema_many.dump(...)` en lugar de construir listas manuales, y considerar paginación cuando el volumen pueda crecer.
  - Archivos: `contacto_routes.py`, `direccion_routes.py`.

---

### Clientes (`MaestroClientes`)

- Bug en variable de excepción
  - Archivo: `backend/app/api/v1/routes/cliente_routes.py`
  - En `create_cliente`, el bloque `except BusinessRuleError as err:` responde con `e`; debe responder con `err`.

- Ruta DELETE incorrecta
  - Archivo: `backend/app/api/v1/routes/cliente_routes.py`
  - La ruta está definida como `@clientes_bp.route('/', methods=['DELETE'])` pero la función recibe `cliente_id`. Debe ser `@clientes_bp.route('/<int:cliente_id>', methods=['DELETE'])` o ajustar la firma y el comportamiento.
  - Actualmente devuelve 501 (pendiente); definir comportamiento (soft-delete/desactivar) y mover a `PUT /<id>/deactivate` ya existente o implementar `DELETE` si procede.

- JWT identity consistente
  - En `create_cliente`, el `current_user_id` se usa tal cual; en `update_cliente` se castea a `int`. Normalizar el tipo tras el cambio propuesto en Auth.

- Permisos por endpoint
  - Añadir: `clientes:crear`, `clientes:listar`, `clientes:ver`, `clientes:editar`, `clientes:cambiar-estado`.

---

### Usuarios (`Usuario`)

- Bloques de excepciones incompletos
  - Archivo: `backend/app/api/v1/routes/usuarios_routes.py`
  - En `update_usuario` y `deactivate_usuario` los `except` terminan en `pass`. Retornar JSON de error y código (`422/409/404`) como en otros recursos.

- Permisos presentes pero estandarizar
  - Verificar que los permisos usados (`usuarios:crear`, `usuarios:listar`, `usuarios:ver`, `usuarios:editar`, `usuarios:desactivar`) existan en tabla `Permiso` y en asignaciones de roles.

- Servicio
  - Archivo: `backend/app/api/v1/services/usuario_service.py`
  - Unificar import `db` desde `app.extensions`.

---

### Áreas (`Area`)

- Permisos
  - Archivo: `backend/app/api/v1/routes/areas_routes.py`
  - Añadir `permission_required` a: crear, listar, ver, editar, activar/desactivar.

- Servicio
  - Archivo: `backend/app/api/v1/services/area_service.py`
  - Unificar import `db` desde `app.extensions`.

---

### Roles (`Rol`) y Permisos (`Permiso`)

- Permisos en rutas
  - Archivos: `roles_routes.py`, `permisos_routes.py`
  - Añadir `permission_required` con un rol/scope administrativo (por ejemplo `admin:roles:*`, `admin:permisos:*`) para evitar bloqueo circular.

- Servicio de roles
  - Archivo: `rol_service.py`
  - Añadir `db.session.rollback()` en paths de error antes de relanzar (si se agregan futuras validaciones que lancen excepciones en commit).

---

### Contactos (`Contacto`) y Direcciones (`Direccion`)

- Consistencia soft-delete
  - Archivos: `contacto_routes.py`, `direccion_routes.py`, `contacto_service.py`, `direccion_service.py`
  - Sustituir `DELETE` físico por `PUT /<id>/deactivate` y `PUT /<id>/activate` (modelos tienen `activo` por `MixinAuditoria`).
  - En servicios, reemplazar `db.session.delete(...)` por seteo de `activo` y `commit`.

- Validación de actualización
  - Limitar `update_*` a campos permitidos (evitar actualizar claves foráneas críticas como `id_cliente` sin validación adicional).

- Listados
  - Homogeneizar con `schema_many` o mantener el patrón de lista manual, pero ser consistente (recomendado `schema_many`), y filtrar por `activo=True` si aplica.

---

### Tipos de cliente (`TipoCliente`) y Segmentos (`SegmentoCliente`)

- Permisos
  - Archivos: `tipo_cliente_routes.py`, `segmentos_cliente_routes.py`
  - Añadir `permission_required` a CRUD y activar/desactivar.

- Servicio
  - Añadir `db.session.rollback()` en errores inesperados si se capturan/propagan; unificar import `db` desde `app.extensions`.

---

### Listas de precios (`ListaPrecios`) y Condiciones de pago (`CondicionPago`)

- Permisos
  - Archivos: `listas_precios_routes.py`, `condiciones_pago_routes.py`
  - Añadir `permission_required` en CRUD y activar/desactivar.

- Servicio
  - Archivo: `listas_precios_service.py`
  - Unificar import `db` desde `app.extensions`.

---

### Empresas (`Empresa`)

- Permisos
  - Archivo: `empresa_routes.py`
  - Añadir `permission_required` para crear, listar, ver, editar, activar/desactivar.

- Servicio
  - Archivo: `empresa_service.py`
  - Unificar import `db` desde `app.extensions`.

---

### Canales de venta (`CanalVenta`)

- Permisos
  - Archivo: `canal_venta_routes.py`
  - Añadir `permission_required` para CRUD y activar/desactivar.

- Servicio
  - Archivo: `canal_venta_service.py`
  - Unificar import `db` desde `app.extensions`.

---

### Vendedores (`Vendedor`)

- Permisos
  - Archivo: `vendedor_routes.py`
  - Añadir `permission_required` para crear, listar, ver, editar y eliminar.

- Soft-delete (opcional)
  - El modelo `Vendedor` no tiene `activo`. Si se requiere historial, considerar agregar `MixinAuditoria` y migrar a activar/desactivar; si no, mantener `DELETE` físico.

---

### App init y registro de blueprints

- Archivo: `backend/app/__init__.py`
  - Tras unificar permisos, no se requiere ajuste aquí. Opcional: agregar un manejador global de errores para `BusinessRuleError` y `NotFound` a fin de evitar duplicación de bloques `try/except` en rutas.

---

### Resumen de bugs detectados a corregir

1) `cliente_routes.py`: variable `e` usada en `except BusinessRuleError as err`. Cambiar por `err`.
2) `cliente_routes.py`: ruta `DELETE` mal definida respecto al parámetro `cliente_id`. Armonizar path/función o usar desactivación.
3) `usuarios_routes.py`: bloques `except` con `pass` en `update_usuario` y `deactivate_usuario`. Retornar JSON de error y código.
4) Varias services: uso inconsistente de `db` (migrar a `from app.extensions import db`).
5) `auth_service.py`: usar `identity` entero en JWT para evitar casteos ad-hoc.
6) `contacto_*` y `direccion_*`: convertir borrado físico a activar/desactivar, y limitar campos actualizables.

---

### Sugerencia de permisos por recurso

- areas: crear, listar, ver, editar, cambiar-estado
- usuarios: crear, listar, ver, editar, desactivar (y opcional cambiar-estado)
- roles: crear, listar, ver, editar, eliminar (scope admin)
- permisos: crear, listar, ver, editar, eliminar (scope admin)
- clientes: crear, listar, ver, editar, cambiar-estado
- contactos: crear, listar, ver, editar, cambiar-estado
- direcciones: crear, listar, ver, editar, cambiar-estado
- tipos-cliente: crear, listar, ver, editar, cambiar-estado
- segmentos-cliente: crear, listar, ver, editar, cambiar-estado
- listas-precios: crear, listar, ver, editar, cambiar-estado
- condiciones-pago: crear, listar, ver, editar, cambiar-estado
- empresas: crear, listar, ver, editar, cambiar-estado
- canales-venta: crear, listar, ver, editar, cambiar-estado
- vendedores: crear, listar, ver, editar, eliminar

Con estos ajustes, los recursos existentes quedan normalizados para extender rápidamente el resto de modelos (productos, inventario, compras, ventas, logística) con una base coherente de seguridad, errores y ciclos de vida.


