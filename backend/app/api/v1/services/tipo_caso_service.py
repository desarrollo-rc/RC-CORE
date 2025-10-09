# backend/app/api/v1/services/tipo_caso_service.py
from app.models.soporte.tipos_caso import TipoCaso
from app.api.v1.utils.errors import RelatedResourceNotFoundError, ResourceConflictError
from app.extensions import db

class TipoCasoService:
    @staticmethod
    def get_all_tipos_caso():
        return TipoCaso.query.all()

    @staticmethod
    def get_all_tipos_caso_active():
        return TipoCaso.query.filter_by(activo=True).all()
    
    @staticmethod
    def get_tipo_caso_by_id(tipo_caso_id):
        tipo_caso = TipoCaso.query.get(tipo_caso_id)
        if not tipo_caso:
            raise RelatedResourceNotFoundError(f"Tipo de caso con ID {tipo_caso_id} no encontrado.")
        return tipo_caso
    
    @staticmethod
    def get_tipo_caso_by_codigo(codigo):
        return TipoCaso.get_by_codigo(codigo)
    
    @staticmethod
    def create_tipo_caso(data):
        # Validar que no exista un tipo de caso con el mismo código
        existing = TipoCaso.query.filter_by(codigo_tipo_caso=data['codigo_tipo_caso'].upper().strip()).first()
        if existing:
            raise ResourceConflictError(f"Ya existe un tipo de caso con el código {data['codigo_tipo_caso']}")
        
        nuevo_tipo_caso = TipoCaso(**data)
        db.session.add(nuevo_tipo_caso)
        db.session.commit()
        return nuevo_tipo_caso
    
    @staticmethod
    def update_tipo_caso(tipo_caso_id, data):
        tipo_caso = TipoCasoService.get_tipo_caso_by_id(tipo_caso_id)
        
        # Si se está actualizando el código, validar que no exista
        if 'codigo_tipo_caso' in data:
            existing = TipoCaso.query.filter(
                TipoCaso.codigo_tipo_caso == data['codigo_tipo_caso'].upper().strip(),
                TipoCaso.id_tipo_caso != tipo_caso_id
            ).first()
            if existing:
                raise ResourceConflictError(f"Ya existe un tipo de caso con el código {data['codigo_tipo_caso']}")
        
        for field, value in data.items():
            setattr(tipo_caso, field, value)
        db.session.commit()
        return tipo_caso
    
    @staticmethod
    def deactivate_tipo_caso(tipo_caso_id):
        tipo_caso = TipoCasoService.get_tipo_caso_by_id(tipo_caso_id)
        tipo_caso.activo = False
        db.session.commit()
        return tipo_caso
    
    @staticmethod
    def activate_tipo_caso(tipo_caso_id):
        tipo_caso = TipoCasoService.get_tipo_caso_by_id(tipo_caso_id)
        tipo_caso.activo = True
        db.session.commit()
        return tipo_caso

