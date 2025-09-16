# backend/app/api/v1/routes/valor_atributo_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.valor_atributo_schemas import ValorAtributoSchema, UpdateValorAtributoSchema
from app.api.v1.services.valor_atributo_service import ValorAtributoService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

valores_atributo_bp = Blueprint('valores_atributo_bp', __name__, url_prefix='/<int:atributo_id>/valores')

schema_single = ValorAtributoSchema()
schema_many = ValorAtributoSchema(many=True)
schema_update = UpdateValorAtributoSchema()

@valores_atributo_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_valor(atributo_id):
    try:
        data = schema_single.load(request.get_json())
        nuevo_valor = ValorAtributoService.create_valor(atributo_id, data)
        return schema_single.dump(nuevo_valor), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@valores_atributo_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_valores(atributo_id):
    valores = ValorAtributoService.get_valores_by_atributo_id(atributo_id)
    return schema_many.dump(valores), 200

@valores_atributo_bp.route('/<int:valor_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_valor(atributo_id, valor_id):
    try:
        data = schema_update.load(request.get_json())
        valor_actualizado = ValorAtributoService.update_valor(valor_id, data)
        return schema_single.dump(valor_actualizado), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@valores_atributo_bp.route('/<int:valor_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_valor(atributo_id, valor_id):
    try:
        valor_actualizado = ValorAtributoService.activate_valor(valor_id)
        return schema_single.dump(valor_actualizado), 200
    except NotFound:
        return jsonify({"error": f"Valor con ID {valor_id} no encontrado."}), 404
        
@valores_atributo_bp.route('/<int:valor_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_valor(atributo_id, valor_id):
    try:
        valor_actualizado = ValorAtributoService.deactivate_valor(valor_id)
        return schema_single.dump(valor_actualizado), 200
    except NotFound:
        return jsonify({"error": f"Valor con ID {valor_id} no encontrado."}), 404

@valores_atributo_bp.route('/<int:valor_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_valor(atributo_id, valor_id):
    valor = ValorAtributoService.get_valor_by_id(valor_id)
    return schema_single.dump(valor), 200

@valores_atributo_bp.route('/<string:codigo>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_valor_by_codigo(atributo_id, codigo):
    valor = ValorAtributoService.get_valor_by_codigo(codigo)
    return schema_single.dump(valor), 200