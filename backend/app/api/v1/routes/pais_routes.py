# backend/app/api/v1/routes/pais_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.pais_schemas import PaisSchema, UpdatePaisSchema
from app.api.v1.services.pais_service import PaisService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.decorators import permission_required
from werkzeug.exceptions import NotFound

paises_bp = Blueprint('paises_bp', __name__)

schema_single = PaisSchema()
schema_many = PaisSchema(many=True)
schema_update = UpdatePaisSchema()

@paises_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('admin:crear')
def create_pais():
    try:
        data = schema_single.load(request.get_json())
        nuevo_pais = PaisService.create_pais(data)
        return schema_single.dump(nuevo_pais), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@paises_bp.route('/', methods=['GET'])
@jwt_required()
def get_paises():
    records = PaisService.get_all_paises()
    return schema_many.dump(records), 200

@paises_bp.route('/<int:pais_id>', methods=['GET'])
@jwt_required()
def get_pais(pais_id):
    record = PaisService.get_pais_by_id(pais_id)
    return schema_single.dump(record), 200

@paises_bp.route('/<int:pais_id>', methods=['PUT'])
@jwt_required()
@permission_required('admin:editar')
def update_pais(pais_id):
    # --- LÍNEA DE DEPURACIÓN 1 ---
    print(f"--- INTENTANDO ACTUALIZAR PAÍS ID: {pais_id} ---")
    payload_recibido = request.get_json()
    print(f"PAYLOAD RECIBIDO: {payload_recibido}")
    # -----------------------------
    
    try:
        data = schema_update.load(payload_recibido)
        record = PaisService.update_pais(pais_id, data)
        return schema_single.dump(record), 200
    except ValidationError as e:
        # --- LÍNEA DE DEPURACIÓN 2 ---
        print(f"!!! ERROR DE VALIDACIÓN DE MARSHMALLOW: {e.messages}")
        # -----------------------------
        return jsonify({"error": e.messages}), 422
    except (BusinessRuleError, NotFound) as e:
        # --- LÍNEA DE DEPURACIÓN 3 ---
        print(f"!!! ERROR DE NEGOCIO O NO ENCONTRADO: {str(e)}")
        # -----------------------------
        status = 409 if isinstance(e, BusinessRuleError) else 404
        return jsonify({"error": str(e)}), status

@paises_bp.route('/<int:pais_id>', methods=['DELETE'])
@jwt_required()
@permission_required('admin:eliminar')
def delete_pais(pais_id):
    try:
        PaisService.delete_pais(pais_id)
        return '', 204
    except BusinessRuleError as e:
         return jsonify({"error": str(e)}), e.status_code