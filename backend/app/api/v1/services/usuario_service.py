# backend/app/api/v1/services/usuario_service.py
from app.models.entidades.usuarios import Usuario
from app.models.entidades.roles import Rol
from app.models.entidades.areas import Area
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError
from app.extensions import db

class UsuarioService:

    @staticmethod
    def get_all_usuarios():
        return Usuario.query.all()

    @staticmethod
    def get_usuario_by_id(usuario_id):
        return Usuario.query.get_or_404(usuario_id)

    @staticmethod
    def create_usuario(data):
        if Usuario.query.filter_by(email=data['email']).first():
            raise ResourceConflictError(f"El email '{data['email']}' ya está en uso.")

        if not Area.query.get(data['id_area']):
            raise RelatedResourceNotFoundError(f"El área con ID {data['id_area']} no existe.")
        
        nuevo_usuario = Usuario(
            nombre_completo=data['nombre_completo'],
            email=data['email'],
            telefono=data.get('telefono'),
            id_area=data['id_area'],
            id_jefe_directo=data.get('id_jefe_directo')
        )
        nuevo_usuario.set_password(data['password'])

        if data['roles_ids']:
            roles = Rol.query.filter(Rol.id_rol.in_(data['roles_ids'])).all()
            if len(roles) != len(data['roles_ids']):
                raise RelatedResourceNotFoundError("Uno o más de los roles especificados no fueron encontrados.")
            nuevo_usuario.roles = roles
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        return nuevo_usuario

    @staticmethod
    def update_usuario(usuario_id, data):
        usuario = UsuarioService.get_usuario_by_id(usuario_id)

        if 'email' in data and data['email'] != usuario.email:
            if Usuario.query.filter(Usuario.email == data['email'], Usuario.id_usuario != usuario_id).first():
                raise ResourceConflictError(f"El email '{data['email']}' ya está en uso.")
        
        for field in ['nombre_completo', 'telefono', 'id_area', 'id_jefe_directo']:
            if field in data:
                setattr(usuario, field, data[field])
        
        if 'password' in data:
            usuario.set_password(data['password'])
        
        if 'roles_ids' in data:
            roles = Rol.query.filter(Rol.id_rol.in_(data['roles_ids'])).all()
            if len(roles) != len(data['roles_ids']):
                raise RelatedResourceNotFoundError("Uno o más de los roles especificados no fueron encontrados.")
            usuario.roles = roles

        db.session.commit()
        return usuario
    
    @staticmethod
    def deactivate_usuario(usuario_id):
        usuario = UsuarioService.get_usuario_by_id(usuario_id)
        # Regla de negocio: no desactivar a un jefe con subordinados activos
        if any(sub.activo for sub in usuario.subordinados):
            raise ResourceConflictError("No se puede desactivar un usuario que es jefe directo de otros usuarios activos.")
        
        usuario.activo = False
        db.session.commit()
        return usuario

    @staticmethod
    def activate_usuario(usuario_id):
        usuario = UsuarioService.get_usuario_by_id(usuario_id)
        usuario.activo = True
        db.session.commit()
        return usuario