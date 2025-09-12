from app.models.entidades.roles import Permiso
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class PermisoService:
    @staticmethod
    def get_all_permisos():
        return Permiso.query.all()
    
    @staticmethod
    def get_permiso_by_id(permiso_id):
        return Permiso.query.get_or_404(permiso_id)

    @staticmethod
    def create_permiso(data):
        nombre = data['nombre_permiso']
        if Permiso.query.filter_by(nombre_permiso=nombre).first():
            raise ResourceConflictError(f"El permiso '{nombre}' ya existe.")
        
        nuevo_permiso = Permiso(**data)
        db.session.add(nuevo_permiso)
        db.session.commit()
        return nuevo_permiso
    
    @staticmethod
    def update_permiso(permiso_id, data):
        permiso = PermisoService.get_permiso_by_id(permiso_id)

        if 'nombre_permiso' in data and data['nombre_permiso'] != permiso.nombre_permiso:
            if Permiso.query.filter(Permiso.nombre_permiso == data['nombre_permiso'], Permiso.id_permiso != permiso_id).first():
                raise ResourceConflictError(f"El nombre de permiso '{data['nombre_permiso']}' ya está en uso.")
        
        for field, value in data.items():
            setattr(permiso, field, value)
            
        db.session.commit()
        return permiso
    
    @staticmethod
    def delete_permiso(permiso_id):
        permiso = PermisoService.get_permiso_by_id(permiso_id)
        if permiso.roles:
            raise ResourceConflictError("No se puede borrar un permiso que esté en uso.")
        
        db.session.delete(permiso)
        db.session.commit()
        return None