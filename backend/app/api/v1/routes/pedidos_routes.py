# backend/app/api/v1/routes/pedidos_routes.py
from flask import Blueprint, request, jsonify, Response
from app.api.v1.schemas.pedidos_schemas import PedidoCreateSchema, PedidoResponseSchema, PedidoListResponseSchema, PedidoUpdateEstadoSchema, PedidoFacturadoSchema, PedidoEntregadoSchema, PedidoUpdateCantidadesSchema
from app.api.v1.schemas.cliente_schemas import PaginationSchema
from app.api.v1.services.pedidos_service import PedidoService
from app.api.v1.services.informes_service import InformesService
from app.api.v1.utils.errors import BusinessRuleError, RelatedResourceNotFoundError
from app.api.v1.utils.decorators import permission_required
from datetime import datetime
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound
import traceback

pedidos_bp = Blueprint('pedidos_bp', __name__)

schema_create = PedidoCreateSchema()
schema_response = PedidoResponseSchema()
schema_list_response = PedidoListResponseSchema(many=True)
pagination_schema = PaginationSchema()
schema_update_estado = PedidoUpdateEstadoSchema()
schema_facturado = PedidoFacturadoSchema()
schema_entregado = PedidoEntregadoSchema()
schema_update_cantidades = PedidoUpdateCantidadesSchema()


@pedidos_bp.route('/', methods=['POST'])
@jwt_required()
@permission_required('pedidos:crear')
def create_pedido():
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
    
    try:
        data = schema_create.load(json_data)
        current_user_id = get_jwt_identity()
        nuevo_pedido = PedidoService.create_pedido(data, current_user_id)
        return schema_response.dump(nuevo_pedido), 201
    
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as err:
        return jsonify({"error": str(err)}), err.status_code
    except Exception as e:
        return jsonify({"error": "Ocurrió un error interno en el servidor."}), 500

@pedidos_bp.route('/', methods=['GET'])
@jwt_required()
@permission_required('pedidos:listar')
def get_pedidos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    codigo_b2b = request.args.get('codigo_b2b', type=str)
    codigo_b2b = codigo_b2b.strip() if isinstance(codigo_b2b, str) else None

    fecha_desde_raw = request.args.get('fecha_desde')
    fecha_hasta_raw = request.args.get('fecha_hasta')

    # Esperamos formato 'YYYY-MM-DD' desde el frontend. Convertimos a inicio/fin de día.
    fecha_desde = None
    fecha_hasta = None
    try:
        if fecha_desde_raw:
            y, m, d = map(int, fecha_desde_raw.split('T')[0].split('-'))
            from datetime import datetime
            fecha_desde = datetime(y, m, d, 0, 0, 0)
        if fecha_hasta_raw:
            y, m, d = map(int, fecha_hasta_raw.split('T')[0].split('-'))
            from datetime import datetime
            fecha_hasta = datetime(y, m, d, 23, 59, 59)
    except Exception:
        # Si el formato no es válido, se ignoran las fechas.
        fecha_desde = None
        fecha_hasta = None

    filters = {
        'id_cliente': request.args.get('cliente_id', type=int),
        'id_vendedor': request.args.get('vendedor_id', type=int),
        'id_estado_general': request.args.get('estado_general_id', type=int),
        'id_estado_credito': request.args.get('estado_credito_id', type=int),
        'id_estado_logistico': request.args.get('estado_logistico_id', type=int),
        'codigo_b2b': codigo_b2b or None,
        'fecha_desde': fecha_desde,
        'fecha_hasta': fecha_hasta
    }

    filters = {k: v for k, v in filters.items() if v is not None}

    paginated_result = PedidoService.get_all_pedidos(page, per_page, **filters)
    
    pedidos_data = schema_list_response.dump(paginated_result.items)
    pagination_data = pagination_schema.dump(paginated_result)

    return jsonify({
        'pedidos': pedidos_data,
        'pagination': pagination_data
    }), 200


