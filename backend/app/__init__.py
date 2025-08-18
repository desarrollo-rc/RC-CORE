# app/__init__.py
from flask import Flask, jsonify
from config import Config
from app.extensions import db, migrate

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Inicialización Extensiones
    db.init_app(app)
    migrate.init_app(app, db)

    # Modelos
    with app.app_context():
        from . import models

    # --- RUTAS ---
    # Una ruta de prueba para verificar que todo funciona
    @app.route('/health')
    def health_check():
        return jsonify({"status": "ok"}), 200

    # Aquí registrarás tus blueprints en el futuro
    # from .api.clientes_routes import clientes_bp
    # app.register_blueprint(clientes_bp, url_prefix='/api/clientes')

    return app