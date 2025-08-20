# backend/app/api/v1/services/vendedor_service.py
from app.extensions import db
from app.models.entidades.usuarios import Usuario
from app.models.negocio.vendedores import Vendedor
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class VendedorService:
    
    @staticmethod
    def get_all_vendedores():
        return Vendedor.query.all()

    @staticmethod
    def get_vendedor_by_id(vendedor_id):
        return Vendedor.query.get_or_404(vendedor_id)
    
    @staticmethod
    def create_vendedor(data):
        id_usuario = data['id_usuario']
        codigo_sap = data.get('codigo_vendedor_sap')

        if not Usuario.query.get(id_usuario):
            raise RelatedResourceNotFoundError(f"El usuario con ID {id_usuario} no fue encontrado.")
        
        if Vendedor.query.filter_by(id_usuario=id_usuario).first():
            raise ResourceConflictError(f"El usuario con ID {id_usuario} ya tiene un perfil de vendedor asignado.")
        
        if codigo_sap and Vendedor.query.filter_by(codigo_vendedor_sap=codigo_sap).first():
            raise ResourceConflictError(f"El código SAP '{codigo_sap}' ya está en uso.")

        nuevo_vendedor = Vendedor(
            id_usuario=id_usuario,
            codigo_vendedor_sap=codigo_sap
        )

        db.session.add(nuevo_vendedor)
        db.session.commit()
        return nuevo_vendedor
    
    @staticmethod
    def update_vendedor(vendedor_id, data):
        vendedor = VendedorService.get_vendedor_by_id(vendedor_id)

        if 'codigo_vendedor_sap' in data:
            nuevo_codigo = data['codigo_vendedor_sap']
            if nuevo_codigo != vendedor.codigo_vendedor_sap and Vendedor.query.filter(Vendedor.codigo_vendedor_sap == nuevo_codigo, Vendedor.id_vendedor != vendedor_id).first():
                raise ResourceConflictError(f"El código SAP '{nuevo_codigo}' ya está en uso por otro vendedor.")
            vendedor.codigo_vendedor_sap = nuevo_codigo
        
        db.session.commit()
        return vendedor
    
    @staticmethod
    def delete_vendedor(vendedor_id):
        vendedor = VendedorService.get_vendedor_by_id(vendedor_id)

        if vendedor.clientes:
            raise ResourceConflictError("No se puede eliminar el perfil del vendedor porque tiene clientes asignados. Por favor, reasígnelos primero.")
        
        db.session.delete(vendedor)
        db.session.commit()
        return None