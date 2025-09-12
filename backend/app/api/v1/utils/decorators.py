# backend/app/api/v1/utils/decorators.py
from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models.entidades.usuarios import Usuario

def permission_required(permission):
    """
    Decorador personalizado para verificar si un usuario tiene un permiso específico.
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            identity = get_jwt_identity()
            try:
                user_id = int(identity)
            except (TypeError, ValueError):
                return jsonify({"error": "Token inválido."}), 401
            user = Usuario.query.get(user_id)
            
            if not user:
                return jsonify({"error": "Usuario no encontrado."}), 404
                
            if permission not in user.permisos:
                return jsonify({"error": "No tienes permiso para realizar esta acción."}), 403 # Forbidden
            
            return fn(*args, **kwargs)
        return wrapper
    return decorator