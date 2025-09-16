# backend/app/api/v1/routes/division_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.division_schemas import DivisionSchema, UpdateDivisionSchema
from app.api.v1.services.division_service import DivisionService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

divisiones_bp = Blueprint('divisiones_bp', __name__)

schema_single = DivisionSchema()
schema_many = DivisionSchema(many=True)
schema_update = UpdateDivisionSchema()

@divisiones_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_division():
    try:
        data = schema_single.load(request.get_json())
        nueva_division = DivisionService.create_division(data)
        return schema_single.dump(nueva_division), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@divisiones_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_divisiones():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    divisiones = DivisionService.get_all_divisiones(include_inactive=include_inactive)
    return schema_many.dump(divisiones), 200

@divisiones_bp.route('/<int:division_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_division(division_id):
    try:
        division = DivisionService.get_division_by_id(division_id)
        return schema_single.dump(division), 200
    except NotFound:
        return jsonify({"error": f"División con ID {division_id} no encontrada."}), 404

@divisiones_bp.route('/<int:division_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_division(division_id):
    try:
        data = schema_update.load(request.get_json())
        division_actualizada = DivisionService.update_division(division_id, data)
        return schema_single.dump(division_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code

@divisiones_bp.route('/<int:division_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_division(division_id):
    try:
        division = DivisionService.deactivate_division(division_id)
        return schema_single.dump(division), 200
    except (NotFound, BusinessRuleError) as e:
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code

@divisiones_bp.route('/<int:division_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_division(division_id):
    try:
        division = DivisionService.activate_division(division_id)
        return schema_single.dump(division), 200
    except NotFound:
        return jsonify({"error": f"División con ID {division_id} no encontrada."}), 404