# backend/app/api/v1/routes/codigo_referencia_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.codigo_referencia_schemas import CodigoReferenciaSchema, UpdateCodigoReferenciaSchema
from app.api.v1.services.codigo_referencia_service import CodigoReferenciaService
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.errors import BusinessRuleError
from .codigo_tecnico_routes import codigos_tecnicos_bp
from .medida_asignada_routes import medidas_asignadas_bp
from .atributo_asignado_routes import atributos_asignados_bp
from .aplicacion_routes import aplicaciones_bp

codigos_referencia_bp = Blueprint('codigos_referencia_bp', __name__)

# --- REGISTRO ANIDADO ---
# Todas las rutas de codigos_tecnicos_bp ahora estarán bajo /codigos-referencia/
codigos_referencia_bp.register_blueprint(codigos_tecnicos_bp)
codigos_referencia_bp.register_blueprint(medidas_asignadas_bp)
codigos_referencia_bp.register_blueprint(atributos_asignados_bp)
codigos_referencia_bp.register_blueprint(aplicaciones_bp)
# ------------------------

schema_single = CodigoReferenciaSchema()
schema_many = CodigoReferenciaSchema(many=True)
schema_update = UpdateCodigoReferenciaSchema()

@codigos_referencia_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_codigo_referencia():
    try:
        data = schema_single.load(request.get_json())
        nuevo = CodigoReferenciaService.create_codigo_referencia(data)
        return schema_single.dump(nuevo), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@codigos_referencia_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_codigos_referencia():
    include_inactive = request.args.get('incluir_inactivos', 'false').lower() == 'true'
    records = CodigoReferenciaService.get_all_codigos_referencia(include_inactive)
    return schema_many.dump(records), 200

@codigos_referencia_bp.route('/<int:ref_id>', methods=['GET'])
@jwt_required()
@permission_required('productos:ver')
def get_codigo_referencia(ref_id):
    record = CodigoReferenciaService.get_codigo_referencia_by_id(ref_id)
    return schema_single.dump(record), 200

@codigos_referencia_bp.route('/<int:ref_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_codigo_referencia(ref_id):
    try:
        data = schema_update.load(request.get_json())
        record = CodigoReferenciaService.update_codigo_referencia(ref_id, data)
        return schema_single.dump(record), 200
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@codigos_referencia_bp.route('/<int:ref_id>/activate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def activate_codigo_referencia(ref_id):
    record = CodigoReferenciaService.activate_codigo_referencia(ref_id)
    return schema_single.dump(record), 200

@codigos_referencia_bp.route('/<int:ref_id>/deactivate', methods=['PUT'])
@jwt_required()
@permission_required('productos:cambiar-estado')
def deactivate_codigo_referencia(ref_id):
    record = CodigoReferenciaService.deactivate_codigo_referencia(ref_id)
    return schema_single.dump(record), 200