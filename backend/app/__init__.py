# app/__init__.py
from flask import Flask, jsonify
from sqlalchemy import text
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

    from .api.v1.routes.segmentos_cliente_routes import segmentos_cliente_bp
    app.register_blueprint(segmentos_cliente_bp, url_prefix='/api/v1/segmentos-cliente')

    from .api.v1.routes.listas_precios_routes import listas_precios_bp
    app.register_blueprint(listas_precios_bp, url_prefix='/api/v1/listas-precios')
    
    from .api.v1.routes.condiciones_pago_routes import condiciones_pago_bp
    app.register_blueprint(condiciones_pago_bp, url_prefix='/api/v1/condiciones-pago')

    from .api.v1.routes.roles_routes import roles_bp
    app.register_blueprint(roles_bp, url_prefix='/api/v1/roles')

    from .api.v1.routes.permisos_routes import permisos_bp
    app.register_blueprint(permisos_bp, url_prefix='/api/v1/permisos')

    from .api.v1.routes.areas_routes import areas_bp
    app.register_blueprint(areas_bp, url_prefix='/api/v1/areas')

    from .api.v1.routes.usuarios_routes import usuarios_bp
    app.register_blueprint(usuarios_bp, url_prefix='/api/v1/usuarios')
    
    from .api.v1.routes.vendedor_routes import vendedores_bp
    app.register_blueprint(vendedores_bp, url_prefix='/api/v1/vendedores')
    
    from .api.v1.routes.empresa_routes import empresas_bp
    app.register_blueprint(empresas_bp, url_prefix='/api/v1/empresas')

    from .api.v1.routes.contacto_routes import contactos_bp
    app.register_blueprint(contactos_bp, url_prefix='/api/v1/contactos')

    from .api.v1.routes.direccion_routes import direcciones_bp
    app.register_blueprint(direcciones_bp, url_prefix='/api/v1/direcciones')
    
    from .api.v1.routes.canal_venta_routes import canales_venta_bp
    app.register_blueprint(canales_venta_bp, url_prefix='/api/v1/canales-venta')
    
    # --- RUTAS ---
    # Una ruta de prueba para verificar que todo funciona
    @app.route('/database', methods=['GET'])
    def database_check():
        try:
            bd = db.session.execute(text("SELECT 1")).fetchone()
            if bd[0] == 1:
                return jsonify({"status": "ok", "message": "Conexión a la base de datos exitosa."}), 200
        except Exception as e:
            return jsonify({"status": "error", "message": f"Error en la conexión a la base de datos: {str(e)}"}), 500

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "ok", "message": "API is running", "version": "1.0.0"}), 200

    return app