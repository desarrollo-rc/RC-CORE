# backend/app/api/v1/routes/instalacion_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.services.instalacion_service import InstalacionService
from app.api.v1.schemas.instalacion_schemas import instalacion_schema, instalaciones_schema, create_instalacion_schema, update_instalacion_schema
from flask_jwt_extended import jwt_required
from app.api.v1.utils.decorators import permission_required
from marshmallow import ValidationError
import os

instalaciones_bp = Blueprint('instalaciones_bp', __name__)

@instalaciones_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('instalaciones:ver')
def get_instalaciones():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    
    # Filtros
    tipo_caso_id = request.args.get('tipo_caso_id', None, type=int)
    usuario_b2b_id = request.args.get('usuario_b2b_id', None, type=int)
    id_cliente = request.args.get('id_cliente', None, type=int)
    id_vendedor = request.args.get('id_vendedor', None, type=int)
    fecha_desde = request.args.get('fecha_desde', None)
    fecha_hasta = request.args.get('fecha_hasta', None)
    estado = request.args.get('estado', None)
    
    # Ordenamiento
    sort_by = request.args.get('sort_by', 'fecha_solicitud')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Procesar fechas
    from datetime import datetime, time
    
    fecha_desde_parsed = None
    fecha_hasta_parsed = None
    
    if fecha_desde:
        try:
            # Para fecha_desde, usar inicio del día (00:00:00)
            fecha_desde_parsed = datetime.fromisoformat(fecha_desde).replace(hour=0, minute=0, second=0, microsecond=0)
        except ValueError:
            pass
    
    if fecha_hasta:
        try:
            # Para fecha_hasta, usar fin del día (23:59:59)
            fecha_hasta_parsed = datetime.fromisoformat(fecha_hasta).replace(hour=23, minute=59, second=59, microsecond=999999)
        except ValueError:
            pass
    
    # Obtener instalaciones con filtros y paginación
    result = InstalacionService.get_instalaciones_paginated(
        page=page,
        per_page=per_page,
        tipo_caso_id=tipo_caso_id,
        usuario_b2b_id=usuario_b2b_id,
        id_cliente=id_cliente,
        id_vendedor=id_vendedor,
        fecha_desde=fecha_desde_parsed,
        fecha_hasta=fecha_hasta_parsed,
        estado=estado,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    instalaciones_data = instalaciones_schema.dump(result.items)
    
    return jsonify({
        'instalaciones': instalaciones_data,
        'pagination': {
            'page': result.page,
            'pages': result.pages,
            'per_page': result.per_page,
            'total': result.total
        }
    }), 200

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
    from flask import current_app
    try:
        data = request.json
        current_app.logger.info(f"[ENDPOINT] Crear usuario instalación {id} - Datos recibidos: {data}")
        current_app.logger.info(f"[ENDPOINT] existe_en_corp recibido: {data.get('existe_en_corp', 'NO ENVIADO')}")
        instalacion = InstalacionService.crear_usuario_instalacion(id, data)
        current_app.logger.info(f"[ENDPOINT] Usuario creado exitosamente. Estado final: {instalacion.estado}")
        return jsonify(instalacion_schema.dump(instalacion)), 200
    except Exception as e:
        current_app.logger.error(f"[ENDPOINT] Error al crear usuario: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/continuar-sin-usuario', methods=['PUT'])
@jwt_required()
@permission_required('instalaciones:editar')
def continuar_sin_usuario(id):
    """Permite continuar con la instalación sin crear usuario B2B"""
    try:
        instalacion = InstalacionService.continuar_sin_usuario(id)
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
    """Sincroniza los equipos del usuario desde Corp usando Playwright"""
    from flask import current_app
    try:
        # Obtener la instalación para obtener el usuario B2B
        instalacion = InstalacionService.get_instalacion_by_id(id)
        
        if not instalacion.id_usuario_b2b:
            return jsonify({"error": "La instalación no tiene un usuario B2B asignado"}), 400
        
        # Obtener el usuario B2B para obtener el código de usuario
        from app.api.v1.services.usuario_b2b_service import UsuarioB2BService
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(instalacion.id_usuario_b2b)
        
        current_app.logger.info(f"[SINCRONIZAR] Buscando equipos para usuario: {usuario_b2b.usuario}")
        
        # Llamar a la automatización de Playwright
        from automatizaciones.playwright.equipo_automation import buscar_equipos_corp
        
        # Determinar si ejecutar en modo headless
        headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
        
        resultado = buscar_equipos_corp(
            codigo_usuario=usuario_b2b.usuario,
            headless=headless_mode
        )
        
        if resultado["success"]:
            return jsonify({
                "ok": True,
                "equipos": resultado["equipos"],
                "total": resultado["total"],
                "message": resultado["message"]
            }), 200
        else:
            return jsonify({
                "ok": False,
                "equipos": [],
                "total": 0,
                "error": resultado.get("error", resultado.get("message", "Error desconocido"))
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"[SINCRONIZAR] Error al sincronizar equipos: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/activar-equipo', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:editar')
def activar_equipo(id):
    """Activa un equipo y desactiva los demás (método local)"""
    try:
        data = request.json
        equipo_id = data.get('equipo_id')
        if not equipo_id:
            return jsonify({"error": "Se requiere equipo_id"}), 400
        
        result = InstalacionService.activar_equipo(id, equipo_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@instalaciones_bp.route('/<int:id>/activar-equipo-corp', methods=['POST'])
@jwt_required()
@permission_required('instalaciones:editar')
def activar_equipo_corp(id):
    """Activa un equipo en Corp usando Playwright y luego lo instala"""
    from flask import current_app
    try:
        data = request.json
        nombre_equipo = data.get('nombre_equipo')
        if not nombre_equipo:
            return jsonify({"error": "Se requiere nombre_equipo"}), 400
        
        # Obtener la instalación
        instalacion = InstalacionService.get_instalacion_by_id(id)
        
        if not instalacion.id_usuario_b2b:
            return jsonify({"error": "La instalación no tiene un usuario B2B asignado"}), 400
        
        # Obtener el usuario B2B para obtener el código de usuario
        from app.api.v1.services.usuario_b2b_service import UsuarioB2BService
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(instalacion.id_usuario_b2b)
        
        current_app.logger.info(f"[ACTIVAR] Activando equipo {nombre_equipo} para usuario: {usuario_b2b.usuario}")
        
        # Llamar a la automatización de Playwright para activar el equipo en Corp
        from automatizaciones.playwright.equipo_automation import activar_equipo_corp
        
        # Determinar si ejecutar en modo headless
        headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
        
        resultado = activar_equipo_corp(
            codigo_usuario=usuario_b2b.usuario,
            nombre_equipo=nombre_equipo,
            headless=headless_mode
        )
        
        if resultado["success"]:
            # Si la activación fue exitosa, buscar el equipo en la base de datos local y asociarlo
            from app.models.entidades.equipos import Equipo
            equipo = Equipo.query.filter_by(
                id_usuario_b2b=usuario_b2b.id_usuario_b2b,
                nombre_equipo=nombre_equipo
            ).first()
            
            if equipo:
                # Instalar el equipo (asociarlo a la instalación)
                instalacion_actualizada = InstalacionService.instalar_equipo(id, equipo.id_equipo)
                
                return jsonify({
                    "success": True,
                    "message": f"{resultado['message']}. Equipo instalado exitosamente.",
                    "instalacion": instalacion_schema.dump(instalacion_actualizada)
                }), 200
            else:
                # Si no se encuentra el equipo local, solo retornar éxito de activación
                return jsonify({
                    "success": True,
                    "message": resultado["message"],
                    "warning": "Equipo activado en Corp pero no encontrado en la base de datos local"
                }), 200
        else:
            return jsonify({
                "success": False,
                "error": resultado.get("error", resultado.get("message", "Error desconocido"))
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"[ACTIVAR] Error al activar equipo en Corp: {str(e)}", exc_info=True)
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