@pedidos_bp.route('/export', methods=['GET'])
@jwt_required()
@permission_required('pedidos:listar')
def export_pedidos_cutoff():
    """
    Exporta pedidos de la ventana definida por fecha objetivo y hora de corte.
    Query params:
    - fecha=YYYY-MM-DD (obligatorio)
    - cutoff_hour=0-23 (obligatorio; ej 12)
    Respuesta: CSV text/plain
    """
    fecha_str = request.args.get('fecha')
    cutoff_hour = request.args.get('cutoff_hour', type=int)
    if not fecha_str or cutoff_hour is None:
        return jsonify({"error": "Parametros requeridos: fecha (YYYY-MM-DD) y cutoff_hour (0-23)."}), 400

    try:
        y, m, d = map(int, fecha_str.split('-'))
        target_date = datetime(y, m, d)
    except Exception:
        return jsonify({"error": "Formato de fecha inválido. Use YYYY-MM-DD."}), 400

    try:
        pedidos = PedidoService.get_pedidos_cutoff_window(target_date, cutoff_hour)
    except Exception:
        return jsonify({"error": "Ocurrió un error al generar el informe."}), 500

    # Construir CSV simple
    # Campos clave: id_pedido, codigo_pedido_origen, cliente, fecha_creacion, monto_total, estado, cantidad_skus, total_unidades
    import csv
    from io import StringIO
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["id_pedido", "codigo_b2b", "cliente", "fecha_creacion", "monto_total", "estado_general", "cantidad_skus", "total_unidades"])
    for p in pedidos:
        cliente_nombre = p.cliente.nombre_cliente if getattr(p, 'cliente', None) else ''
        estado_nombre = p.estado_general.nombre_estado if getattr(p, 'estado_general', None) else ''
        
        # Calcular cantidad de SKUs y total de unidades
        cantidad_skus = len(p.detalles) if hasattr(p, 'detalles') else 0
        total_unidades = sum(d.cantidad for d in p.detalles) if hasattr(p, 'detalles') else 0
        
        writer.writerow([
            p.id_pedido,
            p.codigo_pedido_origen or '',
            cliente_nombre,
            p.fecha_creacion.isoformat(sep=' '),
            f"{p.monto_total}",
            estado_nombre,
            cantidad_skus,
            total_unidades
        ])

    csv_data = output.getvalue()
    output.close()
    return Response(csv_data, mimetype='text/csv', headers={
        'Content-Disposition': f'attachment; filename="pedidos_export_{fecha_str}_cutoff_{cutoff_hour}.csv"'
    })

@pedidos_bp.route('/<int:pedido_id>', methods=['GET'])
@jwt_required()
@permission_required('pedidos:ver')
def get_pedido_by_id(pedido_id):
    try:
        pedido = PedidoService.get_pedido_by_id(pedido_id)
        return schema_response.dump(pedido), 200
    except NotFound:
        return jsonify({"error": f"Pedido con ID {pedido_id} no encontrado."}), 404

@pedidos_bp.route('/<int:pedido_id>/estado', methods=['PUT'])
@jwt_required()
@permission_required('pedidos:actualizar-estado')
def update_pedido_estado(pedido_id):
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
        
    try:
        data = schema_update_estado.load(json_data)
        

        current_user_id = int(get_jwt_identity())

        print("\n--- INICIO DE PETICIÓN PUT /pedidos/<id>/estado ---")
        print(f"[RUTA] Recibido para pedido ID: {pedido_id}")
        print(f"[RUTA] Datos recibidos (payload): {data}")
        print(f"[RUTA] ID de usuario responsable: {current_user_id}")
        
        pedido_actualizado = PedidoService.update_estado(pedido_id, data, current_user_id)
        print(f"[RUTA] El servicio finalizó correctamente.")
        print(f"[RUTA] Objeto a serializar: {pedido_actualizado.__dict__ if hasattr(pedido_actualizado, '__dict__') else pedido_actualizado}")
        
        print("[RUTA] Serialización exitosa. Enviando respuesta.")
        print("--- FIN DE PETICIÓN ---\n")

        return schema_response.dump(pedido_actualizado), 200
    
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as err:
        return jsonify({"error": str(err)}), err.status_code
    except RelatedResourceNotFoundError as err:
        return jsonify({"error": str(err)}), err.status_code
    except NotFound:
        return jsonify({"error": f"Pedido con ID {pedido_id} no encontrado."}), 404
    except Exception as e:
        # --- MODIFICAR ESTE BLOQUE PARA OBTENER MÁS DETALLE ---
        print(f"[RUTA] !!! ERROR INESPERADO EN LA RUTA !!!")
        print(f"[RUTA] Tipo de error: {type(e)}")
        print(f"[RUTA] Mensaje de error: {e}")
        print(f"[RUTA] Traceback completo:")
        traceback.print_exc() # Imprime el stack trace completo en la consola
        print("--- FIN DE PETICIÓN CON ERROR ---\n")
        return jsonify({"error": f"Ocurrió un error interno: {e}"}), 500

