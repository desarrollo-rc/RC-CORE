# backend/app/api/v1/services/instalacion_service.py
from app.models.soporte.instalaciones import Instalacion
from app.api.v1.services.caso_service import CasoService  # Usamos el servicio
from app.api.v1.services.usuario_b2b_service import UsuarioB2BService # Usamos el servicio
from app.extensions import db
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError

class InstalacionService:
    @staticmethod
    def get_all_instalaciones():
        return Instalacion.query.all()

    @staticmethod
    def get_instalacion_by_id(instalacion_id):
        instalacion = Instalacion.query.get(instalacion_id)
        if not instalacion:
            raise RelatedResourceNotFoundError(f"Instalación con ID {instalacion_id} no encontrada.")
        return instalacion

    @staticmethod
    def create_instalacion(data):
        # Validar que el caso y el usuario B2B existan
        caso = CasoService.get_caso_by_id(data['id_caso'])
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(data['id_usuario_b2b'])
        
        # Validar que el usuario B2B pertenezca al cliente del caso
        if caso.id_cliente != usuario_b2b.id_cliente:
            raise BusinessRuleError("El usuario B2B debe pertenecer al mismo cliente del caso.")
            
        nueva_instalacion = Instalacion(
            id_caso=data['id_caso'],
            id_usuario_b2b=data['id_usuario_b2b'],
            fecha_visita=data.get('fecha_visita'),
            observaciones=data.get('observaciones'),
            estado='Pendiente Aprobación'
        )
        db.session.add(nueva_instalacion)
        db.session.commit()
        return nueva_instalacion

    @staticmethod
    def update_instalacion(instalacion_id, data):
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        for key, value in data.items():
            if hasattr(instalacion, key):
                setattr(instalacion, key, value)
        
        db.session.commit()
        return instalacion

    @staticmethod
    def update_instalacion_estado(instalacion_id, nuevo_estado):
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        instalacion.estado = nuevo_estado
        db.session.commit()
        return instalacion