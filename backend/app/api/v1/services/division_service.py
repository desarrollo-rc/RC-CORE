# backend/app/api/v1/services/division_service.py
from app.models.productos.categorias import Division
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class DivisionService:

    @staticmethod
    def get_all_divisiones(include_inactive: bool = False):
        query = Division.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(Division.nombre_division).all()

    @staticmethod
    def get_division_by_id(division_id):
        return Division.query.get_or_404(division_id)

    @staticmethod
    def create_division(data):
        codigo = data['codigo_division'].upper()
        if Division.query.filter_by(codigo_division=codigo).first():
            raise ResourceConflictError(f"El código de división '{codigo}' ya existe.")

        nueva_division = Division(
            codigo_division=codigo,
            nombre_division=data['nombre_division']
        )
        db.session.add(nueva_division)
        db.session.commit()
        return nueva_division

    @staticmethod
    def update_division(division_id, data):
        division = DivisionService.get_division_by_id(division_id)

        if 'codigo_division' in data:
            nuevo_codigo = data['codigo_division'].upper()
            if nuevo_codigo != division.codigo_division and Division.query.filter_by(codigo_division=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de división '{nuevo_codigo}' ya está en uso.")
            division.codigo_division = nuevo_codigo

        if 'nombre_division' in data:
            division.nombre_division = data['nombre_division']
        
        db.session.commit()
        return division
    
    @staticmethod
    def deactivate_division(division_id):
        division = DivisionService.get_division_by_id(division_id)
        if division.categorias:
            raise ResourceConflictError("No se puede desactivar una división que tiene categorías asignadas.")
        
        division.activo = False
        db.session.commit()
        return division

    @staticmethod
    def activate_division(division_id):
        division = DivisionService.get_division_by_id(division_id)
        division.activo = True
        db.session.commit()
        return division