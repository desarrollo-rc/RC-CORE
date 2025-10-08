# backend/app/api/v1/routes/caso_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.caso_schemas import caso_schema, create_caso_schema, update_caso_schema, casos_schema
from app.api.v1.services.caso_service import CasoService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

casos_bp = Blueprint('casos_bp', __name__)

@casos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:crear')
def create_caso():
    try:
        data = create_caso_schema.load(request.get_json())
        nuevo_caso = CasoService.create_caso(data)
        return jsonify(caso_schema.dump(nuevo_caso)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@casos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:listar')
def get_casos():
    casos = CasoService.get_all_casos()
    return jsonify(casos_schema.dump(casos)), 200

@casos_bp.route('/<int:caso_id>', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_caso(caso_id):
    caso = CasoService.get_caso_by_id(caso_id)
    return jsonify(caso_schema.dump(caso)), 200

@casos_bp.route('/<int:caso_id>', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def update_caso(caso_id):
    try:
        data = update_caso_schema.load(request.get_json())
        caso_actualizado = CasoService.update_caso(caso_id, data)
        return jsonify(caso_schema.dump(caso_actualizado)), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@casos_bp.route('/<int:caso_id>/desactivar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:cambio-estado')
def deactivate_caso(caso_id):
    try:
        caso = CasoService.deactivate_caso(caso_id)
        return jsonify(caso_schema.dump(caso)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@casos_bp.route('/<int:caso_id>/activar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:cambio-estado')
def activate_caso(caso_id):
    try:
        caso = CasoService.activate_caso(caso_id)
        return jsonify(caso_schema.dump(caso)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code