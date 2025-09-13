# backend/app/api/v1/routes/areas_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.area_schemas import AreaSchema, UpdateAreaSchema
from app.api.v1.services.area_service import AreaService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

areas_bp = Blueprint('areas_bp', __name__)

schema_single = AreaSchema()
schema_many = AreaSchema(many=True)
schema_update = UpdateAreaSchema()

@areas_bp.route('/', methods=['POST'])
@jwt_required()
def create_area():
    try:
        data = schema_single.load(request.get_json())
        nueva_area = AreaService.create_area(data)
        return schema_single.dump(nueva_area), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@areas_bp.route('/', methods=['GET'])
@jwt_required()
def get_areas():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    areas = AreaService.get_all_areas(include_inactive=include_inactive)
    return schema_many.dump(areas), 200

@areas_bp.route('/<int:area_id>', methods=['GET'])
@jwt_required()
def get_area_by_id(area_id):
    try:
        area = AreaService.get_area_by_id(area_id)
        return schema_single.dump(area), 200
    except NotFound:
        return jsonify({"error": f"Área con ID {area_id} no encontrada."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@areas_bp.route('/<int:area_id>', methods=['PUT'])
@jwt_required()
def update_area(area_id):
    try:
        data = schema_update.load(request.get_json())
        area_actualizada = AreaService.update_area(area_id, data)
        return schema_single.dump(area_actualizada), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@areas_bp.route('/<int:area_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_area(area_id):
    try:
        area = AreaService.deactivate_area(area_id)
        return schema_single.dump(area), 200
    except NotFound:
        return jsonify({"error": f"Área con ID {area_id} no encontrada."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@areas_bp.route('/<int:area_id>/activate', methods=['PUT'])
@jwt_required()
def activate_area(area_id):
    try:
        area = AreaService.activate_area(area_id)
        return schema_single.dump(area), 200
    except NotFound:
        return jsonify({"error": f"Área con ID {area_id} no encontrada."}), 404
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500