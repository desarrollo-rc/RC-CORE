# backend/app/api/v1/services/pedidos_service.py
from app.extensions import db
from app.models.negocio.pedidos import (
    Pedido, PedidoDetalle, HistorialEstadoPedido,
    EstadoPedido, EstadoAprobacionCredito, EstadoLogistico
)
from app.models.entidades import MaestroClientes, UsuarioB2B
from app.models.productos import MaestroProductos
from app.models.negocio import CanalVenta, Vendedor
from app.api.v1.utils.errors import BusinessRuleError, RelatedResourceNotFoundError, ResourceConflictError
from sqlalchemy.orm import joinedload
from decimal import Decimal
from datetime import datetime

class PedidoService:

    @staticmethod
    def get_all_pedidos(page, per_page, **filters):
        query = Pedido.query.options(joinedload(Pedido.detalles))

        if filters.get('id_cliente'):
            query = query.filter(Pedido.id_cliente == filters['id_cliente'])
        if filters.get('id_vendedor'):
            # Coincide si el pedido tiene ese vendedor o si el cliente asignado lo tiene
            from app.models.entidades import MaestroClientes
            query = query.join(Pedido.cliente).filter(
                (Pedido.id_vendedor == filters['id_vendedor']) | (MaestroClientes.id_vendedor == filters['id_vendedor'])
            )
        if filters.get('id_estado_general'):
            query = query.filter(Pedido.id_estado_general == filters['id_estado_general'])
        if filters.get('id_estado_credito'):
            query = query.filter(Pedido.id_estado_credito == filters['id_estado_credito'])
        if filters.get('id_estado_logistico'):
            query = query.filter(Pedido.id_estado_logistico == filters['id_estado_logistico'])
        if filters.get('codigo_b2b'):
            query = query.filter(Pedido.codigo_pedido_origen.ilike(f"%{filters['codigo_b2b']}%"))
        if filters.get('fecha_desde'):
            query = query.filter(Pedido.fecha_creacion >= filters['fecha_desde'])
        if filters.get('fecha_hasta'):
            query = query.filter(Pedido.fecha_creacion <= filters['fecha_hasta'])

        return query.order_by(Pedido.fecha_creacion.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

    
    @staticmethod
    def get_pedido_by_id(pedido_id):
        """
        Obtiene un pedido por su ID con todas sus relaciones para la vista de detalle.
        """
        return Pedido.query.options(
            joinedload(Pedido.cliente),
            joinedload(Pedido.vendedor).joinedload(Vendedor.usuario),
            joinedload(Pedido.detalles).joinedload(PedidoDetalle.producto),
            joinedload(Pedido.historial_estados).joinedload(HistorialEstadoPedido.usuario_responsable),
            joinedload(Pedido.estado_general),
            joinedload(Pedido.estado_credito),
            joinedload(Pedido.estado_logistico)
        ).get_or_404(pedido_id)

    @staticmethod
    def create_pedido(data, user_id_creador):
        # --- 1. Validaciones Previas ---
        if not MaestroClientes.query.get(data['id_cliente']):
            raise RelatedResourceNotFoundError(f"Cliente con ID {data['id_cliente']} no encontrado.")
        if not CanalVenta.query.get(data['id_canal_venta']):
            raise RelatedResourceNotFoundError(f"Canal de venta con ID {data['id_canal_venta']} no encontrado.")
        if data.get('id_vendedor') and not Vendedor.query.get(data['id_vendedor']):
            raise RelatedResourceNotFoundError(f"Vendedor con ID {data['id_vendedor']} no encontrado.")
        if data.get('id_usuario_b2b') and not UsuarioB2B.query.get(data['id_usuario_b2b']):
            raise RelatedResourceNotFoundError(f"Usuario B2B con ID {data['id_usuario_b2b']} no encontrado.")
        if data.get('codigo_pedido_origen') and Pedido.query.filter_by(codigo_pedido_origen=data['codigo_pedido_origen']).first():
            raise ResourceConflictError(f"El código de pedido '{data['codigo_pedido_origen']}' ya está en uso.")

        # --- 2. Determinación del Estado Inicial ---
        fecha_del_evento = data['fecha_evento']
        aprobacion_automatica = data.get('aprobacion_automatica', False)

        if aprobacion_automatica:
            estado_credito_inicial = EstadoAprobacionCredito.query.filter_by(codigo_estado='APROBADO').first()
            observacion_historial = "Pedido creado con aprobación automática."
        else:
            estado_credito_inicial = EstadoAprobacionCredito.query.filter_by(codigo_estado='PENDIENTE').first()
            observacion_historial = "Pedido creado, pendiente de aprobación de crédito."

        if not estado_credito_inicial:
            raise BusinessRuleError("Los estados de crédito 'APROBADO' o 'PENDIENTE' no se encuentran en la base de datos.")

        # --- 3. Lógica Transaccional ---
        try:
            # Creación del Pedido
            nuevo_pedido = Pedido(
                codigo_pedido_origen=data.get('codigo_pedido_origen'),
                id_cliente=data['id_cliente'],
                id_canal_venta=data['id_canal_venta'],
                id_vendedor=data.get('id_vendedor'),
                id_usuario_b2b=data.get('id_usuario_b2b'),
                # Estado general: NUEVO (1) al crear; si hay aprobación automática entonces EN_PROCESO (2)
                id_estado_general=2 if aprobacion_automatica else 1,
                id_estado_credito=estado_credito_inicial.id_estado,
            )
            # Asegurar que la fecha de creación del pedido sea la indicada por el usuario
            # y no la fecha actual por defecto del servidor
            nuevo_pedido.fecha_creacion = fecha_del_evento
            # Si se creó con aprobación automática, debe venir el número de orden SAP
            if aprobacion_automatica and data.get('numero_pedido_sap'):
                nuevo_pedido.numero_pedido_sap = data['numero_pedido_sap']
            
            # Procesamiento de Detalles y Cálculo de Montos
            monto_neto = Decimal('0.0')
            for item_data in data['detalles']:
                producto = MaestroProductos.query.get(item_data['id_producto'])
                if not producto:
                    raise RelatedResourceNotFoundError(f"Producto con ID {item_data['id_producto']} no encontrado.")
                
                # Usar el precio unitario enviado desde el frontend
                precio_unitario = Decimal(str(item_data['precio_unitario']))
                subtotal = Decimal(item_data['cantidad']) * precio_unitario

                detalle = PedidoDetalle(
                    id_producto=item_data['id_producto'],
                    cantidad=item_data['cantidad'],
                    precio_unitario=precio_unitario,
                    subtotal=subtotal
                )
                nuevo_pedido.detalles.append(detalle)
                monto_neto += subtotal
            
            nuevo_pedido.monto_neto = monto_neto
            nuevo_pedido.monto_impuestos = monto_neto * Decimal('0.19') 
            nuevo_pedido.monto_total = monto_neto + nuevo_pedido.monto_impuestos

            db.session.add(nuevo_pedido)
            db.session.flush() # Para obtener el ID del pedido recién creado

            # Forzar la fecha de creación exacta indicada por el usuario por si el DEFAULT del DB la sobreescribió
            db.session.query(Pedido).filter_by(id_pedido=nuevo_pedido.id_pedido).update({
                Pedido.fecha_creacion: fecha_del_evento
            })

            # --- 4. CORRECCIÓN: Creación del Primer Historial con Fecha ---
            historial = HistorialEstadoPedido(
                id_pedido=nuevo_pedido.id_pedido,
                fecha_evento=fecha_del_evento, # <-- AQUÍ ESTÁ LA CORRECCIÓN CLAVE
                estado_nuevo=estado_credito_inicial.nombre_estado,
                tipo_estado="CREDITO",
                id_usuario_responsable=user_id_creador,
                observaciones=observacion_historial
            )
            db.session.add(historial)

            # Si la aprobación fue automática, registramos también el cambio de estado GENERAL a EN_PROCESO
            if aprobacion_automatica:
                estado_general_en_proceso = EstadoPedido.query.filter_by(codigo_estado='EN_PROCESO').first()
                if estado_general_en_proceso:
                    historial_general = HistorialEstadoPedido(
                        id_pedido=nuevo_pedido.id_pedido,
                        fecha_evento=fecha_del_evento,
                        estado_anterior='NUEVO',
                        estado_nuevo=estado_general_en_proceso.nombre_estado,
                        tipo_estado='GENERAL',
                        id_usuario_responsable=user_id_creador,
                        observaciones='Inicio de procesamiento por aprobación automática.'
                    )
                    db.session.add(historial_general)

            db.session.commit()
            return nuevo_pedido
            
        except Exception as e:
            db.session.rollback()
            # En lugar de un genérico BusinessRuleError, relanzamos la excepción
            # para que el traceback completo aparezca en la consola y sea más fácil de depurar.
            raise e

    @staticmethod
    def update_estado(pedido_id, data, user_id_responsable):
        pedido = Pedido.query.get_or_404(pedido_id)
        cambios = []

        # Si ya está cancelado, no se permite ningún cambio adicional
        if pedido.estado_general and pedido.estado_general.codigo_estado == 'CANCELADO':
            raise BusinessRuleError("El pedido está CANCELADO y no permite cambios.")
        
        mapa_estados = {
            'id_estado_general': ('estado_general', 'GENERAL', EstadoPedido),
            'id_estado_credito': ('estado_credito', 'CREDITO', EstadoAprobacionCredito),
            'id_estado_logistico': ('estado_logistico', 'LOGISTICO', EstadoLogistico),
        }

        try:
            for id_field, (relacion_attr, tipo_estado, ModeloEstado) in mapa_estados.items():
                if id_field in data and data[id_field] is not None:
                    nuevo_id = data[id_field]
                    relacion_actual = getattr(pedido, relacion_attr)

                    if getattr(pedido, id_field) == nuevo_id:
                        continue

                    estado_anterior_nombre = relacion_actual.nombre_estado if relacion_actual else "N/A"
                    
                    nuevo_estado_obj = ModeloEstado.query.get(nuevo_id)
                    if not nuevo_estado_obj:
                        raise RelatedResourceNotFoundError(f"El estado con ID {nuevo_id} no existe para el tipo {tipo_estado}.")
                    
                    if id_field == 'id_estado_logistico':
                        PedidoService.validar_transicion_logistica(relacion_actual, nuevo_estado_obj)
                    
                    setattr(pedido, id_field, nuevo_id)
                    cambios.append({
                        "estado_anterior": estado_anterior_nombre,
                        "estado_nuevo": nuevo_estado_obj.nombre_estado,
                        "tipo_estado": tipo_estado,
                    })

                    # --- LÓGICA DE NEGOCIO AUTOMÁTICA ---
                    # Si el estado de CRÉDITO cambia a APROBADO...
                    if id_field == 'id_estado_credito' and nuevo_estado_obj.codigo_estado == 'APROBADO':
                        # Exigir y setear número de pedido SAP si viene en payload
                        numero_pedido_sap = (data.get('numero_pedido_sap') or '').strip()
                        if not numero_pedido_sap:
                            raise BusinessRuleError("Debe indicar 'numero_pedido_sap' al aprobar el crédito.")
                        pedido.numero_pedido_sap = numero_pedido_sap
                        # 1) Estado GENERAL pasa a EN_PROCESO si aún no lo está
                        if not pedido.estado_general or pedido.estado_general.codigo_estado != 'EN_PROCESO':
                            estado_en_proceso = EstadoPedido.query.filter_by(codigo_estado='EN_PROCESO').first()
                            if estado_en_proceso:
                                estado_anterior_general = pedido.estado_general.nombre_estado if pedido.estado_general else 'N/A'
                                pedido.id_estado_general = estado_en_proceso.id_estado
                                cambios.append({
                                    "estado_anterior": estado_anterior_general,
                                    "estado_nuevo": estado_en_proceso.nombre_estado,
                                    "tipo_estado": "GENERAL",
                                })

                        # 2) y si no hay estado logístico, inicia PENDIENTE_WMS
                        if pedido.id_estado_logistico is None:
                            estado_pendiente_wms = EstadoLogistico.query.filter_by(codigo_estado='PENDIENTE_WMS').first()
                            if estado_pendiente_wms:
                                pedido.id_estado_logistico = estado_pendiente_wms.id_estado
                                cambios.append({
                                    "estado_anterior": "N/A",
                                    "estado_nuevo": estado_pendiente_wms.nombre_estado,
                                    "tipo_estado": "LOGISTICO",
                                })

            if not cambios:
                raise BusinessRuleError("No se especificó ningún cambio de estado válido.")

            fecha_evento = data['fecha_evento']

            for cambio in cambios:
                # Creamos una observación genérica si no viene una específica para el cambio automático.
                observacion = data.get('observaciones')
                if cambio['tipo_estado'] == 'LOGISTICO' and cambio['estado_anterior'] == 'N/A':
                    observacion = "Inicio automático del flujo logístico tras aprobación de crédito."

                historial = HistorialEstadoPedido(
                    id_pedido=pedido.id_pedido,
                    id_usuario_responsable=user_id_responsable,
                    observaciones=observacion,
                    fecha_evento=fecha_evento,
                    **cambio 
                )
                db.session.add(historial)

            db.session.commit()
            return PedidoService.get_pedido_by_id(pedido_id)

        except (RelatedResourceNotFoundError, BusinessRuleError) as e:
            db.session.rollback()
            raise e
        except Exception as e:
            db.session.rollback()
            raise BusinessRuleError(f"Error interno al actualizar el estado: {str(e)}")


    @staticmethod
    def validar_transicion_logistica(estado_actual, estado_nuevo):
        """
        Valida que la transición entre estados logísticos siga el flujo definido.
        """
        flujo_permitido = {
            # Desde un estado NULO (el inicio), solo se puede pasar a PENDIENTE_WMS.
            None: ['PENDIENTE_WMS'],
            'PENDIENTE_WMS': ['CREADO'],
            'CREADO': ['LIBERADO'],
            'LIBERADO': ['PICKING'],
            'PICKING': ['EMBALAJE'],
            'EMBALAJE': ['ANDEN'],
            'ANDEN': ['DESPACHADO'],
            'DESPACHADO': ['ENTREGADO']
        }

        codigo_actual = estado_actual.codigo_estado if estado_actual else None

        # Verificamos si la transición es válida según nuestro mapa de flujo.
        if codigo_actual not in flujo_permitido or estado_nuevo.codigo_estado not in flujo_permitido[codigo_actual]:
            raise BusinessRuleError(f"Transición no permitida: de '{codigo_actual or 'N/A'}' a '{estado_nuevo.codigo_estado}'.")

    @staticmethod
    def get_pedidos_cutoff_window(target_date: datetime, cutoff_hour: int):
        """
        Retorna pedidos entre (día_anterior HH:00) y (día_target (HH-1):59) considerando cutoff_hour.
        La ventana es: (target_date - 1 día, cutoff_hour:00:00) -> (target_date, cutoff_hour-1:59:59).
        Para cutoff 12: 12:00 del día anterior hasta 11:59 del día target.
        """
        from datetime import timedelta

        cutoff_hour = int(cutoff_hour)
        # inicio: día anterior a target a las cutoff_hour:00:00
        start_dt = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0) - timedelta(days=1)
        start_dt = start_dt.replace(hour=cutoff_hour, minute=0, second=0, microsecond=0)

        # fin: día target a las cutoff_hour-1:59:59 (si cutoff 0 no es válido, asumimos >=1)
        end_hour = (cutoff_hour - 1) % 24
        end_dt = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
        end_dt = end_dt.replace(hour=end_hour, minute=59, second=59, microsecond=999999)

        return Pedido.query.options(
            joinedload(Pedido.detalles)
        ).filter(Pedido.fecha_creacion >= start_dt, Pedido.fecha_creacion <= end_dt).order_by(Pedido.fecha_creacion.asc()).all()

    @staticmethod
    def marcar_facturado(pedido_id: int, data: dict, user_id_responsable: int):
        """
        Registra la facturación del pedido. Acepta factura manual o número SAP.
        Agrega un registro en el historial (tipo GENERAL) con la observación provista.
        """
        pedido = Pedido.query.get_or_404(pedido_id)

        factura_manual: bool = data.get('factura_manual', False)
        numero_factura_sap = data.get('numero_factura_sap')
        fecha_facturacion = data.get('fecha_facturacion') or datetime.utcnow()
        observaciones = data.get('observaciones')

        if not factura_manual and not numero_factura_sap:
            raise BusinessRuleError("Debe indicar 'factura_manual' o proporcionar 'numero_factura_sap'.")

        try:
            pedido.factura_manual = factura_manual
            pedido.numero_factura_sap = numero_factura_sap
            pedido.fecha_facturacion = fecha_facturacion

            historial = HistorialEstadoPedido(
                id_pedido=pedido.id_pedido,
                id_usuario_responsable=user_id_responsable,
                fecha_evento=fecha_facturacion,
                estado_anterior='N/A',
                estado_nuevo='FACTURADO',
                tipo_estado='GENERAL',
                observaciones=observaciones
            )
            db.session.add(historial)

            db.session.commit()
            return PedidoService.get_pedido_by_id(pedido_id)
        except Exception as e:
            db.session.rollback()
            raise BusinessRuleError(f"Error al registrar facturación: {str(e)}")

    @staticmethod
    def marcar_entregado(pedido_id: int, data: dict, user_id_responsable: int):
        """
        Marca el pedido como ENTREGADO en el flujo logístico, validando que el estado
        actual sea DESPACHADO y registrando el cambio en el historial.
        """
        pedido = Pedido.query.get_or_404(pedido_id)

        if not pedido.estado_logistico or pedido.estado_logistico.codigo_estado != 'DESPACHADO':
            raise BusinessRuleError("Solo se puede marcar ENTREGADO un pedido en estado 'DESPACHADO'.")

        estado_entregado = EstadoLogistico.query.filter_by(codigo_estado='ENTREGADO').first()
        if not estado_entregado:
            raise RelatedResourceNotFoundError("No se encontró el estado logístico 'ENTREGADO'.")

        fecha_evento = data['fecha_evento']
        observaciones = data.get('observaciones')

        try:
            estado_anterior_nombre = pedido.estado_logistico.nombre_estado if pedido.estado_logistico else 'N/A'
            pedido.id_estado_logistico = estado_entregado.id_estado

            historial = HistorialEstadoPedido(
                id_pedido=pedido.id_pedido,
                id_usuario_responsable=user_id_responsable,
                fecha_evento=fecha_evento,
                estado_anterior=estado_anterior_nombre,
                estado_nuevo=estado_entregado.nombre_estado,
                tipo_estado='LOGISTICO',
                observaciones=observaciones
            )
            db.session.add(historial)

            # Además, el estado GENERAL pasa a COMPLETADO
            estado_completado = EstadoPedido.query.filter_by(codigo_estado='COMPLETADO').first()
            if estado_completado:
                estado_anterior_general = pedido.estado_general.nombre_estado if pedido.estado_general else 'NUEVO'
                pedido.id_estado_general = estado_completado.id_estado
                historial_general = HistorialEstadoPedido(
                    id_pedido=pedido.id_pedido,
                    id_usuario_responsable=user_id_responsable,
                    fecha_evento=fecha_evento,
                    estado_anterior=estado_anterior_general,
                    estado_nuevo=estado_completado.nombre_estado,
                    tipo_estado='GENERAL',
                    observaciones='Entrega confirmada por logística.'
                )
                db.session.add(historial_general)

            db.session.commit()
            return PedidoService.get_pedido_by_id(pedido_id)
        except (BusinessRuleError, RelatedResourceNotFoundError) as e:
            db.session.rollback()
            raise e
        except Exception as e:
            db.session.rollback()
            raise BusinessRuleError(f"Error al marcar entrega: {str(e)}")

    @staticmethod
    def update_cantidades_detalle(pedido_id: int, detalles_actualizados: list, user_id_responsable: int):
        pedido = Pedido.query.get_or_404(pedido_id)

        for item_data in detalles_actualizados:
            detalle = PedidoDetalle.query.filter_by(
                id_pedido=pedido_id,
                id_pedido_detalle=item_data['id_pedido_detalle']
            ).first()

            if detalle:
                if 'cantidad_enviada' in item_data:
                    detalle.cantidad_enviada = item_data['cantidad_enviada']
                if 'cantidad_recibida' in item_data:
                    detalle.cantidad_recibida = item_data['cantidad_recibida']
                if 'observacion_linea' in item_data:
                    detalle.observacion_linea = item_data['observacion_linea']

        # Registrar en el historial que se modificaron las cantidades
        historial = HistorialEstadoPedido(
            id_pedido=pedido.id_pedido,
            id_usuario_responsable=user_id_responsable,
            fecha_evento=datetime.utcnow(),
            estado_anterior="N/A",
            estado_nuevo="MODIFICACION_CANTIDADES",
            tipo_estado="LOGISTICO",
            observaciones="Se actualizaron las cantidades de los productos."
        )
        db.session.add(historial)
        db.session.commit()
        return pedido