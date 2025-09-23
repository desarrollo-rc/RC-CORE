# backend/app/api/v1/services/clasificacion_estadistica_service.py
from app.extensions import db
from app.models.productos.clasificaciones import ClasificacionEstadistica
from app.api.v1.utils.errors import ResourceConflictError

class ClasificacionEstadisticaService:

    @staticmethod
    def get_all_clasificaciones_estadistica(include_inactive: bool = False):
        query = ClasificacionEstadistica.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(ClasificacionEstadistica.nombre).all()

    @staticmethod
    def get_clasificacion_estadistica_by_id(clasificacion_id):
        return ClasificacionEstadistica.query.get_or_404(clasificacion_id)

    @staticmethod
    def create_clasificacion_estadistica(data):
        codigo = data['codigo']
        if ClasificacionEstadistica.query.filter_by(codigo=codigo).first():
            raise ResourceConflictError(f"El código de clasificación '{codigo}' ya existe.")

        nuevo = ClasificacionEstadistica(**data)
        db.session.add(nuevo)
        db.session.commit()
        return nuevo

    @staticmethod
    def update_clasificacion_estadistica(clasificacion_id, data):
        clasificacion = ClasificacionEstadisticaService.get_clasificacion_estadistica_by_id(clasificacion_id)

        if 'codigo' in data and data['codigo'] != clasificacion.codigo:
            if ClasificacionEstadistica.query.filter_by(codigo=data['codigo']).first():
                raise ResourceConflictError(f"El código '{data['codigo']}' ya está en uso.")
        
        for key, value in data.items():
            setattr(clasificacion, key, value)
        
        db.session.commit()
        return clasificacion

    @staticmethod
    def deactivate_clasificacion_estadistica(clasificacion_id):
        clasificacion = ClasificacionEstadisticaService.get_clasificacion_estadistica_by_id(clasificacion_id)
        if clasificacion.codigos_referencia:
            raise ResourceConflictError("No se puede desactivar una clasificación que está en uso.")
        
        clasificacion.activo = False
        db.session.commit()
        return clasificacion

    @staticmethod
    def activate_clasificacion_estadistica(clasificacion_id):
        clasificacion = ClasificacionEstadisticaService.get_clasificacion_estadistica_by_id(clasificacion_id)
        clasificacion.activo = True
        db.session.commit()
        return clasificacion