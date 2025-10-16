# backend/app/api/v1/services/vendedor_service.py
from app.extensions import db
from app.models.entidades.usuarios import Usuario
from app.models.negocio.vendedores import Vendedor
from app.api.v1.services.notificacion_service import notificacion_service
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
    def deactivate_vendedor(vendedor_id):
        vendedor = VendedorService.get_vendedor_by_id(vendedor_id)
        vendedor.activo = False
        db.session.commit()
        return vendedor
    
    @staticmethod
    def activate_vendedor(vendedor_id):
        vendedor = VendedorService.get_vendedor_by_id(vendedor_id)
        vendedor.activo = True
        db.session.commit()
        return vendedor

    @staticmethod
    def enviar_whatsapp_vendedor(vendedor_id, mensaje):
        vendedor = Vendedor.query.get(vendedor_id)
        if not vendedor:
            return {"success": False, "error": "Vendedor no encontrado"}
        
        if not vendedor.usuario:
            return {"success": False, "error": "El vendedor no tiene un usuario asociado"}

        # Ahora buscamos el teléfono en el objeto Usuario
        telefono_usuario = vendedor.usuario.telefono
        if not telefono_usuario:
            return {"success": False, "error": "El usuario asociado al vendedor no tiene un número de teléfono registrado"}


        # La API de Meta requiere el número sin símbolos, solo el código de país y el número.
        # Ej: '+56 9 1234 5678' -> '56912345678'
        numero_limpio = ''.join(filter(str.isdigit, telefono_usuario))

        # Llamamos a nuestro servicio central de notificaciones
        resultado_envio = notificacion_service.enviar_whatsapp(
            to_number=numero_limpio,
            message_body=mensaje
        )
        
        return resultado_envio