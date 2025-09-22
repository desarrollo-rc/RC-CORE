# backend/app/api/v1/routes/fabrica_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.fabrica_schemas import FabricaSchema, UpdateFabricaSchema
from app.api.v1.services.fabrica_service import FabricaService
from app.api.v1.utils.errors import BusinessRuleError
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required

fabricas_bp = Blueprint('fabricas_bp', __name__)

schema_single = FabricaSchema()
schema_many = FabricaSchema(many=True)
schema_update = UpdateFabricaSchema()

@fabricas_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_fabrica():
    try:
        data = schema_single.load(request.get_json())
        nuevo = FabricaService.create(data)
        return schema_single.dump(nuevo), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 409

@fabricas_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_fabricas():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    records = FabricaService.get_all(include_inactive)
    return schema_many.dump(records), 200

@fabricas_bp.route('/<int:fabrica_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_fabrica(fabrica_id):
    record = FabricaService.get_by_id(fabrica_id)
    return schema_single.dump(record), 200

@fabricas_bp.route('/<int:fabrica_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_fabrica(fabrica_id):
    data = schema_update.load(request.get_json())
    record = FabricaService.update(fabrica_id, data)
    return schema_single.dump(record), 200

@fabricas_bp.route('/<int:fabrica_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_fabrica(fabrica_id):
    record = FabricaService.deactivate(fabrica_id)
    return schema_single.dump(record), 200

@fabricas_bp.route('/<int:fabrica_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_fabrica(fabrica_id):
    record = FabricaService.activate(fabrica_id)
    return schema_single.dump(record), 200