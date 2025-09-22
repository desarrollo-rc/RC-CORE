# app/__init__.py
from flask import Flask, jsonify
from sqlalchemy import text
from config import Config
from app.extensions import db, migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    app.url_map.strict_slashes = False
    
    CORS(app)

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
    
    from .api.v1.routes.consultas_routes import consultas_bp
    app.register_blueprint(consultas_bp, url_prefix='/api/v1/consultas')

    from .api.v1.routes.pedidos_routes import pedidos_bp
    app.register_blueprint(pedidos_bp, url_prefix='/api/v1/pedidos')

    from .api.v1.routes.division_routes import divisiones_bp
    app.register_blueprint(divisiones_bp, url_prefix='/api/v1/divisiones')

    from .api.v1.routes.categoria_routes import categorias_bp
    app.register_blueprint(categorias_bp, url_prefix='/api/v1/categorias')

    from .api.v1.routes.sub_categoria_routes import sub_categorias_bp
    app.register_blueprint(sub_categorias_bp, url_prefix='/api/v1/sub-categorias')

    from .api.v1.routes.det_sub_categoria_routes import det_sub_categorias_bp
    app.register_blueprint(det_sub_categorias_bp, url_prefix='/api/v1/det-sub-categorias')

    from .api.v1.routes.atributo_routes import atributos_bp
    app.register_blueprint(atributos_bp, url_prefix='/api/v1/atributos')

    from .api.v1.routes.medida_routes import medidas_bp
    app.register_blueprint(medidas_bp, url_prefix='/api/v1/medidas')

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