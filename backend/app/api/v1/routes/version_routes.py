# backend/app/api/v1/routes/version_routes.py
from flask import Blueprint, jsonify, request
from app.api.v1.schemas.version_schemas import VersionVehiculoSchema, CreateVersionVehiculoSchema, UpdateVersionVehiculoSchema
from app.api.v1.services.version_service import VersionService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.api.v1.utils.errors import BusinessRuleError

versiones_bp = Blueprint('versiones_bp', __name__, url_prefix='/<int:modelo_id>/versiones')

schema_create = CreateVersionVehiculoSchema()
schema_update = UpdateVersionVehiculoSchema()
schema_response = VersionVehiculoSchema()
schema_many_response = VersionVehiculoSchema(many=True)

@versiones_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_versiones(marca_id, modelo_id):
    versiones = VersionService.get_versiones_by_modelo(modelo_id)
    return schema_many_response.dump(versiones), 200

@versiones_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_version(marca_id, modelo_id):
    try:
        data = schema_create.load(request.get_json())
        version = VersionService.create_version(modelo_id, data)
        return schema_response.dump(version), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@versiones_bp.route('/<int:version_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_version(marca_id, modelo_id, version_id):
    try:
        data = schema_update.load(request.get_json())
        version = VersionService.update_version(modelo_id, version_id, data)
        return schema_response.dump(version), 200
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@versiones_bp.route('/<int:version_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_version(marca_id, modelo_id, version_id):
    version = VersionService.deactivate_version(modelo_id, version_id)
    return schema_response.dump(version), 200

@versiones_bp.route('/<int:version_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_version(marca_id, modelo_id, version_id):
    version = VersionService.activate_version(modelo_id, version_id)
    return schema_response.dump(version), 200