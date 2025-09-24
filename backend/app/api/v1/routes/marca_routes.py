# backend/app/api/v1/routes/marca_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.marcas_schemas import MarcaSchema, UpdateMarcaSchema
from app.api.v1.services.marca_service import MarcaService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound
from .modelo_routes import modelos_bp

marcas_bp = Blueprint('marcas_bp', __name__)
marcas_bp.register_blueprint(modelos_bp)

schema_single = MarcaSchema()
schema_many = MarcaSchema(many=True)
schema_update = UpdateMarcaSchema()

@marcas_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_marca():
    try:
        data = schema_single.load(request.get_json())
        nueva_marca = MarcaService.create_marca(data)
        return schema_single.dump(nueva_marca), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@marcas_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_marcas():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    ambito = request.args.get('ambito', None)
    marcas = MarcaService.get_all_marcas(include_inactive, ambito=ambito)
    return schema_many.dump(marcas), 200

@marcas_bp.route('/<int:marca_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_marca(marca_id):
    try:
        data = schema_update.load(request.get_json())
        marca_actualizada = MarcaService.update_marca(marca_id, data)
        return schema_single.dump(marca_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), code

@marcas_bp.route('/<int:marca_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_marca(marca_id):
    try:
        marca = MarcaService.deactivate_marca(marca_id)
        return schema_single.dump(marca), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@marcas_bp.route('/<int:marca_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_marca(marca_id):
    try:
        marca = MarcaService.activate_marca(marca_id)
        return schema_single.dump(marca), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404