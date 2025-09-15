# backend/app/api/v1/routes/usuarios_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.usuario_schemas import UsuarioSchema, UsuarioResponseSchema, UpdateUsuarioSchema
from app.api.v1.services.usuario_service import UsuarioService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

usuarios_bp = Blueprint('usuarios_bp', __name__)

schema_create = UsuarioSchema()
schema_update = UpdateUsuarioSchema()
schema_response = UsuarioResponseSchema()
schema_response_many = UsuarioResponseSchema(many=True)

@usuarios_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('usuarios:crear')
def create_usuario():
    try:
        data = schema_create.load(request.get_json())
        nuevo_usuario = UsuarioService.create_usuario(data)
        return schema_response.dump(nuevo_usuario), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@usuarios_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('usuarios:listar')
def get_usuarios():
    usuarios = UsuarioService.get_all_usuarios()
    return schema_response_many.dump(usuarios), 200

@usuarios_bp.route('/<int:usuario_id>', methods=['GET'])
@jwt_required()
@permission_required('usuarios:ver')
def get_usuario(usuario_id):
    try:
        usuario = UsuarioService.get_usuario_by_id(usuario_id)
        return schema_response.dump(usuario), 200
    except NotFound:
        return jsonify({"error": f"Usuario con ID {usuario_id} no encontrado."}), 404

@usuarios_bp.route('/<int:usuario_id>', methods=['PUT'])
@jwt_required()
@permission_required('usuarios:editar')
def update_usuario(usuario_id):
    try:
        data = schema_update.load(request.get_json())
        usuario_actualizado = UsuarioService.update_usuario(usuario_id, data)
        return schema_response.dump(usuario_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        if isinstance(e, ValidationError):
            return jsonify(e.messages), 422
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code

@usuarios_bp.route('/<int:usuario_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('usuarios:desactivar')
def deactivate_usuario(usuario_id):
    try:
        usuario = UsuarioService.deactivate_usuario(usuario_id)
        return schema_response.dump(usuario), 200
    except (NotFound, BusinessRuleError) as e:
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code

@usuarios_bp.route('/<int:usuario_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('usuarios:desactivar')
def activate_usuario(usuario_id):
    try:
        usuario = UsuarioService.activate_usuario(usuario_id)
        return schema_response.dump(usuario), 200
    except NotFound:
        return jsonify({"error": f"Usuario con ID {usuario_id} no encontrado."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500