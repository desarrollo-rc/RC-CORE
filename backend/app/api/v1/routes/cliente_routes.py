# backend/app/api/v1/routes/cliente_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.cliente_schemas import ClienteSchema, ClienteResponseSchema, PaginationSchema, UpdateClienteSchema, DeactivateClienteSchema
from app.api.v1.services.cliente_service import ClienteService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound
from app.models.entidades import Usuario

clientes_bp = Blueprint('clientes_bp', __name__)

cliente_schema = ClienteSchema()
clientes_response_schema = ClienteResponseSchema(many=True)
cliente_response_schema_single = ClienteResponseSchema()
pagination_schema = PaginationSchema()
update_cliente_schema = UpdateClienteSchema()
deactivate_schema = DeactivateClienteSchema()

@clientes_bp.route('/', methods=['POST'])
@jwt_required()
def create_cliente():
    """
    Endpoint para crear un nuevo cliente.
    Protegido por JWT, requiere un token de acceso válido.
    """
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida. No se encontró cuerpo JSON."}), 400
    
    try:
        # 1. Validar los datos de entrada con el schema de Marshmallow
        data = cliente_schema.load(json_data)

        # 2. Obtener la identidad del usuario que realiza la acción desde el token JWT
        current_user_id = get_jwt_identity()

        # 3. Llamar al servicio para ejecutar la lógica de negocio
        nuevo_cliente = ClienteService.create_customer(data, current_user_id)

        # 4. Serializar la respuesta
        return cliente_response_schema_single.dump(nuevo_cliente), 201
    
    except ValidationError as err:
        # Error de validación de Marshmallow: los datos enviados son incorrectos
        return jsonify(err.messages), 422
    
    except BusinessRuleError as err:
        # Error de negocio: duplicados, entidades relacionadas faltantes, etc.
        return jsonify({"error": str(err)}), err.status_code

    except Exception as e:
        # Error inesperado: registrar en el log y devolver un error 500
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@clientes_bp.route('/', methods=['GET'])
@jwt_required()
def get_clientes():
    """
    Endpoint para listar todos los clientes con paginación.
    Acepta los parámetros de consulta: ?page=1&per_page=10
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    paginated_result = ClienteService.get_all_customers(page, per_page)

    clientes_data = clientes_response_schema.dump(paginated_result.items)
    pagination_data = pagination_schema.dump(paginated_result)

    return jsonify({
        'clientes': clientes_data,
        'pagination': pagination_data
    }), 200

@clientes_bp.route('/<int:cliente_id>', methods=['GET'])
@jwt_required()
def get_cliente_by_id(cliente_id):
    """
    Endpoint para obtener un cliente específico por su ID.
    """
    try:
        cliente = ClienteService.get_customer_by_id(cliente_id)
        return cliente_response_schema_single.dump(cliente), 200
    
    except NotFound:
        return jsonify({"error": f"Cliente con ID {cliente_id} no encontrado."}), 404
    
    except Exception as e:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@clientes_bp.route('/<int:cliente_id>', methods=['PUT'])
@jwt_required()
def update_cliente(cliente_id):
    """
    Endpoint para actualizar un cliente específico.
    Protegido por JWT, requiere un token de acceso válido.
    """
    
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida. No se encontró cuerpo JSON."}), 400

    try:
        from flask import g
        user_id_from_token = get_jwt_identity()
        user_object = Usuario.query.get(int(user_id_from_token))
        if not user_object:
            return jsonify({"error": "El usuario asociado al token ya no existe."}), 404
        
        g.user = user_object

        # 1. Validar los datos de entrada con el schema de actualización
        data = update_cliente_schema.load(json_data)
        
        # 2. Llamar al servicio para ejecutar la lógica de negocio
        cliente_actualizado = ClienteService.update_customer(cliente_id, data, user_object.id_usuario)
        
        # 3. Serializar y devolver la respuesta con el cliente actualizado
        return cliente_response_schema_single.dump(cliente_actualizado), 200

    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code
    except NotFound:
        return jsonify({"error": f"Cliente con ID {cliente_id} no encontrado."}), 404
    except Exception as e:
        print(f"ERROR INESPERADO: {e}") 
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@clientes_bp.route('/<int:cliente_id>', methods=['DELETE'])
@jwt_required()
def delete_cliente(cliente_id):
    """
    Endpoint para eliminar un cliente específico.
    Protegido por JWT, requiere un token de acceso válido.
    """
    return jsonify({"message": f"Funcionalidad de eliminar cliente {cliente_id} pendiente."}), 501

@clientes_bp.route('/<int:cliente_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_cliente(cliente_id):
    """Endpoint para desactivar un cliente."""
    try:
        data = deactivate_schema.load(request.get_json())
        cliente = ClienteService.deactivate_customer(cliente_id, data)
        return cliente_response_schema_single.dump(cliente), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except NotFound:
        return jsonify({"error": f"Cliente con ID {cliente_id} no encontrado."}), 404

@clientes_bp.route('/<int:cliente_id>/activate', methods=['PUT'])
@jwt_required()
def activate_cliente(cliente_id):
    """Endpoint para activar un cliente."""
    try:
        cliente = ClienteService.activate_customer(cliente_id)
        return cliente_response_schema_single.dump(cliente), 200
    except NotFound:
        return jsonify({"error": f"Cliente con ID {cliente_id} no encontrado."}), 404