@pedidos_bp.route('/<int:pedido_id>/marcar-facturado', methods=['PUT'])
@jwt_required()
@permission_required('pedidos:facturar')
def marcar_facturado(pedido_id):
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
    
    try:
        data = schema_facturado.load(json_data)
        current_user_id = int(get_jwt_identity())
        
        pedido_actualizado = PedidoService.marcar_facturado(pedido_id, data, current_user_id)
        return schema_response.dump(pedido_actualizado), 200

    except ValidationError as err:
        return jsonify(err.messages), 422
    except (BusinessRuleError, RelatedResourceNotFoundError, NotFound) as err:
        return jsonify({"error": str(err)}), getattr(err, 'status_code', 400)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Ocurrió un error interno: {e}"}), 500


@pedidos_bp.route('/<int:pedido_id>/marcar-entregado', methods=['PUT'])
@jwt_required()
@permission_required('pedidos:entregar')
def marcar_entregado(pedido_id):
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
        
    try:
        data = schema_entregado.load(json_data)
        current_user_id = int(get_jwt_identity())
        
        pedido_actualizado = PedidoService.marcar_entregado(pedido_id, data, current_user_id)
        return schema_response.dump(pedido_actualizado), 200

    except ValidationError as err:
        return jsonify(err.messages), 422
    except (BusinessRuleError, RelatedResourceNotFoundError, NotFound) as err:
        return jsonify({"error": str(err)}), getattr(err, 'status_code', 400)
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Ocurrió un error interno: {e}"}), 500

@pedidos_bp.route('/<int:pedido_id>/cantidades', methods=['PUT'])
@jwt_required()
@permission_required('pedidos:actualizar-estado')
def update_pedido_cantidades(pedido_id):
    json_data = request.get_json()
    if not json_data or 'detalles' not in json_data:
        return jsonify({"error": "Petición inválida."}), 400

    try:
        data = schema_update_cantidades.load(json_data)
        current_user_id = int(get_jwt_identity())
        pedido_actualizado = PedidoService.update_cantidades_detalle(pedido_id, data['detalles'], current_user_id)
        return schema_response.dump(pedido_actualizado), 200
    except ValidationError as err:
        return jsonify(err.messages), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@pedidos_bp.route('/gmail/extraer', methods=['POST'])
@jwt_required()
@permission_required('pedidos:crear')
def extraer_pedidos_gmail():
    """
    Extrae pedidos B2B desde Gmail en un rango de fechas.
    Body JSON:
    - fecha_desde: YYYY-MM-DD (opcional, por defecto últimas 24 horas)
    - fecha_hasta: YYYY-MM-DD (opcional)
    """
    json_data = request.get_json()
    if not json_data:
        return jsonify({"error": "Petición inválida."}), 400
    
    fecha_desde = json_data.get('fecha_desde')
    fecha_hasta = json_data.get('fecha_hasta')
    
    try:
        # Importar el extractor
        from automatizaciones.gmail.extractor_pedidos_b2b import procesar_pedidos_b2b
        from app.extensions import db
        
        # Ejecutar el extractor con la sesión de base de datos
        resultado = procesar_pedidos_b2b(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            db=db.session
        )
        
        return jsonify(resultado), 200 if resultado['exito'] else 400
        
    except FileNotFoundError as e:
        return jsonify({
            "exito": False,
            "mensaje": str(e),
            "errores": []
        }), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "exito": False,
            "mensaje": f"Error inesperado: {str(e)}",
            "errores": []
        }), 500


