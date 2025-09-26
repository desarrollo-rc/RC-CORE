# backend/app/api/v1/routes/tipo_negocio_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.tipo_negocio_schemas import TipoNegocioSchema, UpdateTipoNegocioSchema
from app.api.v1.services.tipo_negocio_service import TipoNegocioService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

tipos_negocio_bp = Blueprint('tipos_negocio_bp', __name__)

schema_single = TipoNegocioSchema()
schema_many = TipoNegocioSchema(many=True)
schema_update = UpdateTipoNegocioSchema()

@tipos_negocio_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('clientes:crear') # Usamos permisos de clientes por ahora
def create_tipo_negocio():
    try:
        data = schema_single.load(request.get_json())
        nuevo = TipoNegocioService.create_tipo_negocio(data)
        return schema_single.dump(nuevo), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@tipos_negocio_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('clientes:listar')
def get_tipos_negocio():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    records = TipoNegocioService.get_all_tipos_negocio(include_inactive)
    return schema_many.dump(records), 200

@tipos_negocio_bp.route('/<int:tipo_id>', methods=['PUT'])
@jwt_required()
@permission_required('clientes:editar')
def update_tipo_negocio(tipo_id):
    try:
        data = schema_update.load(request.get_json())
        actualizado = TipoNegocioService.update_tipo_negocio(tipo_id, data)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@tipos_negocio_bp.route('/<int:tipo_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('clientes:cambiar-estado')
def deactivate_tipo_negocio(tipo_id):
    try:
        record = TipoNegocioService.deactivate_tipo_negocio(tipo_id)
        return schema_single.dump(record), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@tipos_negocio_bp.route('/<int:tipo_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('clientes:cambiar-estado')
def activate_tipo_negocio(tipo_id):
    try:
        record = TipoNegocioService.activate_tipo_negocio(tipo_id)
        return schema_single.dump(record), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404