# backend/app/api/v1/services/rol_service.py
from app.models.entidades.roles import Rol, Permiso
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError
from app import db

class RolService:

    @staticmethod
    def get_all_roles():
        return Rol.query.all()

    @staticmethod
    def get_rol_by_id(rol_id):
        return Rol.query.get_or_404(rol_id)

    @staticmethod
    def create_rol(data):
        nombre_rol = data['nombre_rol']
        if Rol.query.filter_by(nombre_rol=nombre_rol).first():
            raise ResourceConflictError(f"El rol con nombre '{nombre_rol}' ya existe.")
        
        nuevo_rol = Rol(
            nombre_rol=nombre_rol,
            descripcion_rol=data.get('descripcion_rol')
        )

        # Asignar permisos
        if 'permisos_ids' in data and data['permisos_ids']:
            permisos = Permiso.query.filter(Permiso.id_permiso.in_(data['permisos_ids'])).all()
            if len(permisos) != len(data['permisos_ids']):
                raise RelatedResourceNotFoundError("Uno o más permisos no fueron encontrados.")
            nuevo_rol.permisos = permisos
        
        db.session.add(nuevo_rol)
        db.session.commit()
        return nuevo_rol

    @staticmethod
    def update_rol(rol_id, data):
        rol = RolService.get_rol_by_id(rol_id)

        if 'nombre_rol' in data and data['nombre_rol'] != rol.nombre_rol:
            if Rol.query.filter(Rol.nombre_rol == data['nombre_rol'], Rol.id_rol != rol_id).first():
                raise ResourceConflictError(f"El nombre de rol '{data['nombre_rol']}' ya está en uso.")
            rol.nombre_rol = data['nombre_rol']
        
        if 'descripcion_rol' in data:
            rol.descripcion_rol = data['descripcion_rol']
        
        if 'permisos_ids' in data:
            # Si se envía una lista vacía, se quitan todos los permisos
            if not data['permisos_ids']:
                rol.permisos = []
            else:
                permisos = Permiso.query.filter(Permiso.id_permiso.in_(data['permisos_ids'])).all()
                if len(permisos) != len(data['permisos_ids']):
                    raise RelatedResourceNotFoundError("Uno o más permisos no fueron encontrados.")
                rol.permisos = permisos

        db.session.commit()
        return rol
    
    @staticmethod
    def delete_rol(rol_id):
        rol = RolService.get_rol_by_id(rol_id)

        if rol.usuarios:
            raise ResourceConflictError("No se puede borrar un rol que esté en uso.")
        
        db.session.delete(rol)
        db.session.commit()
        return None