@pedidos_bp.route('/gmail/preview', methods=['POST'])
@jwt_required()
@permission_required('pedidos:crear')
def preview_pedidos_gmail():
    """
    Extrae y valida pedidos B2B desde Gmail sin crearlos en la base de datos.
    Retorna la información detallada para que el usuario pueda revisarla antes de cargarla.
    Body JSON:
    - fecha_desde: YYYY-MM-DD (opcional, por defecto últimas 24 horas)
    - fecha_hasta: YYYY-MM-DD (opcional)
    """
    json_data = request.get_json()
    if not json_data:
        json_data = {}
    
    fecha_desde = json_data.get('fecha_desde')
    fecha_hasta = json_data.get('fecha_hasta')
    
    try:
        from automatizaciones.gmail.extractor_pedidos_b2b import extraer_pedidos_preview
        from app.extensions import db
        
        # Ejecutar el preview con la sesión de base de datos para validaciones
        resultado = extraer_pedidos_preview(
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            db=db.session
        )
        
        return jsonify(resultado), 200 if resultado['exito'] else 400
        
    except FileNotFoundError as e:
        return jsonify({
            "exito": False,
            "mensaje": str(e),
            "pedidos": [],
            "errores": []
        }), 400
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "exito": False,
            "mensaje": f"Error inesperado: {str(e)}",
            "pedidos": [],
            "errores": []
        }), 500


@pedidos_bp.route('/gmail/procesar', methods=['POST'])
@jwt_required()
@permission_required('pedidos:crear')
def procesar_pedidos_gmail():
    """
    Procesa y crea pedidos seleccionados por el usuario desde la vista de revisión.
    Body JSON:
    - pedidos: Lista de pedidos a procesar (con toda la información extraída)
    - crear_clientes: boolean (opcional, default True)
    - crear_productos: boolean (opcional, default True)
    """
    json_data = request.get_json()
    if not json_data or 'pedidos' not in json_data:
        return jsonify({"error": "Petición inválida. Se requiere 'pedidos' en el body."}), 400
    
    pedidos_data = json_data.get('pedidos', [])
    crear_clientes = json_data.get('crear_clientes', True)
    crear_productos = json_data.get('crear_productos', True)
    
    if not pedidos_data:
        return jsonify({"error": "No se proporcionaron pedidos para procesar."}), 400
    
    try:
        from automatizaciones.gmail.extractor_pedidos_b2b import procesar_pedidos_seleccionados
        from app.extensions import db
        
        # Procesar los pedidos seleccionados
        resultado = procesar_pedidos_seleccionados(
            pedidos_data=pedidos_data,
            db=db.session,
            crear_clientes=crear_clientes,
            crear_productos=crear_productos
        )
        
        return jsonify(resultado), 200 if resultado['exito'] else 400
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "exito": False,
            "mensaje": f"Error inesperado: {str(e)}",
            "pedidos_creados": [],
            "errores": []
        }), 500


@pedidos_bp.route('/informes/corte', methods=['GET'])
@jwt_required()
@permission_required('pedidos:consultar')
def generar_informe_corte():
    """
    Genera un informe de corte por fecha y hora específica.
    Query params:
    - fecha: YYYY-MM-DD
    - hora: 0-23
    """
    fecha = request.args.get('fecha')
    hora = request.args.get('hora', type=int)
    
    if not fecha or hora is None:
        return jsonify({"error": "Se requiere fecha y hora"}), 400
    
    try:
        from app.api.v1.services.informes_service import InformesService
        pdf_data = InformesService.generar_informe_corte(fecha, hora)
        
        from flask import Response
        return Response(
            pdf_data,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=informe_corte_{fecha}_{hora}h.pdf'
            }
        )
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Error al generar informe de corte: {str(e)}"
        }), 500


