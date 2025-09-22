# backend/app/api/v1/routes/categoria_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.categoria_schemas import CategoriaSchema, UpdateCategoriaSchema
from app.api.v1.services.categoria_service import CategoriaService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

categorias_bp = Blueprint('categorias_bp', __name__)

schema_single = CategoriaSchema()
schema_many = CategoriaSchema(many=True)
schema_update = UpdateCategoriaSchema()


@categorias_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_categoria():
    try:
        data = schema_single.load(request.get_json())
        nueva_categoria = CategoriaService.create_categoria(data)
        return jsonify(schema_single.dump(nueva_categoria)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@categorias_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_all_categorias():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    categorias = CategoriaService.get_all_categorias(include_inactive)
    return jsonify(schema_many.dump(categorias)), 200

@categorias_bp.route('/por-division/<int:division_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_categorias_por_division(division_id):
    try:
        categorias = CategoriaService.get_categorias_by_division_id(division_id)
        return jsonify(schema_many.dump(categorias)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404

@categorias_bp.route('/<int:categoria_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_categoria(categoria_id):
    categoria = CategoriaService.get_categoria_by_id(categoria_id)
    return jsonify(schema_single.dump(categoria)), 200

@categorias_bp.route('/<int:categoria_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_categoria(categoria_id):
    try:
        data = schema_update.load(request.get_json())
        categoria_actualizada = CategoriaService.update_categoria(categoria_id, data)
        return jsonify(schema_single.dump(categoria_actualizada)), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@categorias_bp.route('/<int:categoria_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_categoria(categoria_id):
    try:
        categoria = CategoriaService.deactivate_categoria(categoria_id)
        return jsonify(schema_single.dump(categoria)), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@categorias_bp.route('/<int:categoria_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_categoria(categoria_id):
    try:
        categoria = CategoriaService.activate_categoria(categoria_id)
        return jsonify(schema_single.dump(categoria)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404