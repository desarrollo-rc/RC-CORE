# backend/app/api/v1/routes/calidad_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.calidad_schemas import CalidadSchema, UpdateCalidadSchema
from app.api.v1.services.calidad_service import CalidadService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

calidades_bp = Blueprint('calidades_bp', __name__)

schema_single = CalidadSchema()
schema_many = CalidadSchema(many=True)
schema_update = UpdateCalidadSchema()

@calidades_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_calidad():
    try:
        data = schema_single.load(request.get_json())
        nueva_calidad = CalidadService.create_calidad(data)
        return schema_single.dump(nueva_calidad), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@calidades_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_calidades():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    calidades = CalidadService.get_all_calidades(include_inactive)
    return schema_many.dump(calidades), 200

@calidades_bp.route('/<int:calidad_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_calidad(calidad_id):
    try:
        data = schema_update.load(request.get_json())
        calidad_actualizada = CalidadService.update_calidad(calidad_id, data)
        return schema_single.dump(calidad_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), code

@calidades_bp.route('/<int:calidad_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_calidad(calidad_id):
    try:
        calidad = CalidadService.deactivate_calidad(calidad_id)
        return schema_single.dump(calidad), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@calidades_bp.route('/<int:calidad_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_calidad(calidad_id):
    try:
        calidad = CalidadService.activate_calidad(calidad_id)
        return schema_single.dump(calidad), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404