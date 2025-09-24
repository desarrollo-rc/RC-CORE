# backend/app/api/v1/services/version_service.py
from app.extensions import db
from app.models.productos import VersionVehiculo, Modelo
from app.api.v1.utils.errors import RelatedResourceNotFoundError, ResourceConflictError
from sqlalchemy.orm import joinedload

class VersionService:

    @staticmethod
    def get_all_versiones():
        """
        Obtiene TODAS las versiones de vehículos activas, precargando la información
        del modelo y la marca para una respuesta eficiente.
        """
        return VersionVehiculo.query.options(
            joinedload(VersionVehiculo.modelo)
            .joinedload(Modelo.marca)
        ).filter(VersionVehiculo.activo == True).all()

    @staticmethod
    def _get_modelo_or_404(modelo_id):
        modelo = Modelo.query.get(modelo_id)
        if not modelo:
            raise RelatedResourceNotFoundError(f"El Modelo con ID {modelo_id} no existe.")
        return modelo

    @staticmethod
    def _get_version_or_404(modelo_id, version_id):
        version = VersionVehiculo.query.filter_by(id_version=version_id, id_modelo=modelo_id).first()
        if not version:
            raise RelatedResourceNotFoundError(f"La Versión con ID {version_id} no fue encontrada para el Modelo con ID {modelo_id}.")
        return version

    @staticmethod
    def get_versiones_by_modelo(modelo_id):
        VersionService._get_modelo_or_404(modelo_id)
        return VersionVehiculo.query.filter_by(id_modelo=modelo_id, activo=True).order_by(VersionVehiculo.nombre_version).all()

    @staticmethod
    def create_version(modelo_id, data):
        VersionService._get_modelo_or_404(modelo_id)
        
        nombre_version = data['nombre_version']
        if VersionVehiculo.query.filter_by(id_modelo=modelo_id, nombre_version=nombre_version).first():
            raise ResourceConflictError(f"La versión '{nombre_version}' ya existe para este modelo.")

        nueva_version = VersionVehiculo(id_modelo=modelo_id, **data)
        db.session.add(nueva_version)
        db.session.commit()
        return nueva_version

    @staticmethod
    def update_version(modelo_id, version_id, data):
        version = VersionService._get_version_or_404(modelo_id, version_id)
        
        if 'nombre_version' in data:
            nuevo_nombre = data['nombre_version']
            if nuevo_nombre != version.nombre_version and VersionVehiculo.query.filter_by(id_modelo=modelo_id, nombre_version=nuevo_nombre).first():
                raise ResourceConflictError(f"La versión '{nuevo_nombre}' ya existe para este modelo.")
        
        for key, value in data.items():
            setattr(version, key, value)
        
        db.session.commit()
        return version

    @staticmethod
    def deactivate_version(modelo_id, version_id):
        version = VersionService._get_version_or_404(modelo_id, version_id)
        version.activo = False
        db.session.commit()
        return version

    @staticmethod
    def activate_version(modelo_id, version_id):
        version = VersionService._get_version_or_404(modelo_id, version_id)
        version.activo = True
        db.session.commit()
        return version