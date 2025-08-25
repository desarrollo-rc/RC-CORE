# backend/app/api/v1/routes/canal_venta_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.canal_venta_schemas import CanalVentaSchema, UpdateCanalVentaSchema
from app.api.v1.services.canal_venta_service import CanalVentaService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

canales_venta_bp = Blueprint('canales_venta_bp', __name__)

schema_single = CanalVentaSchema()
schema_many = CanalVentaSchema(many=True)
schema_update = UpdateCanalVentaSchema()

@canales_venta_bp.route('/', methods=['POST'])
@jwt_required()
def create_canal_venta():
    try:
        data = schema_single.load(request.get_json())
        nuevo_canal = CanalVentaService.create_canal_venta(data)
        return schema_single.dump(nuevo_canal), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@canales_venta_bp.route('/', methods=['GET'])
@jwt_required()
def get_canales_venta():
    canales = CanalVentaService.get_all_canales_venta()
    return schema_many.dump(canales), 200

@canales_venta_bp.route('/<int:canal_id>', methods=['GET'])
@jwt_required()
def get_canal_venta(canal_id):
    try:
        canal = CanalVentaService.get_canal_venta_by_id(canal_id)
        return schema_single.dump(canal), 200
    except NotFound:
        return jsonify({"error": f"Canal de venta con ID {canal_id} no encontrado."}), 404

@canales_venta_bp.route('/<int:canal_id>', methods=['PUT'])
@jwt_required()
def update_canal_venta(canal_id):
    try:
        data = schema_update.load(request.get_json())
        canal_actualizado = CanalVentaService.update_canal_venta(canal_id, data)
        return schema_single.dump(canal_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code

@canales_venta_bp.route('/<int:canal_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_canal_venta(canal_id):
    try:
        canal = CanalVentaService.deactivate_canal_venta(canal_id)
        return schema_single.dump(canal), 200
    except NotFound:
        return jsonify({"error": f"Canal de venta con ID {canal_id} no encontrado."}), 404

@canales_venta_bp.route('/<int:canal_id>/activate', methods=['PUT'])
@jwt_required()
def activate_canal_venta(canal_id):
    try:
        canal = CanalVentaService.activate_canal_venta(canal_id)
        return schema_single.dump(canal), 200
    except NotFound:
        return jsonify({"error": f"Canal de venta con ID {canal_id} no encontrado."}), 404