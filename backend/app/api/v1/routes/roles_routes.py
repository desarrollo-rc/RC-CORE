# backend/app/api/v1/routes/roles_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.rol_schemas import RolSchema, UpdateRolSchema
from app.api.v1.services.rol_service import RolService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

roles_bp = Blueprint('roles_bp', __name__)

schema_single = RolSchema()
schema_many = RolSchema(many=True)
schema_update = UpdateRolSchema()

@roles_bp.route('/', methods=['POST'])
@jwt_required()
def create_rol():
    try:
        data = schema_single.load(request.get_json())
        nuevo_rol = RolService.create_rol(data)
        return schema_single.dump(nuevo_rol), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@roles_bp.route('/', methods=['GET'])
@jwt_required()
def get_roles():
    try:
        roles = RolService.get_all_roles()
        return schema_many.dump(roles), 200
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@roles_bp.route('/<int:rol_id>', methods=['GET'])
@jwt_required()
def get_rol_by_id(rol_id):
    try:
        rol = RolService.get_rol_by_id(rol_id)
        return schema_single.dump(rol), 200
    except NotFound:
        return jsonify({"error": f"Rol con ID {rol_id} no encontrado."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@roles_bp.route('/<int:rol_id>', methods=['PUT'])
@jwt_required()
def update_rol(rol_id):
    try:
        data = schema_update.load(request.get_json())
        rol_actualizado = RolService.update_rol(rol_id, data)
        return schema_single.dump(rol_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@roles_bp.route('/<int:rol_id>', methods=['DELETE'])
@jwt_required()
def delete_rol(rol_id):
    try:
        rol = RolService.delete_rol(rol_id)
        return '', 204
    except NotFound:
        return jsonify({"error": f"Rol con ID {rol_id} no encontrado."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500