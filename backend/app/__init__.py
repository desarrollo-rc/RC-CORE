# app/__init__.py
from flask import Flask, jsonify
from config import Config
from app.extensions import db, migrate
from flask_jwt_extended import JWTManager

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Inicialización Extensiones
    db.init_app(app)
    migrate.init_app(app, db)

    # Inicialización JWT
    jwt = JWTManager(app)

    # Modelos
    with app.app_context():
        from . import models
        from . import events

    # Blueprints
    from .api.v1.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')

    from .api.v1.routes.cliente_routes import clientes_bp
    app.register_blueprint(clientes_bp, url_prefix='/api/v1/clientes')

    from .api.v1.routes.tipo_cliente_routes import tipos_cliente_bp
    app.register_blueprint(tipos_cliente_bp, url_prefix='/api/v1/tipos-cliente')
    
    # --- RUTAS ---
    # Una ruta de prueba para verificar que todo funciona
    @app.route('/health')
    def health_check():
        return jsonify({"status": "ok"}), 200

    return app