# backend/app/api/v1/routes/vehiculo_routes.py
from flask import Blueprint, jsonify
from app.api.v1.schemas.version_schemas import VersionVehiculoSchema
from app.api.v1.services.version_service import VersionService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required

vehiculos_bp = Blueprint('vehiculos_bp', __name__, url_prefix='/vehiculos')

schema_many_response = VersionVehiculoSchema(many=True)

@vehiculos_bp.route('/versiones', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_all_versiones_route():
    """
    Endpoint para obtener la lista completa de todas las versiones de vehículos.
    """
    versiones = VersionService.get_all_versiones()
    return schema_many_response.dump(versiones), 200