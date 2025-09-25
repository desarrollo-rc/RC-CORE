# backend/app/api/v1/routes/maestro_productos_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.maestro_productos_schemas import MaestroProductoSchema, UpdateMaestroProductoSchema
from app.api.v1.services.maestro_productos_service import MaestroProductoService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound

maestro_productos_bp = Blueprint('maestro_productos_bp', __name__)

schema_single = MaestroProductoSchema()
schema_many = MaestroProductoSchema(many=True)
schema_update = UpdateMaestroProductoSchema()

@maestro_productos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_producto():
    try:
        user_id = get_jwt_identity()
        data = schema_single.load(request.get_json())
        nuevo_producto = MaestroProductoService.create_producto(data, user_id)
        return schema_single.dump(nuevo_producto), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@maestro_productos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_productos():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    productos = MaestroProductoService.get_all_productos(include_inactive)
    return schema_many.dump(productos), 200

@maestro_productos_bp.route('/<int:producto_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_producto(producto_id):
    try:
        data = schema_update.load(request.get_json())
        actualizado = MaestroProductoService.update_producto(producto_id, data)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@maestro_productos_bp.route('/<int:producto_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_producto(producto_id):
    try:
        payload = request.get_json(silent=True) or {}
        razon_bloqueo = payload.get('razon_bloqueo')
        actualizado = MaestroProductoService.deactivate_producto(producto_id, razon_bloqueo)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@maestro_productos_bp.route('/<int:producto_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_producto(producto_id):
    try:
        actualizado = MaestroProductoService.activate_producto(producto_id)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status