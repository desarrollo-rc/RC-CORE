# backend/app/api/v1/routes/permisos_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.permiso_schemas import PermisoSchema, UpdatePermisoSchema
from app.api.v1.services.permiso_service import PermisoService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

permisos_bp = Blueprint('permisos_bp', __name__)

schema_single = PermisoSchema()
schema_many = PermisoSchema(many=True)
schema_update = UpdatePermisoSchema()

@permisos_bp.route('/', methods=['POST'])
@jwt_required()
def create_permiso():
    try:
        data = schema_single.load(request.get_json())
        nuevo_permiso = PermisoService.create_permiso(data)
        return schema_single.dump(nuevo_permiso), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@permisos_bp.route('/', methods=['GET'])
@jwt_required()
def get_permisos():
    permisos = PermisoService.get_all_permisos()
    return schema_many.dump(permisos), 200

@permisos_bp.route('/<int:permiso_id>', methods=['GET'])
@jwt_required()
def get_permiso_by_id(permiso_id):
    try:
        permiso = PermisoService.get_permiso_by_id(permiso_id)
        return schema_single.dump(permiso), 200
    except NotFound:
        return jsonify({"error": f"Permiso con ID {permiso_id} no encontrado."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@permisos_bp.route('/<int:permiso_id>', methods=['PUT'])
@jwt_required()
def update_permiso(permiso_id):
    try:
        data = schema_update.load(request.get_json())
        permiso_actualizado = PermisoService.update_permiso(permiso_id, data)
        return schema_single.dump(permiso_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@permisos_bp.route('/<int:permiso_id>', methods=['DELETE'])
@jwt_required()
def delete_permiso(permiso_id):
    try:
        permiso = PermisoService.delete_permiso(permiso_id)
        return '', 204
    except NotFound:
        return jsonify({"error": f"Permiso con ID {permiso_id} no encontrado."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500