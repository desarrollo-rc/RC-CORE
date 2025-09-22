from flask import Blueprint, request, jsonify
from app.api.v1.schemas.sub_categoria_schemas import SubCategoriaSchema, UpdateSubCategoriaSchema
from app.api.v1.services.sub_categoria_service import SubCategoriaService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from werkzeug.exceptions import NotFound

sub_categorias_bp = Blueprint('sub_categorias_bp', __name__)

schema_single = SubCategoriaSchema()
schema_many = SubCategoriaSchema(many=True)
schema_update = UpdateSubCategoriaSchema()

@sub_categorias_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_sub_categoria():
    try:
        data = schema_single.load(request.get_json())
        nueva = SubCategoriaService.create_sub_categoria(data)
        return jsonify(schema_single.dump(nueva)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@sub_categorias_bp.route('/por-categoria/<int:categoria_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_sub_categorias_por_categoria(categoria_id):
    try:
        sub_categorias = SubCategoriaService.get_sub_categorias_by_categoria_id(categoria_id)
        return jsonify(schema_many.dump(sub_categorias)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404

@sub_categorias_bp.route('/<int:sub_categoria_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_sub_categoria(sub_categoria_id):
    try:
        data = schema_update.load(request.get_json())
        actualizada = SubCategoriaService.update_sub_categoria(sub_categoria_id, data)
        return jsonify(schema_single.dump(actualizada)), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@sub_categorias_bp.route('/<int:sub_categoria_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_sub_categoria(sub_categoria_id):
    try:
        desactivada = SubCategoriaService.deactivate_sub_categoria(sub_categoria_id)
        return jsonify(schema_single.dump(desactivada)), 200
    except (BusinessRuleError, NotFound) as e:
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@sub_categorias_bp.route('/<int:sub_categoria_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_sub_categoria(sub_categoria_id):
    try:
        activada = SubCategoriaService.activate_sub_categoria(sub_categoria_id)
        return jsonify(schema_single.dump(activada)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404