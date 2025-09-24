# backend/app/api/v1/routes/aplicacion_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.codigo_referencia_schemas import AplicacionSchema
from app.api.v1.services.aplicacion_service import AplicacionService
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.errors import BusinessRuleError

aplicaciones_bp = Blueprint('aplicaciones_bp', __name__, url_prefix='/<int:ref_id>/aplicaciones')

schema_single = AplicacionSchema()
schema_many = AplicacionSchema(many=True)

@aplicaciones_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_aplicaciones(ref_id):
    aplicaciones = AplicacionService.get_aplicaciones_by_codigo_referencia(ref_id)
    return schema_many.dump(aplicaciones), 200

@aplicaciones_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def add_aplicacion_route(ref_id):
    try:
        data = schema_single.load(request.get_json())
        asignacion = AplicacionService.add_aplicacion(ref_id, data)
        return schema_single.dump(asignacion), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@aplicaciones_bp.route('/<int:version_id>', methods=['DELETE'])
@jwt_required()
@permission_required('productos:editar')
def remove_aplicacion_route(ref_id, version_id):
    try:
        AplicacionService.remove_aplicacion(ref_id, version_id)
        return '', 204
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code