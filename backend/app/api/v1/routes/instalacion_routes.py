# backend/app/api/v1/routes/instalacion_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.services.instalacion_service import InstalacionService
from app.api.v1.schemas.instalacion_schemas import instalacion_schema, instalaciones_schema, create_instalacion_schema, update_instalacion_schema
from app.api.v1.utils.decorators import jwt_required, permission_required
from marshmallow import ValidationError

instalaciones_bp = Blueprint('instalaciones_bp', __name__)

@instalaciones_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_instalaciones():
    instalaciones = InstalacionService.get_all_instalaciones()
    return jsonify(instalaciones_schema.dump(instalaciones)), 200

@instalaciones_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_instalacion(id):
    instalacion = InstalacionService.get_instalacion_by_id(id)
    return jsonify(instalacion_schema.dump(instalacion)), 200

@instalaciones_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:crear')
def create_instalacion():
    try:
        data = create_instalacion_schema.load(request.json)
        nueva_instalacion = InstalacionService.create_instalacion(data)
        return jsonify(instalacion_schema.dump(nueva_instalacion)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400

@instalaciones_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def update_instalacion(id):
    try:
        data = update_instalacion_schema.load(request.json)
        instalacion_actualizada = InstalacionService.update_instalacion(id, data)
        return jsonify(instalacion_schema.dump(instalacion_actualizada)), 200
    except ValidationError as err:
        return jsonify(err.messages), 400