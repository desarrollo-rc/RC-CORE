# backend/app/api/v1/routes/atributo_asignado_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.atributo_schemas import AtributoAsignadoSchema, UpdateAtributoAsignadoSchema
from app.api.v1.services.atributo_asignado_service import AtributoAsignadoService
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.errors import BusinessRuleError

# El prefijo de la URL incluye el ID del padre (código de referencia)
atributos_asignados_bp = Blueprint('atributos_asignados_bp', __name__, url_prefix='/<int:ref_id>/atributos')

schema_single = AtributoAsignadoSchema()
schema_update = UpdateAtributoAsignadoSchema()

@atributos_asignados_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:editar')
def add_atributo(ref_id):
    try:
        data = schema_single.load(request.get_json())
        asignacion = AtributoAsignadoService.add_atributo_a_codigo_referencia(ref_id, data)
        return schema_single.dump(asignacion), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@atributos_asignados_bp.route('/<int:atributo_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_atributo(ref_id, atributo_id):
    try:
        data = schema_update.load(request.get_json())
        asignacion = AtributoAsignadoService.update_atributo_asignado(ref_id, atributo_id, data)
        return schema_single.dump(asignacion), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@atributos_asignados_bp.route('/<int:atributo_id>', methods=['DELETE'])
@jwt_required()
@permission_required('productos:editar')
def remove_atributo(ref_id, atributo_id):
    try:
        AtributoAsignadoService.remove_atributo_from_codigo_referencia(ref_id, atributo_id)
        return '', 204
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code