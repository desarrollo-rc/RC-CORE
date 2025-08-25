# backend/app/api/v1/services/direccion_service.py
from app.models.entidades import Direccion, MaestroClientes
from app.api.v1.utils.errors import RelatedResourceNotFoundError
from app import db

class DireccionService:

    @staticmethod
    def get_direccion_by_id(direccion_id):
        return Direccion.query.get_or_404(direccion_id)

    @staticmethod
    def get_direcciones():
        return Direccion.query.all()

    @staticmethod
    def create_direccion(data):
        cliente_id = data['id_cliente']
        if not MaestroClientes.query.get(cliente_id):
            raise RelatedResourceNotFoundError(f"El cliente con ID {cliente_id} no existe.")

        nueva_direccion = Direccion(**data)
        db.session.add(nueva_direccion)
        db.session.commit()
        return nueva_direccion

    @staticmethod
    def update_direccion(direccion_id, data):
        direccion = DireccionService.get_direccion_by_id(direccion_id)

        for field, value in data.items():
            setattr(direccion, field, value)

        db.session.commit()
        return direccion

    @staticmethod
    def delete_direccion(direccion_id):
        direccion = DireccionService.get_direccion_by_id(direccion_id)
        db.session.delete(direccion)
        db.session.commit()
        return None