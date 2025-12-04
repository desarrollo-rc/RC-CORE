# backend/app/api/v1/routes/equipo_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.equipo_schemas import equipo_schema, create_equipo_schema, update_equipo_schema, equipos_schema
from app.api.v1.services.equipo_service import EquipoService
from app.api.v1.utils.decorators import permission_required
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from app.api.v1.utils.errors import BusinessRuleError

equipos_bp = Blueprint('equipos_bp', __name__)

@equipos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('equipos:crear')
def create_equipo():
    try:
        data = create_equipo_schema.load(request.get_json())
        nuevo_equipo = EquipoService.create_equipo(data)
        return jsonify(equipo_schema.dump(nuevo_equipo)), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('equipos:listar')
def get_equipos():
    """Listar equipos con paginación opcional y filtros opcionales.
    
    Si no se proporcionan parámetros de paginación (page/per_page), retorna un array simple (compatibilidad hacia atrás).
    Si se proporcionan, retorna un objeto con 'equipos' y 'pagination'.
    """
    from app.api.v1.schemas.cliente_schemas import PaginationSchema
    
    # Verificar si se solicitó paginación
    has_page_param = request.args.get('page') is not None
    has_per_page_param = request.args.get('per_page') is not None
    use_pagination = has_page_param or has_per_page_param
    
    page = request.args.get('page', 1, type=int) if use_pagination else 1
    per_page = request.args.get('per_page', 15, type=int) if use_pagination else None
    
    # Filtros de búsqueda
    nombre_equipo = request.args.get('nombre_equipo', None)
    id_usuario_b2b = request.args.get('id_usuario_b2b', None, type=int)
    
    # Filtro por estado
    activo_param = request.args.get('activo', None)
    activo = None
    if activo_param is not None:
        activo = activo_param.lower() == 'true'
    
    # Filtro por estado_alta
    estado_alta = request.args.get('estado_alta', None)
    
    if use_pagination:
        # Modo paginado
        paginated_result = EquipoService.get_all_equipos(
            page=page,
            per_page=per_page or 15,
            nombre_equipo=nombre_equipo,
            id_usuario_b2b=id_usuario_b2b,
            activo=activo,
            estado_alta=estado_alta
        )
        
        equipos_data = equipos_schema.dump(paginated_result.items)
        pagination_schema = PaginationSchema()
        pagination_data = pagination_schema.dump(paginated_result)
        
        return jsonify({
            'equipos': equipos_data,
            'pagination': pagination_data
        }), 200
    else:
        # Modo sin paginación (compatibilidad hacia atrás) - retornar array simple
        equipos = EquipoService.get_all_equipos_unpaginated(
            nombre_equipo=nombre_equipo,
            id_usuario_b2b=id_usuario_b2b,
            activo=activo,
            estado_alta=estado_alta
        )
        
        equipos_data = equipos_schema.dump(equipos)
        return jsonify(equipos_data), 200

@equipos_bp.route('/<int:equipo_id>', methods=['GET'])
@jwt_required()
@permission_required('equipos:ver')
def get_equipo(equipo_id):
    equipo = EquipoService.get_equipo_by_id(equipo_id)
    return jsonify(equipo_schema.dump(equipo)), 200

@equipos_bp.route('/<int:equipo_id>', methods=['PUT'])
@jwt_required()
@permission_required('equipos:editar')
def update_equipo(equipo_id):
    try:
        data = update_equipo_schema.load(request.get_json())
        equipo_actualizado = EquipoService.update_equipo(equipo_id, data)
        return jsonify(equipo_schema.dump(equipo_actualizado)), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/<int:equipo_id>/desactivar', methods=['PUT'])
