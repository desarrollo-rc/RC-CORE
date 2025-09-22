from flask import Blueprint, request, jsonify
from app.api.v1.schemas.det_sub_categoria_schemas import DetSubCategoriaSchema, UpdateDetSubCategoriaSchema
from app.api.v1.services.det_sub_categoria_service import DetSubCategoriaService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from werkzeug.exceptions import NotFound

det_sub_categorias_bp = Blueprint('det_sub_categorias_bp', __name__)

schema_single = DetSubCategoriaSchema()
schema_many = DetSubCategoriaSchema(many=True)
schema_update = UpdateDetSubCategoriaSchema()

@det_sub_categorias_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_det_sub_categoria():
    try:
        data = schema_single.load(request.get_json())
        nuevo = DetSubCategoriaService.create_det_sub_categoria(data)
        return jsonify(schema_single.dump(nuevo)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@det_sub_categorias_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_all_det_sub_categorias():
    detalles = DetSubCategoriaService.get_all() 
    return jsonify(schema_many.dump(detalles)), 200

@det_sub_categorias_bp.route('/por-subcategoria/<int:sub_categoria_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_detalles_por_subcategoria(sub_categoria_id):
    try:
        detalles = DetSubCategoriaService.get_by_sub_categoria_id(sub_categoria_id)
        return jsonify(schema_many.dump(detalles)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404

@det_sub_categorias_bp.route('/<int:det_sub_categoria_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_det_sub_categoria(det_sub_categoria_id):
    try:
        data = schema_update.load(request.get_json())
        actualizado = DetSubCategoriaService.update_det_sub_categoria(det_sub_categoria_id, data)
        return jsonify(schema_single.dump(actualizado)), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@det_sub_categorias_bp.route('/<int:det_sub_categoria_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_det_sub_categoria(det_sub_categoria_id):
    try:
        desactivado = DetSubCategoriaService.deactivate_det_sub_categoria(det_sub_categoria_id)
        return jsonify(schema_single.dump(desactivado)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404

@det_sub_categorias_bp.route('/<int:det_sub_categoria_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_det_sub_categoria(det_sub_categoria_id):
    try:
        activado = DetSubCategoriaService.activate_det_sub_categoria(det_sub_categoria_id)
        return jsonify(schema_single.dump(activado)), 200
    except NotFound as e:
        return jsonify({"error": str(e)}), 404