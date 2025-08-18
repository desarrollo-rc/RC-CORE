# backend/app/api/v1/routes/tipo_cliente_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.tipo_cliente_schemas import TipoClienteSchema, UpdateTipoClienteSchema
from app.api.v1.services.tipo_cliente_service import TipoClienteService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

tipos_cliente_bp = Blueprint('tipos_cliente_bp', __name__)

schema_single = TipoClienteSchema()
schema_many = TipoClienteSchema(many=True)
schema_update = UpdateTipoClienteSchema()

@tipos_cliente_bp.route('/', methods=['POST'])
@jwt_required()
def create_tipo_cliente():
    try:
        json_data = request.get_json()

        data = schema_single.load(json_data)

        nuevo_tipo = TipoClienteService.create_tipo_cliente(data)

        response_data = schema_single.dump(nuevo_tipo)
        return response_data, 201
        
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@tipos_cliente_bp.route('/', methods=['GET'])
@jwt_required()
def get_tipos_cliente():
    tipos = TipoClienteService.get_all_tipos_cliente()
    return schema_many.dump(tipos), 200

@tipos_cliente_bp.route('/<int:tipo_cliente_id>', methods=['GET'])
@jwt_required()
def get_tipo_cliente(tipo_cliente_id):
    try:
        tipo = TipoClienteService.get_tipo_cliente_by_id(tipo_cliente_id)
        return schema_single.dump(tipo), 200
    except NotFound:
        return jsonify({"error": f"Tipo de cliente con ID {tipo_cliente_id} no encontrado."}), 404

@tipos_cliente_bp.route('/<int:tipo_cliente_id>', methods=['PUT'])
@jwt_required()
def update_tipo_cliente(tipo_cliente_id):
    try:
        data = schema_update.load(request.get_json())
        tipo_actualizado = TipoClienteService.update_tipo_cliente(tipo_cliente_id, data)
        return schema_single.dump(tipo_actualizado), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code
    except NotFound:
        return jsonify({"error": f"Tipo de cliente con ID {tipo_cliente_id} no encontrado."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@tipos_cliente_bp.route('/<int:tipo_cliente_id>', methods=['DELETE'])
@jwt_required()
def delete_tipo_cliente(tipo_cliente_id):
    try:
        TipoClienteService.delete_tipo_cliente(tipo_cliente_id)
        return '', 204 # No Content
    except NotFound:
        return jsonify({"error": f"Tipo de cliente con ID {tipo_cliente_id} no encontrado."}), 404