@jwt_required()
@permission_required('equipos:cambiar-estado')
def deactivate_equipo(equipo_id):
    """Desactiva un equipo. Si tiene usuario B2B, también intenta desactivarlo en Corp."""
    import os
    from flask import current_app
    try:
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        
        # Si el equipo tiene un usuario B2B, intentar desactivarlo también en Corp
        if equipo.usuario_b2b:
            try:
                from automatizaciones.playwright.equipo_automation import desactivar_equipo_corp
                
                headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
                
                resultado = desactivar_equipo_corp(
                    codigo_usuario=equipo.usuario_b2b.usuario,
                    nombre_equipo=equipo.nombre_equipo,
                    headless=headless_mode
                )
                
                if resultado["success"]:
                    current_app.logger.info(f"[DESACTIVAR] Equipo {equipo.nombre_equipo} desactivado exitosamente en Corp")
                else:
                    current_app.logger.warning(f"[DESACTIVAR] No se pudo desactivar equipo {equipo.nombre_equipo} en Corp: {resultado.get('error')}")
                    # Continuar con la desactivación local aunque falle en Corp
            except Exception as e:
                current_app.logger.warning(f"[DESACTIVAR] Error al desactivar equipo en Corp (continuando localmente): {str(e)}")
                # Continuar con la desactivación local aunque falle en Corp
        
        # Desactivar localmente
        equipo = EquipoService.deactivate_equipo(equipo_id)
        return jsonify(equipo_schema.dump(equipo)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/<int:equipo_id>/desactivar-corp', methods=['POST'])
@jwt_required()
@permission_required('equipos:cambiar-estado')
def deactivate_equipo_corp(equipo_id):
    """Desactiva un equipo en Corp usando Playwright y luego lo desactiva localmente"""
    import os
    from flask import current_app
    try:
        # Obtener el equipo
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        
        if not equipo.usuario_b2b:
            return jsonify({"error": "El equipo no tiene un usuario B2B asignado"}), 400
        
        current_app.logger.info(f"[DESACTIVAR] Desactivando equipo {equipo.nombre_equipo} para usuario: {equipo.usuario_b2b.usuario}")
        
        # Llamar a la automatización de Playwright para desactivar el equipo en Corp
        from automatizaciones.playwright.equipo_automation import desactivar_equipo_corp
        
        # Determinar si ejecutar en modo headless
        headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
        
        resultado = desactivar_equipo_corp(
            codigo_usuario=equipo.usuario_b2b.usuario,
            nombre_equipo=equipo.nombre_equipo,
            headless=headless_mode
        )
        
        if resultado["success"]:
            # Si la desactivación fue exitosa, desactivar también localmente
            # Desactivar siempre localmente (actualiza estado y estado_alta)
            equipo_desactivado = EquipoService.deactivate_equipo(equipo_id)
            
            current_app.logger.info(f"[DESACTIVAR] Equipo {equipo.nombre_equipo} desactivado localmente: estado=False, estado_alta=RECHAZADO")
            
            return jsonify({
                "success": True,
                "message": f"{resultado['message']}. Equipo desactivado exitosamente en el sistema local.",
                "equipo": equipo_schema.dump(equipo_desactivado)
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": resultado.get("error", resultado.get("message", "Error desconocido"))
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"[DESACTIVAR] Error al desactivar equipo en Corp: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 400

@equipos_bp.route('/<int:equipo_id>/activar', methods=['PUT'])
@jwt_required()
@permission_required('equipos:cambiar-estado')
def activate_equipo(equipo_id):
    """Activa un equipo. Si tiene usuario B2B, también intenta activarlo en Corp."""
    import os
    from flask import current_app
    try:
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        
        # Si el equipo tiene un usuario B2B, intentar activarlo también en Corp
        if equipo.usuario_b2b:
            try:
                from automatizaciones.playwright.equipo_automation import activar_equipo_corp
                
                headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
                
                resultado = activar_equipo_corp(
                    codigo_usuario=equipo.usuario_b2b.usuario,
                    nombre_equipo=equipo.nombre_equipo,
                    headless=headless_mode
                )
                
                if resultado["success"]:
                    current_app.logger.info(f"[ACTIVAR] Equipo {equipo.nombre_equipo} activado exitosamente en Corp")
                else:
                    current_app.logger.warning(f"[ACTIVAR] No se pudo activar equipo {equipo.nombre_equipo} en Corp: {resultado.get('error')}")
                    # Continuar con la activación local aunque falle en Corp
            except Exception as e:
                current_app.logger.warning(f"[ACTIVAR] Error al activar equipo en Corp (continuando localmente): {str(e)}")
                # Continuar con la activación local aunque falle en Corp
        
        # Activar localmente
        equipo = EquipoService.activate_equipo(equipo_id)
        return jsonify(equipo_schema.dump(equipo)), 200
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@equipos_bp.route('/<int:usuario_b2b_id>', methods=['GET'])
@jwt_required()
@permission_required('equipos:ver')
def get_equipo_by_usuario_b2b_id(usuario_b2b_id):
    equipo = EquipoService.get_equipo_by_usuario_b2b_id(usuario_b2b_id)
    return jsonify(equipos_schema.dump(equipo)), 200