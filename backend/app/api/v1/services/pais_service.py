# backend/app/api/v1/services/pais_service.py
from app.extensions import db
from app.models.entidades.direccion import Pais
from app.api.v1.utils.errors import ResourceConflictError

class PaisService:
    @staticmethod
    def get_all_paises():
        return Pais.query.order_by(Pais.nombre_pais).all()

    @staticmethod
    def get_pais_by_id(pais_id):
        return Pais.query.get_or_404(pais_id)

    @staticmethod
    def create_pais(data):
        nombre = data['nombre_pais']
        if Pais.query.filter_by(nombre_pais=nombre).first():
            raise ResourceConflictError(f"El nombre de país '{nombre}' ya existe.")
        nuevo_pais = Pais(**data)
        db.session.add(nuevo_pais)
        db.session.commit()
        return nuevo_pais

    @staticmethod
    def update_pais(pais_id, data):
        pais = PaisService.get_pais_by_id(pais_id)
        if 'nombre_pais' in data and data['nombre_pais'] != pais.nombre_pais:
            if Pais.query.filter_by(nombre_pais=data['nombre_pais']).first():
                raise ResourceConflictError(f"El nombre de país '{data['nombre_pais']}' ya está en uso.")
        
        for key, value in data.items():
            setattr(pais, key, value)
            
        db.session.commit()
        return pais

    @staticmethod
    def delete_pais(pais_id):
        pais = PaisService.get_pais_by_id(pais_id)
        if pais.regiones or pais.marcas or pais.fabricas:
            raise ResourceConflictError("No se puede eliminar un país que está en uso por una región, marca o fábrica.")
        db.session.delete(pais)
        db.session.commit()
        return None 
    