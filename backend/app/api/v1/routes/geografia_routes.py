# backend/app/api/v1/routes/geografia_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.api.v1.services.geografia_service import GeografiaService
from app.api.v1.schemas.geografia_schemas import RegionSchema, CiudadSchema, ComunaSchema, PaisSimpleSchema

geografia_bp = Blueprint('geografia_bp', __name__)

region_schema_many = RegionSchema(many=True)
ciudad_schema_many = CiudadSchema(many=True)
comuna_schema_many = ComunaSchema(many=True)
pais_schema_many = PaisSimpleSchema(many=True)

@geografia_bp.route('/paises', methods=['GET'])
@jwt_required()
def get_paises():
    paises = GeografiaService.get_paises()
    return pais_schema_many.dump(paises), 200

@geografia_bp.route('/regiones', methods=['GET'])
@jwt_required()
def get_regiones():
    pais_id = request.args.get('pais_id', type=int)
    if not pais_id:
        return jsonify({"error": "El parámetro 'pais_id' es requerido."}), 400
    regiones = GeografiaService.get_regiones_by_pais(pais_id)
    return region_schema_many.dump(regiones), 200

@geografia_bp.route('/ciudades', methods=['GET'])
@jwt_required()
def get_ciudades():
    region_id = request.args.get('region_id', type=int)
    if not region_id:
        return jsonify({"error": "El parámetro 'region_id' es requerido."}), 400
    ciudades = GeografiaService.get_ciudades_by_region(region_id)
    return ciudad_schema_many.dump(ciudades), 200

@geografia_bp.route('/comunas', methods=['GET'])
@jwt_required()
def get_comunas():
    ciudad_id = request.args.get('ciudad_id', type=int)
    if not ciudad_id:
        return jsonify({"error": "El parámetro 'ciudad_id' es requerido."}), 400
    comunas = GeografiaService.get_comunas_by_ciudad(ciudad_id)
    return comuna_schema_many.dump(comunas), 200