from flask import Blueprint, request, jsonify
from app.api.v1.schemas.segmento_cliente_schemas import SegmentoClienteSchema, UpdateSegmentoClienteSchema
from app.api.v1.services.segmento_cliente_service import SegmentoClienteService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

segmentos_cliente_bp = Blueprint('segmentos_cliente_bp', __name__)

schema_single = SegmentoClienteSchema()
schema_many = SegmentoClienteSchema(many=True)
schema_update = UpdateSegmentoClienteSchema()

@segmentos_cliente_bp.route('/', methods=['POST'])
@jwt_required()
def create_segmento_cliente():
    try:
        data = schema_single.load(request.get_json())
        nuevo_segmento = SegmentoClienteService.create_segmento_cliente(data)
        return schema_single.dump(nuevo_segmento), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception as e:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@segmentos_cliente_bp.route('/', methods=['GET'])
@jwt_required()
def get_segmentos_cliente():
    segmentos = SegmentoClienteService.get_all_segmentos_cliente()
    return schema_many.dump(segmentos), 200

@segmentos_cliente_bp.route('/<int:segmento_id>', methods=['GET'])
@jwt_required()
def get_segmento_cliente(segmento_id):
    try:
        segmento = SegmentoClienteService.get_segmento_cliente_by_id(segmento_id)
        return schema_single.dump(segmento), 200
    except NotFound:
        return jsonify({"error": f"Segmento de cliente con ID {segmento_id} no encontrado."}), 404

@segmentos_cliente_bp.route('/<int:segmento_id>', methods=['PUT'])
@jwt_required()
def update_segmento_cliente(segmento_id):
    try:
        data = schema_update.load(request.get_json())
        segmento_actualizado = SegmentoClienteService.update_segmento_cliente(segmento_id, data)
        return schema_single.dump(segmento_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500


@segmentos_cliente_bp.route('/<int:segmento_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_segmento_cliente(segmento_id):
    try:
        segmento = SegmentoClienteService.deactivate_segmento_cliente(segmento_id)
        return schema_single.dump(segmento), 200
    except NotFound:
        return jsonify({"error": f"Segmento de cliente con ID {segmento_id} no encontrado."}), 404

@segmentos_cliente_bp.route('/<int:segmento_id>/activate', methods=['PUT'])
@jwt_required()
def activate_segmento_cliente(segmento_id):
    try:
        segmento = SegmentoClienteService.activate_segmento_cliente(segmento_id)
        return schema_single.dump(segmento), 200
    except NotFound:
        return jsonify({"error": f"Segmento de cliente con ID {segmento_id} no encontrado."}), 404