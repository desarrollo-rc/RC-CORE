# backend/app/api/v1/routes/tipo_caso_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.tipo_caso_schemas import tipo_caso_schema, tipos_caso_schema, create_tipo_caso_schema, update_tipo_caso_schema
from app.api.v1.services.tipo_caso_service import TipoCasoService
from app.api.v1.utils.errors import BusinessRuleError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError

tipos_caso_bp = Blueprint('tipos_caso_bp', __name__)

@tipos_caso_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:listar')
def get_tipos_caso():
    tipos_caso = TipoCasoService.get_all_tipos_caso()
    return jsonify(tipos_caso_schema.dump(tipos_caso)), 200

@tipos_caso_bp.route('/activos', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:listar')
def get_tipos_caso_activos():
    tipos_caso = TipoCasoService.get_all_tipos_caso_active()
    return jsonify(tipos_caso_schema.dump(tipos_caso)), 200

@tipos_caso_bp.route('/<int:tipo_caso_id>', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_tipo_caso(tipo_caso_id):
    tipo_caso = TipoCasoService.get_tipo_caso_by_id(tipo_caso_id)
    return jsonify(tipo_caso_schema.dump(tipo_caso)), 200

@tipos_caso_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:crear')
def create_tipo_caso():
    try:
        data = create_tipo_caso_schema.load(request.get_json())
        nuevo_tipo_caso = TipoCasoService.create_tipo_caso(data)
        return jsonify(tipo_caso_schema.dump(nuevo_tipo_caso)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@tipos_caso_bp.route('/<int:tipo_caso_id>', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def update_tipo_caso(tipo_caso_id):
    try:
        data = update_tipo_caso_schema.load(request.get_json())
        tipo_caso_actualizado = TipoCasoService.update_tipo_caso(tipo_caso_id, data)
        return jsonify(tipo_caso_schema.dump(tipo_caso_actualizado)), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@tipos_caso_bp.route('/<int:tipo_caso_id>/desactivar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:cambiar-estado')
def deactivate_tipo_caso(tipo_caso_id):
    try:
        tipo_caso = TipoCasoService.deactivate_tipo_caso(tipo_caso_id)
        return jsonify(tipo_caso_schema.dump(tipo_caso)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@tipos_caso_bp.route('/<int:tipo_caso_id>/activar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:cambiar-estado')
def activate_tipo_caso(tipo_caso_id):
    try:
        tipo_caso = TipoCasoService.activate_tipo_caso(tipo_caso_id)
        return jsonify(tipo_caso_schema.dump(tipo_caso)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

