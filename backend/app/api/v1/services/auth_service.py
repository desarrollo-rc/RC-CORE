# backend/app/api/v1/services/auth_service.py
from app.models.entidades.usuarios import Usuario
from flask_jwt_extended import create_access_token, create_refresh_token
from werkzeug.security import check_password_hash

class AuthService:
    @staticmethod
    def login(data):
        """
        Lógica de negocio para el login de un usuario.
        """
        email = data.get('email')
        password = data.get('password')

        # 1. Buscar al usuario por su email
        user = Usuario.query.filter_by(email=email).first()

        # 2. Validar que el usuario exista y la contraseña sea correcta
        if not user or not user.check_password(password):
            return {"error": "Credenciales inválidas"}, 401
        
        if not user.activo:
            return {"error": "El usuario se encuentra inactivo"}, 403

        # 3. Generar el token de acceso
        access_token = create_access_token(identity=str(user.id_usuario))
        refresh_token = create_refresh_token(identity=str(user.id_usuario))

        return {
            "message": f"Bienvenido {user.nombre_completo}",
            "access_token": access_token,
            "refresh_token": refresh_token
        }, 200