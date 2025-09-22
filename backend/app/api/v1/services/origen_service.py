# backend/app/api/v1/services/origen_service.py
from app.extensions import db
from app.models.productos.origenes import Origen
from app.models.entidades.direccion import Pais
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class OrigenService:
    @staticmethod
    def get_all_origenes():
        return Origen.query.join(Pais).order_by(Pais.nombre_pais).all()

    @staticmethod
    def get_origen_by_id(origen_id):
        return Origen.query.get_or_404(origen_id)

    @staticmethod
    def create_origen(data):
        pais_id = data['id_pais']
        
        if not Pais.query.get(pais_id):
            raise RelatedResourceNotFoundError(f"El país con ID {pais_id} no existe.")
            
        if Origen.query.filter_by(id_pais=pais_id).first():
            raise ResourceConflictError("Este país ya ha sido agregado como un origen.")

        nuevo_origen = Origen(id_pais=pais_id)
        db.session.add(nuevo_origen)
        db.session.commit()
        return nuevo_origen

    @staticmethod
    def delete_origen(origen_id):
        origen = Origen.query.get_or_404(origen_id)
        if origen.productos:
            raise ResourceConflictError("No se puede eliminar un origen que tiene productos asociados.")
            
        db.session.delete(origen)
        db.session.commit()
        return None