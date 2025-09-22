# backend/app/api/v1/routes/origen_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.origen_schemas import OrigenSchema, CreateOrigenSchema
from app.api.v1.services.origen_service import OrigenService
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound
from app.api.v1.utils.errors import BusinessRuleError

origenes_bp = Blueprint('origenes_bp', __name__)

schema_single = OrigenSchema()
schema_many = OrigenSchema(many=True)
schema_create = CreateOrigenSchema()

@origenes_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_origen():
    try:
        data = schema_create.load(request.get_json())
        nuevo = OrigenService.create_origen(data)
        return schema_single.dump(nuevo), 201
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@origenes_bp.route('/', methods=['GET'])
@jwt_required()
def get_origenes():
    records = OrigenService.get_all_origenes()
    return schema_many.dump(records), 200

@origenes_bp.route('/<int:origen_id>', methods=['GET'])
@jwt_required()
def get_origen(origen_id):
    record = OrigenService.get_origen_by_id(origen_id)
    return schema_single.dump(record), 200
    
@origenes_bp.route('/<int:origen_id>', methods=['DELETE'])
@jwt_required()
@permission_required('productos:eliminar')
def delete_origen(origen_id):
    try:
        OrigenService.delete_origen(origen_id)
        return '', 204
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status
    except Exception as e:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500