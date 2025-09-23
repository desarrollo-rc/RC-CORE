# backend/app/api/v1/services/clasificacion_servicio_service.py
from app.extensions import db
from app.models.productos.clasificaciones import ClasificacionServicio
from app.api.v1.utils.errors import ResourceConflictError

class ClasificacionServicioService:

    @staticmethod
    def get_all_clasificaciones_servicio(include_inactive: bool = False):
        query = ClasificacionServicio.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(ClasificacionServicio.nombre).all()

    @staticmethod
    def get_clasificacion_servicio_by_id(clasificacion_id):
        return ClasificacionServicio.query.get_or_404(clasificacion_id)

    @staticmethod
    def create_clasificacion_servicio(data):
        codigo = data['codigo']
        if ClasificacionServicio.query.filter_by(codigo=codigo).first():
            raise ResourceConflictError(f"El código de clasificación '{codigo}' ya existe.")

        nuevo = ClasificacionServicio(**data)
        db.session.add(nuevo)
        db.session.commit()
        return nuevo

    @staticmethod
    def update_clasificacion_servicio(clasificacion_id, data):
        clasificacion = ClasificacionServicioService.get_clasificacion_servicio_by_id(clasificacion_id)

        if 'codigo' in data and data['codigo'] != clasificacion.codigo:
            if ClasificacionServicio.query.filter_by(codigo=data['codigo']).first():
                raise ResourceConflictError(f"El código '{data['codigo']}' ya está en uso.")
        
        for key, value in data.items():
            setattr(clasificacion, key, value)
        
        db.session.commit()
        return clasificacion

    @staticmethod
    def deactivate_clasificacion_servicio(clasificacion_id):
        clasificacion = ClasificacionServicioService.get_clasificacion_servicio_by_id(clasificacion_id)
        if clasificacion.codigos_referencia:
            raise ResourceConflictError("No se puede desactivar una clasificación que está en uso.")
        
        clasificacion.activo = False
        db.session.commit()
        return clasificacion

    @staticmethod
    def activate_clasificacion_servicio(clasificacion_id):
        clasificacion = ClasificacionServicioService.get_clasificacion_servicio_by_id(clasificacion_id)
        clasificacion.activo = True
        db.session.commit()
        return clasificacion