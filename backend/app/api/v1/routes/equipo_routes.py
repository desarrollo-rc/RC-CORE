# backend/app/api/v1/routes/equipo_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.equipo_schemas import equipo_schema, create_equipo_schema, update_equipo_schema, equipos_schema
from app.api.v1.services.equipo_service import EquipoService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.api.v1.utils.errors import BusinessRuleError

equipos_bp = Blueprint('equipos_bp', __name__)

@equipos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('equipos:crear')
def create_equipo():
    try:
        data = create_equipo_schema.load(request.get_json())
        nuevo_equipo = EquipoService.create_equipo(data)
        return jsonify(equipo_schema.dump(nuevo_equipo)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('equipos:listar')
def get_equipos():
    equipos = EquipoService.get_all_equipos()
    return jsonify(equipos_schema.dump(equipos)), 200

@equipos_bp.route('/<int:equipo_id>', methods=['GET'])
@jwt_required()
@permission_required('equipos:ver')
def get_equipo(equipo_id):
    equipo = EquipoService.get_equipo_by_id(equipo_id)
    return jsonify(equipo_schema.dump(equipo)), 200

@equipos_bp.route('/<int:equipo_id>', methods=['PUT'])
@jwt_required()
@permission_required('equipos:editar')
def update_equipo(equipo_id):
    try:
        data = update_equipo_schema.load(request.get_json())
        equipo_actualizado = EquipoService.update_equipo(equipo_id, data)
        return jsonify(equipo_schema.dump(equipo_actualizado)), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/<int:equipo_id>/desactivar', methods=['PUT'])
@jwt_required()
@permission_required('equipos:cambiar-estado')
def deactivate_equipo(equipo_id):
    try:
        equipo = EquipoService.deactivate_equipo(equipo_id)
        return jsonify(equipo_schema.dump(equipo)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/<int:equipo_id>/activar', methods=['PUT'])
@jwt_required()
@permission_required('equipos:cambiar-estado')
def activate_equipo(equipo_id):
    try:
        equipo = EquipoService.activate_equipo(equipo_id)
        return jsonify(equipo_schema.dump(equipo)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/<int:usuario_b2b_id>', methods=['GET'])
@jwt_required()
@permission_required('equipos:ver')
def get_equipo_by_usuario_b2b_id(usuario_b2b_id):
    equipo = EquipoService.get_equipo_by_usuario_b2b_id(usuario_b2b_id)
    return jsonify(equipos_schema.dump(equipo)), 200