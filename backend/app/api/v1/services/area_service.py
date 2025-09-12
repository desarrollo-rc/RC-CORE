# backend/app/api/v1/services/area_service.py
from app.models.entidades.areas import Area
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class AreaService:

    @staticmethod
    def get_all_areas():
        return Area.query.filter_by(activo=True).all()

    @staticmethod
    def get_area_by_id(area_id):
        return Area.query.get_or_404(area_id)

    @staticmethod
    def create_area(data):
        codigo = data['codigo_area'].upper()
        if Area.query.filter_by(codigo_area=codigo).first():
            raise ResourceConflictError(f"El código de área '{codigo}' ya existe.")
        
        nueva_area = Area(
            codigo_area=codigo,
            nombre_area=data['nombre_area'],
            descripcion_area=data.get('descripcion_area')
        )
        db.session.add(nueva_area)
        db.session.commit()
        return nueva_area

    @staticmethod
    def update_area(area_id, data):
        area = AreaService.get_area_by_id(area_id)

        if 'codigo_area' in data:
            nuevo_codigo = data['codigo_area'].upper()
            if nuevo_codigo != area.codigo_area and Area.query.filter_by(codigo_area=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de área '{nuevo_codigo}' ya está en uso.")
            area.codigo_area = nuevo_codigo

        for field in ['nombre_area', 'descripcion_area']:
            if field in data:
                setattr(area, field, data[field])
        
        db.session.commit()
        return area
    
    @staticmethod
    def deactivate_area(area_id):
        area = AreaService.get_area_by_id(area_id)
        if area.usuarios:
            raise ResourceConflictError("No se puede desactivar un área que tiene usuarios asignados.")
        
        area.activo = False
        db.session.commit()
        return area

    @staticmethod
    def activate_area(area_id):
        area = AreaService.get_area_by_id(area_id)
        area.activo = True
        db.session.commit()
        return area