@pedidos_bp.route('/informes/mensual', methods=['GET'])
@jwt_required()
@permission_required('pedidos:consultar')
def generar_informe_mensual():
    """
    Genera un informe mensual con estadísticas del mes.
    Query params:
    - mes: 1-12
    - ano: YYYY
    """
    mes = request.args.get('mes', type=int)
    año = request.args.get('ano', type=int)
    
    if not mes or not año or mes < 1 or mes > 12:
        return jsonify({"error": "Se requiere mes (1-12) y año válidos"}), 400
    
    try:
        from app.api.v1.services.informes_service import InformesService
        pdf_data = InformesService.generar_informe_mensual(mes, año)
        
        from flask import Response
        return Response(
            pdf_data,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=informe_mensual_{año}_{mes:02d}.pdf'
            }
        )
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Error al generar informe mensual: {str(e)}"
        }), 500

@pedidos_bp.route('/informes/corte/excel', methods=['GET'])
@jwt_required()
@permission_required('pedidos:consultar')
def generar_informe_corte_excel():
    """Genera un informe de corte en formato Excel"""
    try:
        fecha = request.args.get('fecha')
        hora = request.args.get('hora', type=int)
        
        if not fecha or hora is None:
            return jsonify({
                "error": "Se requiere fecha y hora"
            }), 400
        
        # Generar informe Excel
        excel_data = InformesService.generar_informe_corte_excel(fecha, hora)
        
        return Response(
            excel_data,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=informe_corte_{fecha}_{hora}h.xlsx'
            }
        )
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Error al generar informe de corte Excel: {str(e)}"
        }), 500

@pedidos_bp.route('/informes/mensual/excel', methods=['GET'])
@jwt_required()
@permission_required('pedidos:consultar')
def generar_informe_mensual_excel():
    """Genera un informe mensual en formato Excel"""
    try:
        mes = request.args.get('mes', type=int)
        año = request.args.get('ano', type=int)  # Frontend envía 'ano'
        
        if not mes or not año:
            return jsonify({
                "error": "Se requiere mes y año"
            }), 400
        
        # Generar informe Excel
        excel_data = InformesService.generar_informe_mensual_excel(mes, año)
        
        meses_nombres = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        
        return Response(
            excel_data,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=informe_mensual_{año}_{meses_nombres[mes]}.xlsx'
            }
        )
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": f"Error al generar informe mensual Excel: {str(e)}"
        }), 500


# --- Endpoints para obtener listas de estados ---

@pedidos_bp.route('/estados/generales', methods=['GET'])
@jwt_required()
@permission_required('pedidos:listar')
def get_estados_generales():
    """Retorna la lista de estados generales de pedidos"""
    from app.models.negocio.pedidos import EstadoPedido
    estados = EstadoPedido.query.order_by(EstadoPedido.nombre_estado).all()
    return jsonify([{
        'id_estado': e.id_estado,
        'codigo_estado': e.codigo_estado,
        'nombre_estado': e.nombre_estado
    } for e in estados]), 200


@pedidos_bp.route('/estados/credito', methods=['GET'])
@jwt_required()
@permission_required('pedidos:listar')
def get_estados_credito():
    """Retorna la lista de estados de crédito/cobranza"""
    from app.models.negocio.pedidos import EstadoAprobacionCredito
    estados = EstadoAprobacionCredito.query.order_by(EstadoAprobacionCredito.nombre_estado).all()
    return jsonify([{
        'id_estado': e.id_estado,
        'codigo_estado': e.codigo_estado,
        'nombre_estado': e.nombre_estado
    } for e in estados]), 200


@pedidos_bp.route('/estados/logisticos', methods=['GET'])
@jwt_required()
@permission_required('pedidos:listar')
def get_estados_logisticos():
    """Retorna la lista de estados logísticos"""
    from app.models.negocio.pedidos import EstadoLogistico
    estados = EstadoLogistico.query.order_by(EstadoLogistico.nombre_estado).all()
    return jsonify([{
        'id_estado': e.id_estado,
        'codigo_estado': e.codigo_estado,
        'nombre_estado': e.nombre_estado
    } for e in estados]), 200