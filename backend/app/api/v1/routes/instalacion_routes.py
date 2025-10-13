# backend/app/api/v1/routes/instalacion_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.services.instalacion_service import InstalacionService
from app.api.v1.schemas.instalacion_schemas import instalacion_schema, instalaciones_schema, create_instalacion_schema, update_instalacion_schema
from flask_jwt_extended import jwt_required
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError

instalaciones_bp = Blueprint('instalaciones_bp', __name__)

@instalaciones_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_instalaciones():
    instalaciones = InstalacionService.get_all_instalaciones()
    return jsonify(instalaciones_schema.dump(instalaciones)), 200

@instalaciones_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_instalacion(id):
    instalacion = InstalacionService.get_instalacion_by_id(id)
    return jsonify(instalacion_schema.dump(instalacion)), 200

@instalaciones_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:crear')
def create_instalacion():
    try:
        data = create_instalacion_schema.load(request.json)
        nueva_instalacion = InstalacionService.create_instalacion(data)
        return jsonify(instalacion_schema.dump(nueva_instalacion)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400

@instalaciones_bp.route('/completa', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:crear')
def create_instalacion_completa():
    """
    Crea una instalación completa con caso automático.
    Espera: id_cliente, id_usuario_b2b (opcional), es_cliente_nuevo, es_primer_usuario, es_cambio_equipo, observaciones
    """
    try:
        data = request.json
        nueva_instalacion = InstalacionService.create_instalacion_completa(data)
        return jsonify(instalacion_schema.dump(nueva_instalacion)), 201
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/completa-multiple', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:crear')
def create_instalacion_completa_multiple():
    """
    Crea instalaciones completas con caso automático.
    Para cliente nuevo con múltiples usuarios, crea una instalación por usuario.
    Retorna información completa sobre todas las instalaciones creadas.
    """
    try:
        data = request.json
        resultado = InstalacionService.create_instalacion_completa_multiple(data)
        
        # Serializar el resultado
        from app.api.v1.schemas.caso_schemas import caso_schema
        from app.api.v1.schemas.instalacion_schemas import instalaciones_schema
        
        return jsonify({
            'casos': caso_schema.dump(resultado['casos'], many=True),
            'instalaciones': instalaciones_schema.dump(resultado['instalaciones']),
            'total_instalaciones': resultado['total_instalaciones']
        }), 201
    except ValidationError as err:
        return jsonify(err.messages), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def update_instalacion(id):
    try:
        data = update_instalacion_schema.load(request.json)
        instalacion_actualizada = InstalacionService.update_instalacion(id, data)
        return jsonify(instalacion_schema.dump(instalacion_actualizada)), 200
    except ValidationError as err:
        return jsonify(err.messages), 400

@instalaciones_bp.route('/<int:id>/aprobar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def aprobar_instalacion(id):
    """Aprueba una instalación pendiente"""
    try:
        data = request.json or {}
        fecha_aprobacion_personalizada = data.get('fecha_aprobacion_personalizada')
        instalacion = InstalacionService.aprobar_instalacion(id, fecha_aprobacion_personalizada)
        return jsonify(instalacion_schema.dump(instalacion)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/crear-usuario', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:editar')
def crear_usuario_instalacion(id):
    """Crea un nuevo usuario B2B para la instalación"""
    try:
        data = request.json
        instalacion = InstalacionService.crear_usuario_instalacion(id, data)
        return jsonify(instalacion_schema.dump(instalacion)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/agendar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def agendar_instalacion_route(id):
    """Agenda una fecha para la instalación (opcional)"""
    try:
        data = request.json or {}
        fecha_visita = data.get('fecha_visita')
        fecha_agendamiento_personalizada = data.get('fecha_agendamiento_personalizada')
        instalacion = InstalacionService.agendar_instalacion(id, fecha_visita, fecha_agendamiento_personalizada)
        return jsonify(instalacion_schema.dump(instalacion)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/sincronizar-equipos', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:editar')
def sincronizar_equipos(id):
    """Sincroniza los equipos del usuario desde Corp"""
    try:
        result = InstalacionService.sincronizar_equipos(id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/activar-equipo', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:editar')
def activar_equipo(id):
    """Activa un equipo y desactiva los demás"""
    try:
        data = request.json
        equipo_id = data.get('equipo_id')
        if not equipo_id:
            return jsonify({"error": "Se requiere equipo_id"}), 400
        
        result = InstalacionService.activar_equipo(id, equipo_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/instalar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def instalar_equipo(id):
    """Asocia el equipo activado a la instalación"""
    try:
        data = request.json
        equipo_id = data.get('equipo_id')
        if not equipo_id:
            return jsonify({"error": "Se requiere equipo_id"}), 400
        
        fecha_instalacion_personalizada = data.get('fecha_instalacion_personalizada')
        instalacion = InstalacionService.instalar_equipo(id, equipo_id, fecha_instalacion_personalizada)
        return jsonify(instalacion_schema.dump(instalacion)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/finalizar', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def finalizar_instalacion(id):
    """Finaliza la instalación"""
    try:
        data = request.json or {}
        capacitacion_realizada = data.get('capacitacion_realizada', True)
        fecha_finalizacion_personalizada = data.get('fecha_finalizacion_personalizada')
        
        instalacion = InstalacionService.finalizar_instalacion(id, capacitacion_realizada, fecha_finalizacion_personalizada)
        return jsonify(instalacion_schema.dump(instalacion)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/crear-equipo', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:editar')
def crear_equipo_instalacion(id):
    """Crea un equipo nuevo para el usuario de la instalación"""
    try:
        from app.api.v1.services.equipo_service import EquipoService
        from app.api.v1.schemas.equipo_schemas import equipo_schema, create_equipo_schema
        from app.models.soporte.instalaciones import EstadoInstalacion
        from datetime import datetime
        from app.extensions import db
        import pytz
        
        instalacion = InstalacionService.get_instalacion_by_id(id)
        
        if not instalacion.id_usuario_b2b:
            return jsonify({"error": "La instalación no tiene un usuario B2B asignado"}), 400
        
        data = request.json
        # Forzar el id_usuario_b2b de la instalación
        data['id_usuario_b2b'] = instalacion.id_usuario_b2b
        
        validated_data = create_equipo_schema.load(data)
        nuevo_equipo = EquipoService.create_equipo(validated_data)
        
        # Para instalaciones de cambio de equipo, actualizar automáticamente el estado
        es_cambio_equipo = (
            instalacion.caso.titulo and 
            ('cambio de equipo' in instalacion.caso.titulo.lower() or 
             'cambio de equipo' in instalacion.caso.titulo or
             'CAMBIO DE EQUIPO' in instalacion.caso.titulo)
        )
        
        if es_cambio_equipo and instalacion.estado == EstadoInstalacion.PENDIENTE_INSTALACION:
            # Actualizar estado a "Usuario Creado" (sin establecer fecha para cambio de equipo)
            instalacion.estado = EstadoInstalacion.USUARIO_CREADO
            # No establecer fecha_creacion_usuario para cambio de equipo (debe permanecer null)
            db.session.commit()
        
        return jsonify(equipo_schema.dump(nuevo_equipo)), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400