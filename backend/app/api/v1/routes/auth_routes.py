# backend/app/api/v1/routes/auth_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.auth_schemas import LoginSchema
from app.api.v1.services.auth_service import AuthService
from marshmallow import ValidationError

# Creamos un Blueprint para agrupar las rutas de autenticación
auth_bp = Blueprint('auth_bp', __name__)
login_schema = LoginSchema()

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para el login de usuarios internos.
    Recibe email y password, devuelve un token JWT si son válidos.
    """
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "No se recibió ningún dato"}), 400

    # 1. Validar los datos de entrada con el schema
    try:
        data = login_schema.load(json_data)
    except ValidationError as err:
        return jsonify(err.messages), 422 # 422 Unprocessable Entity

    # 2. Llamar al servicio que contiene la lógica
    result, status_code = AuthService.login(data)
    
    # 3. Devolver la respuesta
    return jsonify(result), status_code