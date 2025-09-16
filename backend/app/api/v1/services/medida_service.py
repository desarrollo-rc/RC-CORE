# backend/app/api/v1/services/medida_service.py
from app.models.productos.caracteristicas import Medida
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class MedidaService:

    @staticmethod
    def get_all_medidas(include_inactive: bool = False):
        query = Medida.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(Medida.nombre).all()

    @staticmethod
    def get_medida_by_id(medida_id):
        return Medida.query.get_or_404(medida_id)

    @staticmethod
    def create_medida(data):
        nombre = data['nombre']
        if Medida.query.filter_by(nombre=nombre).first():
            raise ResourceConflictError(f"La medida con nombre '{nombre}' ya existe.")

        nueva_medida = Medida(nombre=nombre, unidad=data['unidad'])
        db.session.add(nueva_medida)
        db.session.commit()
        return nueva_medida

    @staticmethod
    def update_medida(medida_id, data):
        medida = MedidaService.get_medida_by_id(medida_id)
        if 'nombre' in data and data['nombre'] != medida.nombre:
            if Medida.query.filter(Medida.nombre == data['nombre'], Medida.id_medida != medida_id).first():
                raise ResourceConflictError(f"El nombre de medida '{data['nombre']}' ya está en uso.")
            medida.nombre = data['nombre']
        
        if 'unidad' in data:
            medida.unidad = data['unidad']
            
        db.session.commit()
        return medida

    @staticmethod
    def deactivate_medida(medida_id):
        medida = MedidaService.get_medida_by_id(medida_id)
        medida.activo = False
        db.session.commit()
        return medida
    
    @staticmethod
    def activate_medida(medida_id):
        medida = MedidaService.get_medida_by_id(medida_id)
        medida.activo = True
        db.session.commit()
        return medida