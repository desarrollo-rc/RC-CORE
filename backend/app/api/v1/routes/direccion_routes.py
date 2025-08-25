# backend/app/api/v1/routes/direccion_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.direccion_schemas import DireccionSchema, UpdateDireccionSchema
from app.api.v1.services.direccion_service import DireccionService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

direcciones_bp = Blueprint('direcciones_bp', __name__)

schema_single = DireccionSchema()
schema_update = UpdateDireccionSchema()

@direcciones_bp.route('/', methods=['POST'])
@jwt_required()
def create_direccion():
    try:
        data = schema_single.load(request.get_json())
        nueva_direccion = DireccionService.create_direccion(data)
        return schema_single.dump(nueva_direccion), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@direcciones_bp.route('/', methods=['GET'])
@jwt_required()
def get_direcciones():
    direcciones = DireccionService.get_direcciones()
    return jsonify([schema_single.dump(direccion) for direccion in direcciones]), 200

@direcciones_bp.route('/<int:direccion_id>', methods=['GET'])
@jwt_required()
def get_direccion(direccion_id):
    try:
        direccion = DireccionService.get_direccion_by_id(direccion_id)
        return schema_single.dump(direccion), 200
    except NotFound:
        return jsonify({"error": f"Dirección con ID {direccion_id} no encontrada."}), 404

@direcciones_bp.route('/<int:direccion_id>', methods=['PUT'])
@jwt_required()
def update_direccion(direccion_id):
    try:
        data = schema_update.load(request.get_json())
        direccion_actualizada = DireccionService.update_direccion(direccion_id, data)
        return schema_single.dump(direccion_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code

@direcciones_bp.route('/<int:direccion_id>', methods=['DELETE'])
@jwt_required()
def delete_direccion(direccion_id):
    try:
        DireccionService.delete_direccion(direccion_id)
        return '', 204
    except NotFound:
        return jsonify({"error": f"Dirección con ID {direccion_id} no encontrada."}), 404