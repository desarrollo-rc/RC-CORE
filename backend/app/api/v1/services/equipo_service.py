# backend/app/api/v1/services/equipo_service.py
from app.models.entidades.equipos import Equipo
from app.api.v1.utils.errors import NotFoundError, BusinessRuleError
from app.extensions import db

class EquipoService:
    @staticmethod
    def get_all_equipos():
        return Equipo.query.all()

    @staticmethod
    def get_equipo_by_id(equipo_id):
        equipo = Equipo.query.get(equipo_id)
        if not equipo:
            raise NotFoundError(f"Equipo con ID {equipo_id} no encontrado.")
        return equipo

    @staticmethod
    def create_equipo(data):
        # Validar que el usuario B2B exista
        from app.api.v1.services.usuario_b2b_service import UsuarioB2BService
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(data['id_usuario_b2b'])
        
        nuevo_equipo = Equipo(**data)
        db.session.add(nuevo_equipo)
        db.session.commit()
        return nuevo_equipo

    @staticmethod
    def update_equipo(equipo_id, data):
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        for field, value in data.items():
            setattr(equipo, field, value)
        db.session.commit()
        return equipo
    
    @staticmethod
    def deactivate_equipo(equipo_id):
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        equipo.activo = False
        db.session.commit()
        return equipo

    @staticmethod
    def activate_equipo(equipo_id):
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        equipo.activo = True
        db.session.commit()
        return equipo

    @staticmethod
    def get_equipo_by_usuario_b2b_id(usuario_b2b_id):
        return Equipo.query.filter_by(id_usuario_b2b=usuario_b2b_id).all()
    
    