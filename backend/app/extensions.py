# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from .api.v1.services.notificacion_service import NotificacionService
notificacion_service = NotificacionService()

# Crea las instancias de las extensiones sin asociarlas a una app todavía
db = SQLAlchemy()
migrate = Migrate()
ma = Marshmallow()
jwt = JWTManager()
cors = CORS()