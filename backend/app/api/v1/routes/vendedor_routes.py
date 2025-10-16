# backend/app/api/v1/routes/vendedor_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.vendedor_schemas import VendedorSchema, VendedorUpdateSchema
from app.api.v1.services.vendedor_service import VendedorService
from app.api.v1.services.notificacion_service import notificacion_service
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound
from app.api.v1.utils.decorators import permission_required

vendedores_bp = Blueprint('vendedores_bp', __name__)

schema_create = VendedorSchema()
schema_update = VendedorUpdateSchema()
schema_response = VendedorSchema()
schema_response_many = VendedorSchema(many=True)

@vendedores_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('usuarios:crear')
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
@permission_required('usuarios:listar')
def get_vendedores():
    vendedores = VendedorService.get_all_vendedores()
    return schema_response_many.dump(vendedores), 200

@vendedores_bp.route('/<int:vendedor_id>', methods=['GET'])
@jwt_required()
@permission_required('usuarios:ver')
def get_vendedor(vendedor_id):
    try:
        vendedor = VendedorService.get_vendedor_by_id(vendedor_id)
        return schema_response.dump(vendedor), 200
    except NotFound:
        return jsonify({"error": f"Vendedor con ID {vendedor_id} no encontrado."}), 404

@vendedores_bp.route('/<int:vendedor_id>', methods=['PUT'])
@jwt_required()
@permission_required('usuarios:editar')
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

@vendedores_bp.route('/<int:vendedor_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('usuarios:cambiar-estado')
def deactivate_vendedor(vendedor_id):
    try:
        vendedor = VendedorService.deactivate_vendedor(vendedor_id)
        return schema_response.dump(vendedor), 200
    except NotFound:
        return jsonify({"error": f"Vendedor con ID {vendedor_id} no encontrado."}), 404

@vendedores_bp.route('/<int:vendedor_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('usuarios:cambiar-estado')
def activate_vendedor(vendedor_id):
    try:
        vendedor = VendedorService.activate_vendedor(vendedor_id)
        return schema_response.dump(vendedor), 200
    except NotFound:
        return jsonify({"error": f"Vendedor con ID {vendedor_id} no encontrado."}), 404

@vendedores_bp.route('/<int:vendedor_id>/enviar_whatsapp', methods=['POST'])
def enviar_whatsapp_a_vendedor(vendedor_id):
    """
    Endpoint para enviar un mensaje de WhatsApp a un vendedor específico.
    """
    data = request.get_json()
    if not data or 'mensaje' not in data:
        return jsonify({"error": "El campo 'mensaje' es requerido en el cuerpo de la solicitud"}), 400

    mensaje_a_enviar = data['mensaje']
    
    # Delegamos la lógica al VendedorService
    resultado = VendedorService.enviar_whatsapp_vendedor(vendedor_id, mensaje_a_enviar)
    
    if resultado.get('success'):
        return jsonify({
            "mensaje": f"Solicitud de envío de WhatsApp a vendedor {vendedor_id} procesada.",
            "detalles_api": resultado.get('data')
        }), 200
    else:
        return jsonify({
            "error": "Fallo al procesar la solicitud de envío de WhatsApp.",
            "detalles": resultado.get('error')
        }), 500