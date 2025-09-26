# backend/app/api/v1/services/maestro_productos_service.py
from app.extensions import db
from app.models.productos import (
    MaestroProductos, ProductoProveedor, CodigoReferencia, Marca, Calidad, Origen, Fabrica
)
from app.models.entidades import MaestroProveedores
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class MaestroProductoService:

    @staticmethod
    def get_all_productos(include_inactive: bool = False):
        query = MaestroProductos.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(MaestroProductos.nombre_producto).all()

    @staticmethod
    def get_producto_by_id(producto_id):
        return MaestroProductos.query.get_or_404(producto_id)

    @staticmethod
    def get_producto_by_sku(sku):
        """Busca un producto por su SKU."""
        return MaestroProductos.query.filter_by(sku=sku).first()

    @staticmethod
    def create_producto(data, user_id):
        if MaestroProductos.query.filter_by(sku=data['sku']).first():
            raise ResourceConflictError(f"El SKU '{data['sku']}' ya existe.")

        # Validar existencia de todas las FKs
        MaestroProductoService._validate_related_entities(data)

        nuevo_producto = MaestroProductos(
            sku=data['sku'],
            nombre_producto=data['nombre_producto'],
            id_codigo_referencia=data['id_codigo_referencia'],
            id_marca=data['id_marca'],
            id_calidad=data['id_calidad'],
            id_origen=data['id_origen'],
            id_fabrica=data.get('id_fabrica'),
            costo_base=data['costo_base'],
            es_kit=data.get('es_kit', False),
            id_usuario_creacion=user_id
        )

        # Sincronizar proveedores
        MaestroProductoService._sync_proveedores(nuevo_producto, data['proveedores'])

        db.session.add(nuevo_producto)
        db.session.commit()
        return nuevo_producto

    @staticmethod
    def update_producto(producto_id, data):
        producto = MaestroProductoService.get_producto_by_id(producto_id)

        if 'sku' in data and data['sku'] != producto.sku:
            if MaestroProductos.query.filter_by(sku=data['sku']).first():
                raise ResourceConflictError(f"El SKU '{data['sku']}' ya está en uso.")

        # Validar FKs si vienen en el payload
        MaestroProductoService._validate_related_entities(data)

        # Actualizar campos simples
        for field in ['sku', 'nombre_producto', 'id_codigo_referencia', 'id_marca', 'id_calidad', 'id_origen', 'id_fabrica', 'costo_base', 'es_kit']:
            if field in data:
                setattr(producto, field, data[field])

        # Sincronizar proveedores si se envían
        if 'proveedores' in data:
            MaestroProductoService._sync_proveedores(producto, data['proveedores'])

        db.session.commit()
        return producto

    @staticmethod
    def deactivate_producto(producto_id, razon_bloqueo):
        producto = MaestroProductoService.get_producto_by_id(producto_id)
        # Aquí podríamos añadir lógica futura (ej: verificar stock)
        producto.activo = False
        producto.razon_bloqueo = razon_bloqueo
        db.session.commit()
        return producto

    @staticmethod
    def activate_producto(producto_id):
        producto = MaestroProductoService.get_producto_by_id(producto_id)
        producto.activo = True
        producto.razon_bloqueo = None
        db.session.commit()
        return producto

    @staticmethod
    def _validate_related_entities(data):
        """Valida que todas las FKs necesarias existan."""
        if 'id_codigo_referencia' in data and not CodigoReferencia.query.get(data['id_codigo_referencia']):
            raise RelatedResourceNotFoundError("El Código de Referencia no existe.")
        if 'id_marca' in data and not Marca.query.get(data['id_marca']):
            raise RelatedResourceNotFoundError("La Marca no existe.")
        if 'id_calidad' in data and not Calidad.query.get(data['id_calidad']):
            raise RelatedResourceNotFoundError("La Calidad no existe.")
        if 'id_origen' in data and not Origen.query.get(data['id_origen']):
            raise RelatedResourceNotFoundError("El Origen no existe.")
        if data.get('id_fabrica') and not Fabrica.query.get(data['id_fabrica']):
            raise RelatedResourceNotFoundError("La Fábrica no existe.")

    @staticmethod
    def _sync_proveedores(producto, proveedores_data):
        """Sincroniza la relación N-M con proveedores."""
        # Limpiar proveedores existentes
        producto.proveedores.clear()

        # Añadir los nuevos
        for prov_data in proveedores_data:
            id_proveedor = prov_data['id_proveedor']
            if not MaestroProveedores.query.get(id_proveedor):
                raise RelatedResourceNotFoundError(f"El Proveedor con ID {id_proveedor} no existe.")

            asociacion = ProductoProveedor(
                id_proveedor=id_proveedor,
                costo_proveedor=prov_data['costo_proveedor'],
                codigo_producto_proveedor=prov_data['codigo_producto_proveedor'],
                es_proveedor_principal=prov_data.get('es_proveedor_principal', False)
            )
            producto.proveedores.append(asociacion)