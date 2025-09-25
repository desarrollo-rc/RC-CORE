# backend/app/api/v1/routes/proveedor_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.proveedor_schemas import ProveedorSchema, UpdateProveedorSchema
from app.api.v1.services.proveedor_service import ProveedorService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

proveedores_bp = Blueprint('proveedores_bp', __name__)

schema_single = ProveedorSchema()
schema_many = ProveedorSchema(many=True)
schema_update = UpdateProveedorSchema()

@proveedores_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_proveedor():
    try:
        data = schema_single.load(request.get_json())
        nuevo = ProveedorService.create_proveedor(data)
        return schema_single.dump(nuevo), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@proveedores_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_proveedores():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    records = ProveedorService.get_all_proveedores(include_inactive)
    return schema_many.dump(records), 200

@proveedores_bp.route('/<int:proveedor_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_proveedor(proveedor_id):
    try:
        data = schema_update.load(request.get_json())
        actualizado = ProveedorService.update_proveedor(proveedor_id, data)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@proveedores_bp.route('/<int:proveedor_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_proveedor(proveedor_id):
    try:
        desactivado = ProveedorService.deactivate_proveedor(proveedor_id)
        return schema_single.dump(desactivado), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@proveedores_bp.route('/<int:proveedor_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_proveedor(proveedor_id):
    try:
        activado = ProveedorService.activate_proveedor(proveedor_id)
        return schema_single.dump(activado), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404