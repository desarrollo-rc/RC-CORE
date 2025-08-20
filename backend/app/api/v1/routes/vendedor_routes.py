# backend/app/api/v1/routes/vendedor_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.vendedor_schemas import VendedorSchema, VendedorUpdateSchema
from app.api.v1.services.vendedor_service import VendedorService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

vendedores_bp = Blueprint('vendedores_bp', __name__)

schema_create = VendedorSchema()
schema_update = VendedorUpdateSchema()
schema_response = VendedorSchema()
schema_response_many = VendedorSchema(many=True)

@vendedores_bp.route('/', methods=['POST'])
@jwt_required()
def create_vendedor():
    try:
        data = schema_create.load(request.get_json())
        nuevo_vendedor = VendedorService.create_vendedor(data)
        return schema_response.dump(nuevo_vendedor), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@vendedores_bp.route('/', methods=['GET'])
@jwt_required()
def get_vendedores():
    vendedores = VendedorService.get_all_vendedores()
    return schema_response_many.dump(vendedores), 200

@vendedores_bp.route('/<int:vendedor_id>', methods=['GET'])
@jwt_required()
def get_vendedor(vendedor_id):
    try:
        vendedor = VendedorService.get_vendedor_by_id(vendedor_id)
        return schema_response.dump(vendedor), 200
    except NotFound:
        return jsonify({"error": f"Vendedor con ID {vendedor_id} no encontrado."}), 404

@vendedores_bp.route('/<int:vendedor_id>', methods=['PUT'])
@jwt_required()
def update_vendedor(vendedor_id):
    try:
        data = schema_update.load(request.get_json())
        vendedor_actualizado = VendedorService.update_vendedor(vendedor_id, data)
        return schema_response.dump(vendedor_actualizado), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except (BusinessRuleError, NotFound) as e:
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code

@vendedores_bp.route('/<int:vendedor_id>', methods=['DELETE'])
@jwt_required()
def delete_vendedor(vendedor_id):
    try:
        VendedorService.delete_vendedor(vendedor_id)
        return '', 204
    except (BusinessRuleError, NotFound) as e:
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code