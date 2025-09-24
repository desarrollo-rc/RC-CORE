# backend/app/api/v1/services/aplicacion_service.py
from app.extensions import db
from app.models.productos import Aplicacion, CodigoReferencia, VersionVehiculo, Modelo
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError
from sqlalchemy.orm import joinedload

class AplicacionService:

    @staticmethod
    def _get_codigo_referencia_or_404(ref_id):
        codigo_referencia = CodigoReferencia.query.get(ref_id)
        if not codigo_referencia:
            raise RelatedResourceNotFoundError(f"El Código de Referencia con ID {ref_id} no existe.")
        return codigo_referencia
    
    @staticmethod
    def _get_version_vehiculo_or_404(version_id):
        version_vehiculo = VersionVehiculo.query.get(version_id)
        if not version_vehiculo:
            raise RelatedResourceNotFoundError(f"La Versión de Vehículo con ID {version_id} no existe.")
        return version_vehiculo

    @staticmethod
    def _get_aplicacion_or_404(ref_id, version_id):
        aplicacion = Aplicacion.query.filter_by(id_codigo_referencia=ref_id, id_version_vehiculo=version_id).first()
        if not aplicacion:
            raise RelatedResourceNotFoundError(f"La Aplicación con ID {ref_id} y {version_id} no existe.")
        return aplicacion

    @staticmethod
    def get_all_aplicaciones(include_inactive: bool = False):
        query = Aplicacion.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.all()

    @staticmethod
    def get_aplicaciones_by_codigo_referencia(ref_id):
        """
        Obtiene todas las aplicaciones para un código de referencia, incluyendo
        datos del vehículo para mostrar en el frontend.
        """
        AplicacionService._get_codigo_referencia_or_404(ref_id)
        
        # Usamos joinedload para traer los datos relacionados en una sola consulta
        return Aplicacion.query.options(
            joinedload(Aplicacion.version_vehiculo)
            .joinedload(VersionVehiculo.modelo)
            .joinedload(Modelo.marca)
        ).filter_by(id_codigo_referencia=ref_id).all()

    @staticmethod
    def get_aplicaciones_by_version_vehiculo(version_id):
        AplicacionService._get_version_vehiculo_or_404(version_id)
        return Aplicacion.query.filter_by(id_version_vehiculo=version_id).all()

    @staticmethod
    def get_aplicacion_by_ids(ref_id, version_id):
        AplicacionService._get_codigo_referencia_or_404(ref_id)
        AplicacionService._get_version_vehiculo_or_404(version_id)
        return Aplicacion.query.filter_by(id_codigo_referencia=ref_id, id_version_vehiculo=version_id).first()

    @staticmethod
    def add_aplicacion(ref_id, data):
        """
        Crea una nueva aplicación (asociación) entre un código de referencia y una versión de vehículo.
        """
        version_id = data['id_version_vehiculo']
        
        AplicacionService._get_codigo_referencia_or_404(ref_id)
        AplicacionService._get_version_vehiculo_or_404(version_id)

        # La llave primaria de Aplicacion es (id_version_vehiculo, id_codigo_referencia)
        existente = Aplicacion.query.get((version_id, ref_id))
        if existente:
            raise ResourceConflictError("Esta aplicación ya existe.")

        nueva_aplicacion = Aplicacion(id_codigo_referencia=ref_id, id_version_vehiculo=version_id)
        db.session.add(nueva_aplicacion)
        db.session.commit()
        
        # Refrescamos el objeto para cargar las relaciones anidadas antes de devolverlo
        db.session.refresh(nueva_aplicacion)
        return nueva_aplicacion

    @staticmethod
    def remove_aplicacion(ref_id, version_id):
        """
        Elimina una aplicación existente.
        """
        aplicacion = AplicacionService._get_aplicacion_or_404(ref_id, version_id)
        db.session.delete(aplicacion)
        db.session.commit()
        return None