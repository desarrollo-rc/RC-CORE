# backend/app/api/v1/routes/clasificacion_servicio_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.clasificacion_servicio_schemas import ClasificacionServicioSchema, UpdateClasificacionServicioSchema
from app.api.v1.services.clasificacion_servicio_service import ClasificacionServicioService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

clasificaciones_servicio_bp = Blueprint('clasificaciones_servicio_bp', __name__)

schema_single = ClasificacionServicioSchema()
schema_many = ClasificacionServicioSchema(many=True)
schema_update = UpdateClasificacionServicioSchema()

@clasificaciones_servicio_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_clasificacion():
    try:
        data = schema_single.load(request.get_json())
        nuevo = ClasificacionServicioService.create_clasificacion_servicio(data)
        return schema_single.dump(nuevo), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@clasificaciones_servicio_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_clasificaciones():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    records = ClasificacionServicioService.get_all_clasificaciones_servicio(include_inactive)
    return schema_many.dump(records), 200

@clasificaciones_servicio_bp.route('/<int:clasificacion_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_clasificacion(clasificacion_id):
    try:
        data = schema_update.load(request.get_json())
        actualizado = ClasificacionServicioService.update_clasificacion_servicio(clasificacion_id, data)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@clasificaciones_servicio_bp.route('/<int:clasificacion_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_clasificacion(clasificacion_id):
    try:
        record = ClasificacionServicioService.deactivate_clasificacion_servicio(clasificacion_id)
        return schema_single.dump(record), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@clasificaciones_servicio_bp.route('/<int:clasificacion_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_clasificacion(clasificacion_id):
    try:
        record = ClasificacionServicioService.activate_clasificacion_servicio(clasificacion_id)
        return schema_single.dump(record), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404