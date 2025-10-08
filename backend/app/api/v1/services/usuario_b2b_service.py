# backend/app/api/v1/services/usuario_b2b_service.py
from app.models.entidades.usuarios_b2b import UsuarioB2B
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError
from app.extensions import db

class UsuarioB2BService:
    @staticmethod
    def get_all_usuarios_b2b():
        return UsuarioB2B.query.all()

    @staticmethod
    def get_all_usuarios_b2b_active():
        return UsuarioB2B.query.filter_by(activo=True).all()
    
    @staticmethod
    def get_usuario_b2b_by_id(usuario_id):
        usuario = UsuarioB2B.query.get(usuario_id)
        if not usuario:
            raise RelatedResourceNotFoundError(f"Usuario B2B con ID {usuario_id} no encontrado.")
        return usuario

    @staticmethod
    def create_usuario_b2b(data):
        nuevo_usuario = UsuarioB2B(**data)
        db.session.add(nuevo_usuario)
        db.session.commit()
        return nuevo_usuario
    
    @staticmethod
    def update_usuario_b2b(usuario_id, data):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        for field, value in data.items():
            setattr(usuario, field, value)
        db.session.commit()
        return usuario
    
    @staticmethod
    def deactivate_usuario_b2b(usuario_id):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        usuario.activo = False
        db.session.commit()
        return usuario
    
    @staticmethod
    def activate_usuario_b2b(usuario_id):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        usuario.activo = True
        db.session.commit()
        return usuario
    