# backend/app/api/v1/services/tipo_negocio_service.py
from app.extensions import db
from app.models.entidades import TipoNegocio
from app.api.v1.utils.errors import ResourceConflictError

class TipoNegocioService:

    @staticmethod
    def get_all_tipos_negocio(include_inactive: bool = False):
        query = TipoNegocio.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(TipoNegocio.nombre_tipo_negocio).all()

    @staticmethod
    def get_tipo_negocio_by_id(tipo_negocio_id):
        return TipoNegocio.query.get_or_404(tipo_negocio_id)

    @staticmethod
    def create_tipo_negocio(data):
        codigo = data['codigo_tipo_negocio'].upper()
        if TipoNegocio.query.filter_by(codigo_tipo_negocio=codigo).first():
            raise ResourceConflictError(f"El código '{codigo}' ya existe.")

        nuevo_tipo = TipoNegocio(**data)
        db.session.add(nuevo_tipo)
        db.session.commit()
        return nuevo_tipo

    @staticmethod
    def update_tipo_negocio(tipo_negocio_id, data):
        tipo_negocio = TipoNegocioService.get_tipo_negocio_by_id(tipo_negocio_id)

        if 'codigo_tipo_negocio' in data:
            nuevo_codigo = data['codigo_tipo_negocio'].upper()
            if nuevo_codigo != tipo_negocio.codigo_tipo_negocio and TipoNegocio.query.filter_by(codigo_tipo_negocio=nuevo_codigo).first():
                raise ResourceConflictError(f"El código '{nuevo_codigo}' ya está en uso.")
        
        for key, value in data.items():
            setattr(tipo_negocio, key, value)
        
        db.session.commit()
        return tipo_negocio

    @staticmethod
    def deactivate_tipo_negocio(tipo_negocio_id):
        tipo_negocio = TipoNegocioService.get_tipo_negocio_by_id(tipo_negocio_id)
        if tipo_negocio.clientes:
            raise ResourceConflictError("No se puede desactivar un tipo de negocio que tiene clientes asociados.")
        
        tipo_negocio.activo = False
        db.session.commit()
        return tipo_negocio

    @staticmethod
    def activate_tipo_negocio(tipo_negocio_id):
        tipo_negocio = TipoNegocioService.get_tipo_negocio_by_id(tipo_negocio_id)
        tipo_negocio.activo = True
        db.session.commit()
        return tipo_negocio