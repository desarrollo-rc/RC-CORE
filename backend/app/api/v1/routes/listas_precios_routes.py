# backend/app/api/v1/routes/listas_precios_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.listas_precios_schemas import ListaPreciosSchema, UpdateListaPreciosSchema
from app.api.v1.services.listas_precios_service import ListaPreciosService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

listas_precios_bp = Blueprint('listas_precios_bp', __name__)

schema_single = ListaPreciosSchema()
schema_many = ListaPreciosSchema(many=True)
schema_update = UpdateListaPreciosSchema()

@listas_precios_bp.route('/', methods=['POST'])
@jwt_required()
def create_lista_precios():
    try:
        data = schema_single.load(request.get_json())
        nueva_lista = ListaPreciosService.create_lista_precios(data)
        return schema_single.dump(nueva_lista), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code
    except Exception:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@listas_precios_bp.route('/', methods=['GET'])
@jwt_required()
def get_listas_precios():
    listas = ListaPreciosService.get_all_listas_precios()
    return schema_many.dump(listas), 200

@listas_precios_bp.route('/<int:lista_id>', methods=['GET'])
@jwt_required()
def get_lista_precios(lista_id):
    try:
        lista = ListaPreciosService.get_lista_precios_by_id(lista_id)
        return schema_single.dump(lista), 200
    except NotFound:
        return jsonify({"error": f"Lista de precios con ID {lista_id} no encontrada."}), 404

@listas_precios_bp.route('/<int:lista_id>', methods=['PUT'])
@jwt_required()
def update_lista_precios(lista_id):
    try:
        data = schema_update.load(request.get_json())
        lista_actualizada = ListaPreciosService.update_lista_precios(lista_id, data)
        return schema_single.dump(lista_actualizada), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except (BusinessRuleError, NotFound) as e:
        return jsonify({"error": str(e)}), 409 if isinstance(e, BusinessRuleError) else 404

@listas_precios_bp.route('/<int:lista_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_lista_precios(lista_id):
    try:
        lista = ListaPreciosService.deactivate_lista_precios(lista_id)
        return schema_single.dump(lista), 200
    except NotFound:
        return jsonify({"error": f"Lista de precios con ID {lista_id} no encontrada."}), 404

@listas_precios_bp.route('/<int:lista_id>/activate', methods=['PUT'])
@jwt_required()
def activate_lista_precios(lista_id):
    try:
        lista = ListaPreciosService.activate_lista_precios(lista_id)
        return schema_single.dump(lista), 200
    except NotFound:
        return jsonify({"error": f"Lista de precios con ID {lista_id} no encontrada."}), 404