# backend/app/api/v1/services/calidad_service.py
from app.extensions import db
from app.models.productos.calidades import Calidad
from app.api.v1.utils.errors import ResourceConflictError

class CalidadService:

    @staticmethod
    def get_all_calidades(include_inactive: bool = False):
        query = Calidad.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(Calidad.nombre_calidad).all()

    @staticmethod
    def get_calidad_by_id(calidad_id):
        return Calidad.query.get_or_404(calidad_id)

    @staticmethod
    def create_calidad(data):
        codigo = data['codigo_calidad']
        if Calidad.query.filter_by(codigo_calidad=codigo).first():
            raise ResourceConflictError(f"El código de calidad '{codigo}' ya existe.")

        nueva_calidad = Calidad(**data)
        db.session.add(nueva_calidad)
        db.session.commit()
        return nueva_calidad

    @staticmethod
    def update_calidad(calidad_id, data):
        calidad = CalidadService.get_calidad_by_id(calidad_id)

        if 'codigo_calidad' in data:
            nuevo_codigo = data['codigo_calidad']
            if nuevo_codigo != calidad.codigo_calidad and Calidad.query.filter_by(codigo_calidad=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de calidad '{nuevo_codigo}' ya está en uso.")
        
        for key, value in data.items():
            setattr(calidad, key, value)
        
        db.session.commit()
        return calidad

    @staticmethod
    def deactivate_calidad(calidad_id):
        calidad = CalidadService.get_calidad_by_id(calidad_id)
        if calidad.productos:
            raise ResourceConflictError("No se puede desactivar una calidad que tiene productos asociados.")
        
        calidad.activo = False
        db.session.commit()
        return calidad

    @staticmethod
    def activate_calidad(calidad_id):
        calidad = CalidadService.get_calidad_by_id(calidad_id)
        calidad.activo = True
        db.session.commit()
        return calidad