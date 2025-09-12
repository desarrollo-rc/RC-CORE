# backend/app/api/v1/routes/pedidos_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.pedidos_schemas import PedidoCreateSchema, PedidoResponseSchema, PedidoListResponseSchema, PedidoUpdateEstadoSchema
from app.api.v1.schemas.cliente_schemas import PaginationSchema
from app.api.v1.services.pedidos_service import PedidoService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from datetime import datetime
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound

pedidos_bp = Blueprint('pedidos_bp', __name__)

schema_create = PedidoCreateSchema()
schema_response = PedidoResponseSchema()
schema_list_response = PedidoListResponseSchema(many=True)
pagination_schema = PaginationSchema()
schema_update_estado = PedidoUpdateEstadoSchema()

@pedidos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('pedidos:crear')
def create_pedido():
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
    
    try:
        data = schema_create.load(json_data)
        current_user_id = get_jwt_identity()
        nuevo_pedido = PedidoService.create_pedido(data, current_user_id)
        return schema_response.dump(nuevo_pedido), 201
    
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as err:
        return jsonify({"error": str(err)}), err.status_code
    except Exception as e:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@pedidos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('pedidos:listar')
def get_pedidos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    filters = {
        'id_cliente': request.args.get('cliente_id', type=int),
        'id_estado_general': request.args.get('estado_id', type=int),
        'fecha_desde': request.args.get('fecha_desde'),
        'fecha_hasta': request.args.get('fecha_hasta')
    }

    filters = {k: v for k, v in filters.items() if v is not None}

    paginated_result = PedidoService.get_all_pedidos(page, per_page, **filters)
    
    pedidos_data = schema_list_response.dump(paginated_result.items)
    pagination_data = pagination_schema.dump(paginated_result)

    return jsonify({
        'pedidos': pedidos_data,
        'pagination': pagination_data
    }), 200

@pedidos_bp.route('/<int:pedido_id>', methods=['GET'])
@jwt_required()
@permission_required('pedidos:ver')
def get_pedido_by_id(pedido_id):
    try:
        pedido = PedidoService.get_pedido_by_id(pedido_id)
        return schema_response.dump(pedido), 200
    except NotFound:
        return jsonify({"error": f"Pedido con ID {pedido_id} no encontrado."}), 404

@pedidos_bp.route('/<int:pedido_id>/estado', methods=['PUT'])
@jwt_required()
@permission_required('pedidos:actualizar_estado')
def update_pedido_estado(pedido_id):
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
        
    try:
        data = schema_update_estado.load(json_data)
        current_user_id = get_jwt_identity()
        
        pedido_actualizado = PedidoService.update_estado(pedido_id, data, current_user_id)
        
        return schema_response.dump(pedido_actualizado), 200
    
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as err:
        return jsonify({"error": str(err)}), err.status_code
    except NotFound:
        return jsonify({"error": f"Pedido con ID {pedido_id} no encontrado."}), 404
    except Exception as e:
        return jsonify({"error": f"Ocurrió un error interno: {e}"}), 500