# backend/app/api/v1/routes/atributo_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.atributo_schemas import AtributoSchema, UpdateAtributoSchema
from app.api.v1.services.atributo_service import AtributoService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

atributos_bp = Blueprint('atributos_bp', __name__)

schema_single = AtributoSchema()
schema_many = AtributoSchema(many=True)
schema_update = UpdateAtributoSchema()

@atributos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_atributo():
    try:
        data = schema_single.load(request.get_json())
        nuevo_atributo = AtributoService.create_atributo(data)
        return schema_single.dump(nuevo_atributo), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@atributos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_atributos():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    atributos = AtributoService.get_all_atributos(include_inactive)
    return schema_many.dump(atributos), 200

@atributos_bp.route('/<int:atributo_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_atributo(atributo_id):
    try:
        atributo = AtributoService.get_atributo_by_id(atributo_id)
        return schema_single.dump(atributo), 200
    except NotFound:
        return jsonify({"error": f"Atributo con ID {atributo_id} no encontrado."}), 404

@atributos_bp.route('/<int:atributo_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_atributo(atributo_id):
    try:
        data = schema_update.load(request.get_json())
        atributo_actualizado = AtributoService.update_atributo(atributo_id, data)
        return schema_single.dump(atributo_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), code

@atributos_bp.route('/<int:atributo_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_atributo(atributo_id):
    try:
        atributo = AtributoService.activate_atributo(atributo_id)
        return schema_single.dump(atributo), 200
    except NotFound:
        return jsonify({"error": f"Atributo con ID {atributo_id} no encontrado."}), 404

@atributos_bp.route('/<int:atributo_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_atributo(atributo_id):
    try:
        atributo = AtributoService.deactivate_atributo(atributo_id)
        return schema_single.dump(atributo), 200
    except NotFound:
        return jsonify({"error": f"Atributo con ID {atributo_id} no encontrado."}), 404
