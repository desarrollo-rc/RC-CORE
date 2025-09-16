# backend/app/api/v1/routes/medida_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.medida_schemas import MedidaSchema, UpdateMedidaSchema
from app.api.v1.services.medida_service import MedidaService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

medidas_bp = Blueprint('medidas_bp', __name__)

schema_single = MedidaSchema()
schema_many = MedidaSchema(many=True)
schema_update = UpdateMedidaSchema()

@medidas_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_medida():
    try:
        data = schema_single.load(request.get_json())
        nueva_medida = MedidaService.create_medida(data)
        return schema_single.dump(nueva_medida), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@medidas_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_medidas():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    medidas = MedidaService.get_all_medidas(include_inactive)
    return schema_many.dump(medidas), 200

@medidas_bp.route('/<int:medida_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_medida(medida_id):
    try:
        medida = MedidaService.get_medida_by_id(medida_id)
        return schema_single.dump(medida), 200
    except NotFound:
        return jsonify({"error": f"Medida con ID {medida_id} no encontrada."}), 404

@medidas_bp.route('/<int:medida_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_medida(medida_id):
    try:
        medida = MedidaService.activate_medida(medida_id)
        return schema_single.dump(medida), 200
    except NotFound:
        return jsonify({"error": f"Medida con ID {medida_id} no encontrada."}), 404

@medidas_bp.route('/<int:medida_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_medida(medida_id):
    try:
        medida = MedidaService.deactivate_medida(medida_id)
        return schema_single.dump(medida), 200
    except NotFound:
        return jsonify({"error": f"Medida con ID {medida_id} no encontrada."}), 404

@medidas_bp.route('/<int:medida_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_medida(medida_id):
    try:
        data = schema_update.load(request.get_json())
        medida_actualizada = MedidaService.update_medida(medida_id, data)
        return schema_single.dump(medida_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), code