# backend/app/api/v1/services/proveedor_service.py
from app.extensions import db
from app.models.entidades import MaestroProveedores, Pais
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class ProveedorService:

    @staticmethod
    def get_all_proveedores(include_inactive: bool = False):
        query = MaestroProveedores.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(MaestroProveedores.nombre_proveedor).all()

    @staticmethod
    def get_proveedor_by_id(proveedor_id):
        return MaestroProveedores.query.get_or_404(proveedor_id)

    @staticmethod
    def create_proveedor(data):
        if MaestroProveedores.query.filter_by(codigo_proveedor=data['codigo_proveedor']).first():
            raise ResourceConflictError(f"El código de proveedor '{data['codigo_proveedor']}' ya existe.")
        if MaestroProveedores.query.filter_by(rut_proveedor=data['rut_proveedor']).first():
            raise ResourceConflictError(f"El RUT de proveedor '{data['rut_proveedor']}' ya está registrado.")
        
        if not Pais.query.get(data['id_pais']):
            raise RelatedResourceNotFoundError(f"El país con ID {data['id_pais']} no existe.")

        nuevo_proveedor = MaestroProveedores(**data)
        db.session.add(nuevo_proveedor)
        db.session.commit()
        return nuevo_proveedor

    @staticmethod
    def update_proveedor(proveedor_id, data):
        proveedor = ProveedorService.get_proveedor_by_id(proveedor_id)

        if 'codigo_proveedor' in data and data['codigo_proveedor'] != proveedor.codigo_proveedor:
            if MaestroProveedores.query.filter_by(codigo_proveedor=data['codigo_proveedor']).first():
                raise ResourceConflictError(f"El código de proveedor '{data['codigo_proveedor']}' ya está en uso.")

        if 'rut_proveedor' in data and data['rut_proveedor'] != proveedor.rut_proveedor:
            if MaestroProveedores.query.filter_by(rut_proveedor=data['rut_proveedor']).first():
                raise ResourceConflictError(f"El RUT '{data['rut_proveedor']}' ya está en uso.")
        
        if 'id_pais' in data and not Pais.query.get(data['id_pais']):
             raise RelatedResourceNotFoundError(f"El país con ID {data['id_pais']} no existe.")

        for key, value in data.items():
            setattr(proveedor, key, value)
        
        db.session.commit()
        return proveedor

    @staticmethod
    def deactivate_proveedor(proveedor_id):
        proveedor = ProveedorService.get_proveedor_by_id(proveedor_id)
        if proveedor.productos:
            raise ResourceConflictError("No se puede desactivar un proveedor con productos asociados.")
        
        proveedor.activo = False
        db.session.commit()
        return proveedor

    @staticmethod
    def activate_proveedor(proveedor_id):
        proveedor = ProveedorService.get_proveedor_by_id(proveedor_id)
        proveedor.activo = True
        db.session.commit()
        return proveedor