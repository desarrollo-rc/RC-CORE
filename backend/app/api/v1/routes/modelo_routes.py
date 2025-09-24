# backend/app/api/v1/routes/modelo_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.modelo_schemas import ModeloSchema, UpdateModeloSchema
from app.api.v1.services.modelo_service import ModeloService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.api.v1.utils.errors import BusinessRuleError
from .version_routes import versiones_bp 

modelos_bp = Blueprint('modelos_bp', __name__, url_prefix='/<int:marca_id>/modelos')
modelos_bp.register_blueprint(versiones_bp)

schema_create = ModeloSchema(only=("nombre_modelo", "codigo_modelo"))
schema_update = UpdateModeloSchema()
schema_response = ModeloSchema()
schema_many_response = ModeloSchema(many=True)

@modelos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_modelos(marca_id):
    modelos = ModeloService.get_modelos_by_marca(marca_id)
    return schema_many_response.dump(modelos), 200

@modelos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_modelo(marca_id):
    try:
        data = schema_create.load(request.get_json())
        modelo = ModeloService.create_modelo(marca_id, data)
        return schema_response.dump(modelo), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@modelos_bp.route('/<int:modelo_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_modelo(marca_id, modelo_id):
    try:
        data = schema_update.load(request.get_json())
        modelo = ModeloService.update_modelo(marca_id, modelo_id, data)
        return schema_response.dump(modelo), 200
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@modelos_bp.route('/<int:modelo_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_modelo(marca_id, modelo_id):
    modelo = ModeloService.deactivate_modelo(marca_id, modelo_id)
    return schema_response.dump(modelo), 200

@modelos_bp.route('/<int:modelo_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_modelo(marca_id, modelo_id):
    modelo = ModeloService.activate_modelo(marca_id, modelo_id)
    return schema_response.dump(modelo), 200