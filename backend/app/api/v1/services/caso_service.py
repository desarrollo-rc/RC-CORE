# backend/app/api/v1/services/caso_service.py
from app.models.soporte.casos import Caso
from app.api.v1.utils.errors import NotFoundError, BusinessRuleError
from app.extensions import db

class CasoService:
    @staticmethod
    def get_all_casos():
        return Caso.query.all()

    @staticmethod
    def get_all_casos_active():
        return Caso.query.filter_by(activo=True).all()
    
    @staticmethod
    def get_caso_by_id(caso_id):
        caso = Caso.query.get(caso_id)
        if not caso:
            raise NotFoundError(f"Caso con ID {caso_id} no encontrado.")
        return caso
    
    @staticmethod
    def create_caso(data):
        nuevo_caso = Caso(**data)
        db.session.add(nuevo_caso)
        db.session.commit()
        return nuevo_caso
    
    @staticmethod
    def update_caso(caso_id, data):
        caso = CasoService.get_caso_by_id(caso_id)
        for field, value in data.items():
            setattr(caso, field, value)
        db.session.commit()
        return caso
    
    @staticmethod
    def deactivate_caso(caso_id):
        caso = CasoService.get_caso_by_id(caso_id)
        caso.activo = False
        db.session.commit()
        return caso
    
    @staticmethod
    def activate_caso(caso_id):
        caso = CasoService.get_caso_by_id(caso_id)
        caso.activo = True
        db.session.commit()
        return caso