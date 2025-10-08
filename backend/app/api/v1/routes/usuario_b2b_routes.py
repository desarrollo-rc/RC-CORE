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
    usuarios_b2b = UsuarioB2BService.get_all_usuarios_b2b()
    return jsonify(usuarios_b2b_schema_list.dump(usuarios_b2b)), 200

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