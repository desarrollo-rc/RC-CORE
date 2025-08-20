# backend/app/api/v1/routes/empresa_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.empresa_schemas import EmpresaSchema, UpdateEmpresaSchema
from app.api.v1.services.empresa_service import EmpresaService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

empresas_bp = Blueprint('empresas_bp', __name__)

schema_single = EmpresaSchema()
schema_many = EmpresaSchema(many=True)
schema_update = UpdateEmpresaSchema()

@empresas_bp.route('/', methods=['POST'])
@jwt_required()
def create_empresa():
    try:
        data = schema_single.load(request.get_json())
        nueva_empresa = EmpresaService.create_empresa(data)
        return schema_single.dump(nueva_empresa), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@empresas_bp.route('/', methods=['GET'])
@jwt_required()
def get_empresas():
    empresas = EmpresaService.get_all_empresas()
    return schema_many.dump(empresas), 200

@empresas_bp.route('/<int:empresa_id>', methods=['GET'])
@jwt_required()
def get_empresa(empresa_id):
    try:
        empresa = EmpresaService.get_empresa_by_id(empresa_id)
        return schema_single.dump(empresa), 200
    except NotFound:
        return jsonify({"error": f"Empresa con ID {empresa_id} no encontrada."}), 404

@empresas_bp.route('/<int:empresa_id>', methods=['PUT'])
@jwt_required()
def update_empresa(empresa_id):
    try:
        data = schema_update.load(request.get_json())
        empresa_actualizada = EmpresaService.update_empresa(empresa_id, data)
        return schema_single.dump(empresa_actualizada), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except (BusinessRuleError, NotFound) as e:
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code

@empresas_bp.route('/<int:empresa_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_empresa(empresa_id):
    try:
        empresa = EmpresaService.deactivate_empresa(empresa_id)
        return schema_single.dump(empresa), 200
    except (BusinessRuleError, NotFound) as e:
        status_code = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status_code

@empresas_bp.route('/<int:empresa_id>/activate', methods=['PUT'])
@jwt_required()
def activate_empresa(empresa_id):
    try:
        empresa = EmpresaService.activate_empresa(empresa_id)
        return schema_single.dump(empresa), 200
    except NotFound:
        return jsonify({"error": f"Empresa con ID {empresa_id} no encontrada."}), 404