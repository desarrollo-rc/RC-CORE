# backend/app/api/v1/services/fabrica_service.py
from app.extensions import db
from app.models.productos.fabricas import Fabrica
from app.models.entidades.direccion import Pais
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class FabricaService:
    @staticmethod
    def get_all(include_inactive: bool = False):
        query = Fabrica.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(Fabrica.nombre_fabrica).all()

    @staticmethod
    def get_by_id(fabrica_id):
        return Fabrica.query.get_or_404(fabrica_id)

    @staticmethod
    def create(data):
        nombre = data['nombre_fabrica']
        if Fabrica.query.filter_by(nombre_fabrica=nombre).first():
            raise ResourceConflictError(f"La fábrica '{nombre}' ya existe.")
        
        if not Pais.query.get(data['id_pais']):
            raise RelatedResourceNotFoundError(f"El país con ID {data['id_pais']} no existe.")

        nueva_fabrica = Fabrica(**data)
        db.session.add(nueva_fabrica)
        db.session.commit()
        return nueva_fabrica

    @staticmethod
    def update(fabrica_id, data):
        fabrica = FabricaService.get_by_id(fabrica_id)
        
        if 'nombre_fabrica' in data and data['nombre_fabrica'] != fabrica.nombre_fabrica:
            if Fabrica.query.filter_by(nombre_fabrica=data['nombre_fabrica']).first():
                raise ResourceConflictError(f"El nombre de fábrica '{data['nombre_fabrica']}' ya está en uso.")
        
        if 'id_pais' in data and not Pais.query.get(data['id_pais']):
            raise RelatedResourceNotFoundError(f"El país con ID {data['id_pais']} no existe.")

        for key, value in data.items():
            setattr(fabrica, key, value)
        
        db.session.commit()
        return fabrica

    @staticmethod
    def deactivate(fabrica_id):
        fabrica = FabricaService.get_by_id(fabrica_id)
        if fabrica.productos:
            raise ResourceConflictError("No se puede desactivar una fábrica con productos asociados.")
        fabrica.activo = False
        db.session.commit()
        return fabrica

    @staticmethod
    def activate(fabrica_id):
        fabrica = FabricaService.get_by_id(fabrica_id)
        fabrica.activo = True
        db.session.commit()
        return fabrica