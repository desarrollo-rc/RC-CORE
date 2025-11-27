# backend/app/api/v1/routes/usuario_b2b_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.usuario_b2b_schemas import usuarios_b2b_schema, usuarios_b2b_schema_list, create_usuario_b2b_schema, update_usuario_b2b_schema
from app.api.v1.services.usuario_b2b_service import UsuarioB2BService
from app.api.v1.utils.errors import BusinessRuleError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError

usuarios_b2b_bp = Blueprint('usuarios_b2b_bp', __name__)

@usuarios_b2b_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('usuarios_b2b:listar')
def get_usuarios_b2b():
    """
    Endpoint para listar todos los usuarios B2B con paginación y filtros.
    Acepta los parámetros de consulta:
    - page, per_page (paginación)
    - usuario (búsqueda por nombre de usuario)
    - nombre_completo (búsqueda por nombre completo)
    - id_cliente (filtro por cliente)
    - activo (filtro por estado: true/false)
    """
    from app.api.v1.schemas.cliente_schemas import PaginationSchema
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    
    # Filtros de búsqueda
    usuario = request.args.get('usuario', None)
    nombre_completo = request.args.get('nombre_completo', None)
    
    # Filtros por ID
    id_cliente = request.args.get('id_cliente', None, type=int)
    
    # Filtro por estado
    activo_param = request.args.get('activo', None)
    activo = None
    if activo_param is not None:
        activo = activo_param.lower() == 'true'
    
    paginated_result = UsuarioB2BService.get_all_usuarios_b2b(
        page=page,
        per_page=per_page,
        usuario=usuario,
        nombre_completo=nombre_completo,
        id_cliente=id_cliente,
        activo=activo
    )
    
    usuarios_data = usuarios_b2b_schema_list.dump(paginated_result.items)
    pagination_schema = PaginationSchema()
    pagination_data = pagination_schema.dump(paginated_result)
    
    return jsonify({
        'usuarios': usuarios_data,
        'pagination': pagination_data
    }), 200

@usuarios_b2b_bp.route('/<int:usuario_b2b_id>', methods=['GET'])
@jwt_required()
@permission_required('usuarios_b2b:ver')
def get_usuario_b2b(usuario_b2b_id):
    usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(usuario_b2b_id)
    return jsonify(usuarios_b2b_schema.dump(usuario_b2b)), 200

@usuarios_b2b_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('usuarios_b2b:crear')
def create_usuario_b2b():
    try:
        data = create_usuario_b2b_schema.load(request.json)
        nuevo_usuario_b2b = UsuarioB2BService.create_usuario_b2b(data)
        return jsonify(usuarios_b2b_schema.dump(nuevo_usuario_b2b)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@usuarios_b2b_bp.route('/<int:usuario_b2b_id>', methods=['PUT'])
@jwt_required()
@permission_required('usuarios_b2b:editar')
def update_usuario_b2b(usuario_b2b_id):
    try:
        data = update_usuario_b2b_schema.load(request.json)
        usuario_b2b_actualizado = UsuarioB2BService.update_usuario_b2b(usuario_b2b_id, data)
        return jsonify(usuarios_b2b_schema.dump(usuario_b2b_actualizado)), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@usuarios_b2b_bp.route('/<int:usuario_b2b_id>/desactivar', methods=['PUT'])
@jwt_required()
@permission_required('usuarios_b2b:cambiar-estado')
def deactivate_usuario_b2b(usuario_b2b_id):
    try:
        usuario_b2b = UsuarioB2BService.deactivate_usuario_b2b(usuario_b2b_id)
        return jsonify(usuarios_b2b_schema.dump(usuario_b2b)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@usuarios_b2b_bp.route('/<int:usuario_b2b_id>/activar', methods=['PUT'])
@jwt_required()
@permission_required('usuarios_b2b:cambiar-estado')
def activate_usuario_b2b(usuario_b2b_id):
    try:
        usuario_b2b = UsuarioB2BService.activate_usuario_b2b(usuario_b2b_id)
        return jsonify(usuarios_b2b_schema.dump(usuario_b2b)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@usuarios_b2b_bp.route('/cliente/<int:cliente_id>', methods=['GET'])
@jwt_required()
@permission_required('usuarios_b2b:listar')
def get_usuarios_b2b_by_cliente(cliente_id):
    try:
        usuarios_b2b = UsuarioB2BService.get_usuarios_b2b_by_cliente(cliente_id)
        return jsonify(usuarios_b2b_schema_list.dump(usuarios_b2b)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@usuarios_b2b_bp.route('/cliente/<int:cliente_id>/sugerir-usuario', methods=['GET'])
@jwt_required()
@permission_required('usuarios_b2b:listar')
def sugerir_nombre_usuario(cliente_id):
    try:
        nombre_sugerido = UsuarioB2BService.sugerir_nombre_usuario(cliente_id)
        return jsonify({"nombre_sugerido": nombre_sugerido}), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code