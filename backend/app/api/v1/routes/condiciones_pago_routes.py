# backend/app/api/v1/routes/condiciones_pago_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.condicion_pago_schemas import CondicionPagoSchema, UpdateCondicionPagoSchema
from app.api.v1.services.condicion_pago_service import CondicionPagoService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

condiciones_pago_bp = Blueprint('condiciones_pago_bp', __name__)

schema_single = CondicionPagoSchema()
schema_many = CondicionPagoSchema(many=True)
schema_update = UpdateCondicionPagoSchema()

@condiciones_pago_bp.route('/', methods=['POST'])
@jwt_required()
def create_condicion_pago():
    try:
        data = schema_single.load(request.get_json())
        nueva_condicion = CondicionPagoService.create_condicion_pago(data)
        return schema_single.dump(nueva_condicion), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@condiciones_pago_bp.route('/', methods=['GET'])
@jwt_required()
def get_condiciones_pago():
    condiciones = CondicionPagoService.get_all_condiciones_pago()
    return schema_many.dump(condiciones), 200

@condiciones_pago_bp.route('/<int:condicion_id>', methods=['GET'])
@jwt_required()
def get_condicion_pago(condicion_id):
    try:
        condicion = CondicionPagoService.get_condicion_pago_by_id(condicion_id)
        return schema_single.dump(condicion), 200
    except NotFound:
        return jsonify({"error": f"Condición de pago con ID {condicion_id} no encontrada."}), 404

@condiciones_pago_bp.route('/<int:condicion_id>', methods=['PUT'])
@jwt_required()
def update_condicion_pago(condicion_id):
    try:
        data = schema_update.load(request.get_json())
        condicion_actualizada = CondicionPagoService.update_condicion_pago(condicion_id, data)
        return schema_single.dump(condicion_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        # ... (manejo de errores)
        pass

@condiciones_pago_bp.route('/<int:condicion_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_condicion_pago(condicion_id):
    try:
        condicion = CondicionPagoService.deactivate_condicion_pago(condicion_id)
        return schema_single.dump(condicion), 200
    except NotFound:
        return jsonify({"error": f"Condición de pago con ID {condicion_id} no encontrada."}), 404

@condiciones_pago_bp.route('/<int:condicion_id>/activate', methods=['PUT'])
@jwt_required()
def activate_condicion_pago(condicion_id):
    try:
        condicion = CondicionPagoService.activate_condicion_pago(condicion_id)
        return schema_single.dump(condicion), 200
    except NotFound:
        return jsonify({"error": f"Condición de pago con ID {condicion_id} no encontrada."}), 404