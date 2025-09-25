# backend/app/api/v1/routes/codigo_tecnico_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.codigo_tecnico_schemas import CodigoTecnicoSchema, UpdateCodigoTecnicoSchema
from app.api.v1.services.codigo_referencia_service import CodigoReferenciaService
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from app.api.v1.utils.errors import BusinessRuleError

# El prefijo de la URL incluye el ID del padre, que se pasará a las funciones
codigos_tecnicos_bp = Blueprint('codigos_tecnicos_bp', __name__, url_prefix='/<int:ref_id>/codigos-tecnicos')

schema_single = CodigoTecnicoSchema()
schema_many = CodigoTecnicoSchema(many=True)
schema_update = UpdateCodigoTecnicoSchema()

@codigos_tecnicos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('productos:listar')
def get_codigos_tecnicos(ref_id):
    codigos_tecnicos = CodigoReferenciaService.get_codigos_tecnicos(ref_id)
    return jsonify(schema_many.dump(codigos_tecnicos)), 200


@codigos_tecnicos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('productos:crear')
def create_codigo_tecnico(ref_id):
    try:
        data = schema_single.load(request.get_json())
        data['id_codigo_referencia'] = ref_id
        nuevo = CodigoReferenciaService.create_codigo_tecnico(data)
        return schema_single.dump(nuevo), 201
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@codigos_tecnicos_bp.route('/<int:tec_id>', methods=['PUT'])
@jwt_required()
@permission_required('productos:editar')
def update_codigo_tecnico(ref_id, tec_id):
    try:
        data = schema_update.load(request.get_json())
        actualizado = CodigoReferenciaService.update_codigo_tecnico(tec_id, data)
        return schema_single.dump(actualizado), 200
    except (ValidationError, BusinessRuleError) as e:
        status = 422 if isinstance(e, ValidationError) else 409
        msg = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": msg}), status

@codigos_tecnicos_bp.route('/<int:tec_id>', methods=['DELETE'])
@jwt_required()
@permission_required('productos:eliminar')
def delete_codigo_tecnico(ref_id, tec_id):
    try:
        CodigoReferenciaService.delete_codigo_tecnico(tec_id)
        return '', 204
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@codigos_tecnicos_bp.route('/<int:tec_id>/asociar-producto', methods=['POST'])
@jwt_required()
@permission_required('productos:editar')
def asociar_producto(ref_id, tec_id):
    try:
        data = request.get_json()
        if not data or 'id_producto' not in data:
            return jsonify({"error": "Falta el campo 'id_producto'."}), 400
            
        producto_id = data['id_producto']
        actualizado = CodigoReferenciaService.asociar_producto_a_codigo_tecnico(tec_id, producto_id)
        return schema_single.dump(actualizado), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code