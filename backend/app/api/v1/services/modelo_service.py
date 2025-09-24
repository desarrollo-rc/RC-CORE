# backend/app/api/v1/services/modelo_service.py
from app.extensions import db
from app.models.productos import Modelo, Marca
from app.api.v1.utils.errors import RelatedResourceNotFoundError, ResourceConflictError

class ModeloService:

    @staticmethod
    def _get_marca_or_404(marca_id):
        marca = Marca.query.get(marca_id)
        if not marca:
            raise RelatedResourceNotFoundError(f"La Marca con ID {marca_id} no existe.")
        return marca

    @staticmethod
    def _get_modelo_or_404(marca_id, modelo_id):
        modelo = Modelo.query.filter_by(id_modelo=modelo_id, id_marca=marca_id).first()
        if not modelo:
            raise RelatedResourceNotFoundError(f"El Modelo con ID {modelo_id} no fue encontrado para la Marca con ID {marca_id}.")
        return modelo

    @staticmethod
    def get_modelos_by_marca(marca_id):
        ModeloService._get_marca_or_404(marca_id)
        return Modelo.query.filter_by(id_marca=marca_id, activo=True).order_by(Modelo.nombre_modelo).all()

    @staticmethod
    def create_modelo(marca_id, data):
        ModeloService._get_marca_or_404(marca_id)
        
        nombre_modelo = data['nombre_modelo']
        if Modelo.query.filter_by(id_marca=marca_id, nombre_modelo=nombre_modelo).first():
            raise ResourceConflictError(f"El modelo '{nombre_modelo}' ya existe para esta marca.")

        nuevo_modelo = Modelo(
            nombre_modelo=nombre_modelo,
            codigo_modelo=data.get('codigo_modelo'),
            id_marca=marca_id
        )
        db.session.add(nuevo_modelo)
        db.session.commit()
        return nuevo_modelo
        
    @staticmethod
    def get_modelo_by_id(marca_id, modelo_id):
        return ModeloService._get_modelo_or_404(marca_id, modelo_id)
        
    @staticmethod
    def update_modelo(marca_id, modelo_id, data):
        modelo = ModeloService._get_modelo_or_404(marca_id, modelo_id)
        
        if 'nombre_modelo' in data:
            nuevo_nombre = data['nombre_modelo']
            if nuevo_nombre != modelo.nombre_modelo and Modelo.query.filter_by(id_marca=marca_id, nombre_modelo=nuevo_nombre).first():
                raise ResourceConflictError(f"El modelo '{nuevo_nombre}' ya existe para esta marca.")
            modelo.nombre_modelo = nuevo_nombre
        if 'codigo_modelo' in data:
            modelo.codigo_modelo = data['codigo_modelo']
            
        db.session.commit()
        return modelo

    @staticmethod
    def deactivate_modelo(marca_id, modelo_id):
        modelo = ModeloService._get_modelo_or_404(marca_id, modelo_id)
        modelo.activo = False
        db.session.commit()
        return modelo

    @staticmethod
    def activate_modelo(marca_id, modelo_id):
        modelo = ModeloService._get_modelo_or_404(marca_id, modelo_id)
        modelo.activo = True
        db.session.commit()
        return modelo