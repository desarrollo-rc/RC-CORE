from flask import Blueprint, request, jsonify, Response
from flask_jwt_extended import jwt_required
from app.api.v1.schemas.consulta_schemas import ConsultaSchema
from app.api.v1.services.consulta_service import ConsultaService
from app.api.v1.utils.decorators import permission_required
from werkzeug.exceptions import NotFound


consultas_bp = Blueprint('consultas_bp', __name__)

schema_single = ConsultaSchema()
schema_many = ConsultaSchema(many=True)


@consultas_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('consultas:crear')
def create_consulta():
    data = schema_single.load(request.get_json())
    consulta = ConsultaService.create_consulta(data)
    return schema_single.dump(consulta), 201


@consultas_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('consultas:listar')
def list_consultas():
    categoria = request.args.get('categoria')
    activo = request.args.get('activo', 'true').lower()
    if activo not in ('true', 'false'):
        activo_bool = True
    else:
        activo_bool = activo == 'true'

    consultas = ConsultaService.list_consultas(categoria=categoria, activo=activo_bool)
    return schema_many.dump(consultas), 200


@consultas_bp.route('/<int:consulta_id>', methods=['GET'])
@jwt_required()
@permission_required('consultas:ver')
def get_consulta(consulta_id):
    try:
        consulta = ConsultaService.get_consulta_by_id(consulta_id)
        return schema_single.dump(consulta), 200
    except NotFound:
        return jsonify({"error": f"Consulta con ID {consulta_id} no encontrada."}), 404


@consultas_bp.route('/<int:consulta_id>/sql', methods=['GET'])
@jwt_required()
@permission_required('consultas:ver')
def get_consulta_sql(consulta_id):
    try:
        consulta = ConsultaService.get_consulta_by_id(consulta_id)
        return Response(consulta.query_sql, mimetype='text/plain')
    except NotFound:
        return jsonify({"error": f"Consulta con ID {consulta_id} no encontrada."}), 404

