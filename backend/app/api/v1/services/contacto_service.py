# backend/app/api/v1/services/contacto_service.py
from app.models.entidades import Contacto, MaestroClientes
from app.api.v1.utils.errors import RelatedResourceNotFoundError
from app.extensions import db

class ContactoService:

    @staticmethod
    def get_contacto_by_id(contacto_id):
        return Contacto.query.get_or_404(contacto_id)

    @staticmethod
    def get_contactos():
        return Contacto.query.all()

    @staticmethod
    def create_contacto(data):
        cliente_id = data['id_cliente']
        if not MaestroClientes.query.get(cliente_id):
            raise RelatedResourceNotFoundError(f"El cliente con ID {cliente_id} no existe.")

        nuevo_contacto = Contacto(**data)
        db.session.add(nuevo_contacto)
        db.session.commit()
        return nuevo_contacto

    @staticmethod
    def update_contacto(contacto_id, data):
        contacto = ContactoService.get_contacto_by_id(contacto_id)

        for field, value in data.items():
            setattr(contacto, field, value)

        db.session.commit()
        return contacto

    @staticmethod
    def deactivate_contacto(contacto_id):
        contacto = ContactoService.get_contacto_by_id(contacto_id)
        contacto.activo = False
        db.session.commit()
        return contacto
    
    @staticmethod
    def activate_contacto(contacto_id):
        contacto = ContactoService.get_contacto_by_id(contacto_id)
        contacto.activo = True
        db.session.commit()
        return contacto