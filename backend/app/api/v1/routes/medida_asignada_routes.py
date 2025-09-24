# backend/app/api/v1/routes/medida_asignada_routes.py

from flask import Blueprint, request, jsonify
from app.api.v1.schemas.medida_schemas import MedidaAsignadaSchema, UpdateMedidaAsignadaSchema
from app.api.v1.services.medida_asignada_service import MedidaAsignadaService
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required

medidas_asignadas_bp = Blueprint('medidas_asignadas_bp', __name__, url_prefix='/<int:ref_id>/medidas')

schema_single = MedidaAsignadaSchema()
schema_many = MedidaAsignadaSchema(many=True)
schema_update = UpdateMedidaAsignadaSchema()

@medidas_asignadas_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:editar')
def add_medida(ref_id):
    try:
        data = schema_single.load(request.get_json())
        asignacion = MedidaAsignadaService.add_medida_a_codigo_referencia(ref_id, data)
        return schema_single.dump(asignacion), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 409

@medidas_asignadas_bp.route('/<int:medida_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_medida(ref_id, medida_id):
    try:
        data = schema_update.load(request.get_json())
        asignacion = MedidaAsignadaService.update_medida_asignada(ref_id, medida_id, data)
        return schema_single.dump(asignacion), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 409

@medidas_asignadas_bp.route('/<int:medida_id>', methods=['DELETE'])
@jwt_required()
@permission_required('productos:editar')
def remove_medida(ref_id, medida_id):
    try:
        MedidaAsignadaService.remove_medida_from_codigo_referencia(ref_id, medida_id)
        return '', 204
    except Exception as e:
        return jsonify({"error": str(e)}), 409