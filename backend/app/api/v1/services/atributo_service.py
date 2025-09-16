# backend/app/api/v1/services/atributo_service.py
from app.models.productos.caracteristicas import Atributo
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class AtributoService:

    @staticmethod
    def get_all_atributos(include_inactive: bool = False):
        query = Atributo.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(Atributo.nombre).all()

    @staticmethod
    def get_atributo_by_id(atributo_id):
        return Atributo.query.get_or_404(atributo_id)

    @staticmethod
    def create_atributo(data):
        nombre = data['nombre']
        if Atributo.query.filter_by(nombre=nombre).first():
            raise ResourceConflictError(f"El atributo con nombre '{nombre}' ya existe.")

        nuevo_atributo = Atributo(nombre=nombre)
        db.session.add(nuevo_atributo)
        db.session.commit()
        return nuevo_atributo

    @staticmethod
    def update_atributo(atributo_id, data):
        atributo = AtributoService.get_atributo_by_id(atributo_id)
        if 'nombre' in data and data['nombre'] != atributo.nombre:
            if Atributo.query.filter(Atributo.nombre == data['nombre'], Atributo.id_atributo != atributo_id).first():
                raise ResourceConflictError(f"El nombre de atributo '{data['nombre']}' ya está en uso.")
            atributo.nombre = data['nombre']
        
        db.session.commit()
        return atributo
    
    @staticmethod
    def deactivate_atributo(atributo_id):
        atributo = AtributoService.get_atributo_by_id(atributo_id)
        atributo.activo = False
        db.session.commit()
        return atributo

    @staticmethod
    def activate_atributo(atributo_id):
        atributo = AtributoService.get_atributo_by_id(atributo_id)
        atributo.activo = True
        db.session.commit()
        return atributo