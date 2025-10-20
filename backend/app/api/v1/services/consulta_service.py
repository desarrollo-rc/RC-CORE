# backend/app/api/v1/services/consulta_service.py
import time
import re
from sqlalchemy import text
from werkzeug.exceptions import NotFound, BadRequest, Forbidden
from app.models.analitica.consultas import Consulta, ConsultaEjecucion, TipoQuery
from app.models.negocio.pedidos import Pedido, EstadoPedido
from app.extensions import db 

class ConsultaService:

    @staticmethod
    def list_consultas():
        return Consulta.query.order_by(Consulta.fecha_creacion.desc()).all()

    @staticmethod
    def get_consulta_by_codigo(codigo_consulta: str):
        consulta = Consulta.query.filter_by(codigo_consulta=codigo_consulta).first()
        if not consulta:
            raise NotFound(f"Consulta con código '{codigo_consulta}' no encontrada.")
        return consulta

    @staticmethod
    def create_consulta(data: dict, id_usuario: int):
        if Consulta.query.filter_by(codigo_consulta=data['codigo_consulta']).first():
            raise BadRequest("Ya existe una consulta con este código.")
        
        consulta = Consulta(**data)
        consulta.creado_por = id_usuario
        db.session.add(consulta)
        db.session.commit()
        return consulta

    @staticmethod
    def update_consulta(codigo_consulta: str, data: dict, id_usuario: int):
        consulta = ConsultaService.get_consulta_by_codigo(codigo_consulta)
        
        # Campos que no deben actualizarse
        campos_protegidos = ['id_consulta', 'codigo_consulta', 'creado_por', 'fecha_creacion', 'version']
        
        for key, value in data.items():
            if key not in campos_protegidos and hasattr(consulta, key):
                setattr(consulta, key, value)
        
        db.session.commit()
        return consulta

    @staticmethod
    def delete_consulta(codigo_consulta: str):
        consulta = ConsultaService.get_consulta_by_codigo(codigo_consulta)
        db.session.delete(consulta)
        db.session.commit()

    @staticmethod
    def execute_by_codigo_for_excel(codigo_consulta: str, id_usuario: int, parametros: dict = None):
        """Ejecuta una consulta sin límite de filas para exportación a Excel"""
        start_time = time.time()
        consulta = ConsultaService.get_consulta_by_codigo(codigo_consulta)

        if not consulta.activo:
            raise Forbidden("La consulta no está activa.")
        if consulta.tipo == TipoQuery.ESCRITURA:
            raise Forbidden("Las consultas de ESCRITURA no pueden ejecutarse desde el endpoint genérico.")

        engine = None
        if consulta.bdd_source.name == 'OMSRC':
            engine = db.get_engine(bind_key='omsrc') 
        elif consulta.bdd_source.name == 'RC_CORE':
            engine = db.session.get_bind()
        else:
            raise BadRequest(f"El origen de BDD '{consulta.bdd_source.name}' no está configurado.")

        try:
            with engine.connect() as connection:
                # Limpiar la query SQL: remover prefijos de base de datos innecesarios
                query_sql_limpia = consulta.query_sql
                
                # Remover comandos USE database
                query_sql_limpia = re.sub(r'^\s*USE\s+\w+\s*;?\s*', '', query_sql_limpia, flags=re.IGNORECASE | re.MULTILINE)
                
                # Remover patrones como [rcenter].[schema] y dejarlo como [schema]
                query_sql_limpia = re.sub(r'\[rcenter\]\.', '', query_sql_limpia, flags=re.IGNORECASE)
                
                query_sql = text(query_sql_limpia)
                result_proxy = connection.execute(query_sql, parametros or {})
                
                resultado = {}
                if result_proxy.returns_rows:
                    # Sin límite para Excel
                    resultado["data"] = [dict(row) for row in result_proxy.mappings()]
                    resultado["filas"] = len(resultado["data"])
                else:
                    resultado["filas"] = result_proxy.rowcount
                
                return resultado
        except Exception as e:
            raise BadRequest(f"Error al ejecutar la query: {e}")

    @staticmethod
    def execute_by_codigo(codigo_consulta: str, id_usuario: int, parametros: dict = None):
        start_time = time.time()
        consulta = ConsultaService.get_consulta_by_codigo(codigo_consulta)

        if not consulta.activo:
            raise Forbidden("La consulta no está activa.")
        if consulta.tipo == TipoQuery.ESCRITURA:
            raise Forbidden("Las consultas de ESCRITURA no pueden ejecutarse desde el endpoint genérico.")

        engine = None
        if consulta.bdd_source.name == 'OMSRC':
            # --- Y EL SEGUNDO CAMBIO CLAVE ES ESTE ---
            # Usamos el método correcto para obtener la conexión
            engine = db.get_engine(bind_key='omsrc') 
        elif consulta.bdd_source.name == 'RC_CORE':
            engine = db.session.get_bind()
        else:
            raise BadRequest(f"El origen de BDD '{consulta.bdd_source.name}' no está configurado.")

        ejecucion = ConsultaEjecucion(id_consulta=consulta.id_consulta, ejecutada_por=id_usuario, parametros_usados=parametros)
        db.session.add(ejecucion)
        db.session.commit()

        try:
            with engine.connect() as connection:
                # Limpiar la query SQL: remover prefijos de base de datos innecesarios
                query_sql_limpia = consulta.query_sql
                
                # Remover comandos USE database
                query_sql_limpia = re.sub(r'^\s*USE\s+\w+\s*;?\s*', '', query_sql_limpia, flags=re.IGNORECASE | re.MULTILINE)
                
                # Remover patrones como [rcenter].[schema] y dejarlo como [schema]
                query_sql_limpia = re.sub(r'\[rcenter\]\.', '', query_sql_limpia, flags=re.IGNORECASE)
                
                # Debug: imprimir la query limpia
                print(f"[DEBUG] Query original: {consulta.query_sql[:200]}...")
                print(f"[DEBUG] Query limpia: {query_sql_limpia[:200]}...")
                
                query_sql = text(query_sql_limpia)
                result_proxy = connection.execute(query_sql, parametros or {})
                
                resultado = { "id_ejecucion": ejecucion.id_ejecucion }
                if result_proxy.returns_rows:
                    # Limitar a 50,000 filas para evitar crashes del navegador
                    MAX_ROWS = 50000
                    filas = []
                    for i, row in enumerate(result_proxy.mappings()):
                        if i >= MAX_ROWS:
                            break
                        filas.append(dict(row))
                    
                    resultado["data"] = filas
                    resultado["filas"] = len(filas)
                    resultado["filas_totales"] = result_proxy.rowcount if hasattr(result_proxy, 'rowcount') else len(filas)
                    resultado["limitado"] = len(filas) >= MAX_ROWS
                    
                    print(f"[DEBUG] Filas retornadas: {resultado['filas']} (total: {resultado.get('filas_totales', 'N/A')})")
                else:
                    resultado["filas"] = result_proxy.rowcount
                
                ejecucion.filas = resultado["filas"]
                ejecucion.duracion_ms = int((time.time() - start_time) * 1000)
                db.session.commit()
                
                return resultado
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error ejecutando query: {str(e)}")
            raise BadRequest(f"Error al ejecutar la query: {e}")

    @staticmethod
    def sincronizar_estados_pedidos_b2b(id_usuario: int):
        from app.models.negocio.pedidos import EstadoAprobacionCredito, EstadoPedido, HistorialEstadoPedido
        from datetime import datetime
        
        CODIGO_CONSULTA_OMS = "B2B_ESTADO_CREDITO_PEDIDOS"
        try:
            resultado_omsrc = ConsultaService.execute_by_codigo(CODIGO_CONSULTA_OMS, id_usuario)
        except NotFound:
            raise BadRequest(f"La consulta de sincronización '{CODIGO_CONSULTA_OMS}' no existe. Debe ser creada primero.")

        data_externa = resultado_omsrc.get("data", [])
        if not data_externa:
            return {"message": "No se encontraron pedidos para actualizar.", "actualizados": 0, "errores": []}

        # Obtener los estados necesarios
        estado_aprobado = EstadoAprobacionCredito.query.filter_by(codigo_estado='APROBADO').first()
        estado_en_proceso = EstadoPedido.query.filter_by(codigo_estado='EN_PROCESO').first()
        
        if not estado_aprobado:
            raise BadRequest("No se encontró el estado de crédito 'APROBADO' en el sistema.")
        if not estado_en_proceso:
            raise BadRequest("No se encontró el estado general 'EN_PROCESO' en el sistema.")

        # Obtener todos los códigos de pedidos B2B que existen en RC CORE
        pedidos_existentes = Pedido.query.filter(
            Pedido.codigo_pedido_origen.isnot(None)
        ).with_entities(Pedido.codigo_pedido_origen).all()
        
        codigos_existentes = {str(p.codigo_pedido_origen) for p in pedidos_existentes}
        
        # Filtrar solo los pedidos que existen en RC CORE
        pedidos_a_procesar = [
            item for item in data_externa 
            if item.get("numeroVenta") and str(item.get("numeroVenta")) in codigos_existentes
        ]
        
        # Contar los pedidos que se omiten porque no existen en RC CORE
        omitidos_no_existen = len(data_externa) - len(pedidos_a_procesar)

        actualizados = 0
        errores = []
        debug_info = []  # Para diagnosticar qué está pasando
        for item in pedidos_a_procesar:
            numero_venta = item.get("numeroVenta")
            if not numero_venta:
                errores.append(f"Registro omitido por falta de 'numeroVenta': {item}")
                continue
            
            pedido = Pedido.query.filter_by(codigo_pedido_origen=str(numero_venta)).first()
            if not pedido:
                # Esto no debería pasar ya que filtramos arriba, pero por seguridad lo dejamos
                errores.append(f"Pedido con numeroVenta {numero_venta} no encontrado en RC CORE.")
                continue

            try:
                # Guardar el nombre del estado anterior antes de cambiar
                estado_anterior_nombre = pedido.estado_credito.nombre_estado if pedido.estado_credito else None
                estado_anterior_general_nombre = pedido.estado_general.nombre_estado if pedido.estado_general else None
                
                # Debug: ver qué estados tiene actualmente
                debug_info.append({
                    'numero_venta': numero_venta,
                    'estado_credito_actual': estado_anterior_nombre,
                    'estado_general_actual': estado_anterior_general_nombre,
                    'id_estado_credito': pedido.id_estado_credito,
                    'id_estado_general': pedido.id_estado_general
                })
                
                # Verificar si necesita actualizaciones
                necesita_actualizacion = False
                cambios = []
                
                # Actualizar estado de crédito si no está aprobado
                if pedido.id_estado_credito != estado_aprobado.id_estado:
                    pedido.id_estado_credito = estado_aprobado.id_estado
                    necesita_actualizacion = True
                    cambios.append(f"Estado crédito: {estado_anterior_nombre} → APROBADO")
                
                # Actualizar estado general si no está en proceso
                if pedido.id_estado_general != estado_en_proceso.id_estado:
                    pedido.id_estado_general = estado_en_proceso.id_estado
                    necesita_actualizacion = True
                    cambios.append(f"Estado general: {estado_anterior_general_nombre} → EN_PROCESO")
                
                # Actualizar número SAP si viene en los datos
                numero_sap = item.get("numeroSap") or item.get("numeroPedidoSap")
                if numero_sap and not pedido.numero_pedido_sap:
                    pedido.numero_pedido_sap = str(numero_sap)
                    necesita_actualizacion = True
                    cambios.append(f"Número SAP: {numero_sap}")
                
                # Obtener la fecha de crédito del OMSRC
                fecha_credito_omsrc = item.get("fechaCredito")
                if fecha_credito_omsrc:
                    # Convertir string a datetime si es necesario
                    if isinstance(fecha_credito_omsrc, str):
                        from datetime import datetime as dt
                        try:
                            fecha_credito_omsrc = dt.fromisoformat(fecha_credito_omsrc.replace('Z', '+00:00'))
                        except:
                            fecha_credito_omsrc = None
                
                # Verificar si necesitamos actualizar el historial con la fecha correcta
                # Buscar el último registro de historial de crédito para este pedido
                ultimo_historial = HistorialEstadoPedido.query.filter_by(
                    id_pedido=pedido.id_pedido,
                    tipo_estado="CREDITO"
                ).order_by(HistorialEstadoPedido.fecha_evento.desc()).first()
                
                # Si hay cambios en estados, crear nuevo registro en el historial
                if necesita_actualizacion:
                    observacion = "Sincronización desde OMSRC: " + ", ".join(cambios)
                    
                    # Usar la fecha de crédito del OMSRC si está disponible, sino la hora actual
                    fecha_evento = fecha_credito_omsrc if fecha_credito_omsrc else datetime.now()
                    
                    historial = HistorialEstadoPedido(
                        id_pedido=pedido.id_pedido,
                        fecha_evento=fecha_evento,
                        estado_anterior=estado_anterior_nombre,
                        estado_nuevo=estado_aprobado.nombre_estado,
                        tipo_estado="CREDITO",
                        id_usuario_responsable=id_usuario,
                        observaciones=observacion
                    )
                    db.session.add(historial)
                    actualizados += 1
                
                # Si no hay cambios en estados pero hay fecha de crédito del OMSRC, 
                # actualizar el último registro del historial con la fecha correcta
                elif fecha_credito_omsrc and ultimo_historial:
                    # Comparar fechas (con margen de 1 minuto para evitar problemas de precisión)
                    diferencia = abs((ultimo_historial.fecha_evento - fecha_credito_omsrc).total_seconds())
                    if diferencia > 60:  # Más de 1 minuto de diferencia
                        # Actualizar el registro existente con la fecha correcta
                        ultimo_historial.fecha_evento = fecha_credito_omsrc
                        ultimo_historial.observaciones = (ultimo_historial.observaciones or "") + " [Fecha corregida desde OMSRC]"
                        actualizados += 1
                
            except Exception as e:
                 errores.append(f"Error actualizando pedido {numero_venta}: {str(e)}")

        db.session.commit()
        
        # Agregar información de debug a los errores para diagnóstico
        if actualizados == 0 and len(pedidos_a_procesar) > 0:
            # Mostrar los primeros 3 pedidos para diagnóstico
            debug_sample = debug_info[:3]
            errores.append(f"[DEBUG] Primeros 3 pedidos procesados: {debug_sample}")
        
        return {
            "message": "Sincronización completada.",
            "total_revisados": len(data_externa),
            "total_en_rc_core": len(pedidos_existentes),
            "pedidos_procesados": len(pedidos_a_procesar),
            "omitidos_no_existen": omitidos_no_existen,
            "actualizados": actualizados,
            "errores": errores
        }