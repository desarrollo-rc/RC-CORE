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

class PedidoService:

    @staticmethod
    def get_all_pedidos(page, per_page, **filters):
        query = Pedido.query

        if filters.get('id_cliente'):
            query = query.filter(Pedido.id_cliente == filters['id_cliente'])
        if filters.get('id_estado_general'):
            query = query.filter(Pedido.id_estado_general == filters['id_estado_general'])
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
            joinedload(Pedido.detalles).joinedload(PedidoDetalle.producto),
            joinedload(Pedido.historial_estados).joinedload(HistorialEstadoPedido.usuario_responsable),
            joinedload(Pedido.estado_general),
            joinedload(Pedido.estado_credito),
            joinedload(Pedido.estado_logistico)
        ).get_or_404(pedido_id)

    @staticmethod
    def create_pedido(data, user_id_creador):
        if not MaestroClientes.query.get(data['id_cliente']):
            raise RelatedResourceNotFoundError(f"Cliente con ID {data['id_cliente']} no encontrado.")
        
        if not CanalVenta.query.get(data['id_canal_venta']):
            raise RelatedResourceNotFoundError(f"Canal de venta con ID {data['id_canal_venta']} no encontrado.")
        
        if data.get('id_vendedor') and not Vendedor.query.get(data['id_vendedor']):
             raise RelatedResourceNotFoundError(f"Vendedor con ID {data['id_vendedor']} no encontrado.")
        
        if data.get('id_usuario_b2b') and not UsuarioB2B.query.get(data['id_usuario_b2b']):
             raise RelatedResourceNotFoundError(f"Usuario B2B con ID {data['id_usuario_b2b']} no encontrado.")

        if data['codigo_pedido_origen'] and Pedido.query.filter_by(codigo_pedido_origen=data['codigo_pedido_origen']).first():
            raise ResourceConflictError(f"El código de pedido '{data['codigo_pedido_origen']}' ya está en uso.")
        aprobacion_automatica = data.get('aprobacion_automatica', False)
        if aprobacion_automatica:
            estado_credito_inicial = EstadoAprobacionCredito.query.filter_by(codigo_estado='APROBADO').first()
            observacion_historial = "Pedido creado con aprobación automática."
        else:
            estado_credito_inicial = EstadoAprobacionCredito.query.filter_by(codigo_estado='PENDIENTE').first()
            observacion_historial = "Pedido creado, pendiente de aprobación de crédito."

        if not estado_credito_inicial:
            raise BusinessRuleError("Los estados de crédito 'APROBADO' o 'PENDIENTE' no se encuentran en la base de datos.")
        try:
            if data.get('codigo_pedido_origen'):
                nuevo_pedido = Pedido(
                    codigo_pedido_origen=data['codigo_pedido_origen'],
                    id_cliente=data['id_cliente'],
                    id_canal_venta=data['id_canal_venta'],
                    id_vendedor=data.get('id_vendedor'),
                    id_usuario_b2b=data.get('id_usuario_b2b'),
                    id_estado_general=1,
                    id_estado_credito=estado_credito_inicial.id_estado,
                )
            else:
                nuevo_pedido = Pedido(
                    id_cliente=data['id_cliente'],
                    id_canal_venta=data['id_canal_venta'],
                    id_vendedor=data.get('id_vendedor'),
                    id_usuario_b2b=data.get('id_usuario_b2b'),
                    id_estado_general=1,
                    id_estado_credito=1,
                )

            monto_neto = Decimal('0.0')

            for item_data in data['detalles']:
                producto = MaestroProductos.query.get(item_data['id_producto'])
                if not producto:
                    raise RelatedResourceNotFoundError(f"Producto con ID {item_data['id_producto']} no encontrado.")
                
                precio_unitario = producto.costo_base
                subtotal = item_data['cantidad'] * precio_unitario

                detalle = PedidoDetalle(
                    id_producto = item_data['id_producto'],
                    cantidad = item_data['cantidad'],
                    precio_unitario = precio_unitario,
                    subtotal = subtotal
                )
                nuevo_pedido.detalles.append(detalle)
                monto_neto += subtotal
            
            nuevo_pedido.monto_neto = monto_neto
            nuevo_pedido.monto_impuestos = monto_neto * Decimal('0.19') 
            nuevo_pedido.monto_total = monto_neto * Decimal('1.19')    

            db.session.add(nuevo_pedido)
            db.session.flush()

            historial = HistorialEstadoPedido(
                id_pedido=nuevo_pedido.id_pedido,
                estado_nuevo=estado_credito_inicial.nombre_estado,
                tipo_estado="CREDITO",
                id_usuario_responsable=user_id_creador,
                observaciones=observacion_historial # <-- Usamos la observación dinámica
            )
            db.session.add(historial)

            db.session.commit()
            return nuevo_pedido
        except Exception as e:
            db.session.rollback()
            raise BusinessRuleError(f"Error al crear el pedido: {e}")

    @staticmethod
    def update_estado(pedido_id, data, user_id_responsable):
        # La validación de get_or_404 se encarga de errores de no encontrado
        pedido = Pedido.query.get_or_404(pedido_id)

        cambios = []
        
        # Mapa de campos de ID a sus relaciones, tipo y Modelo de la tabla de estados
        mapa_estados = {
            'id_estado_general': (pedido.estado_general, 'GENERAL', EstadoPedido),
            'id_estado_credito': (pedido.estado_credito, 'CREDITO', EstadoAprobacionCredito),
            'id_estado_logistico': (pedido.estado_logistico, 'LOGISTICO', EstadoLogistico),
        }

        try:
            for id_field, (relacion_actual, tipo_estado, ModeloEstado) in mapa_estados.items():
                if id_field in data and data[id_field] is not None:
                    nuevo_id = data[id_field]
                    
                    # Previene cambios si el estado ya es el actual
                    if getattr(pedido, id_field) == nuevo_id:
                        continue

                    # Obtiene el nombre del estado anterior de forma segura
                    estado_anterior_nombre = relacion_actual.nombre_estado if relacion_actual else "N/A"
                    
                    # Busca el nuevo estado en la BD para asegurar que existe
                    nuevo_estado_obj = ModeloEstado.query.get(nuevo_id)
                    if not nuevo_estado_obj:
                        raise RelatedResourceNotFoundError(f"El estado con ID {nuevo_id} no existe para el tipo {tipo_estado}.")
                    
                    # Asigna el nuevo ID de estado al pedido
                    setattr(pedido, id_field, nuevo_id)
                    
                    # Guarda los nombres (strings) para el historial
                    cambios.append({
                        "estado_anterior": estado_anterior_nombre,
                        "estado_nuevo": nuevo_estado_obj.nombre_estado,
                        "tipo_estado": tipo_estado,
                    })

            if not cambios:
                raise BusinessRuleError("No se especificó ningún cambio de estado válido o el estado ya era el actual.")

            for cambio in cambios:
                historial = HistorialEstadoPedido(
                    id_pedido=pedido.id_pedido,
                    id_usuario_responsable=user_id_responsable,
                    observaciones=data.get('observaciones', 'Sin observaciones.'),
                    fecha_evento=data['fecha_evento'],
                    # El operador ** desempaqueta el diccionario 'cambio' en argumentos
                    **cambio 
                )
                db.session.add(historial)

            # Guarda todos los cambios en la base de datos
            db.session.commit()
            
            # Devuelve el pedido recargado para asegurar que la respuesta contiene los datos actualizados
            return PedidoService.get_pedido_by_id(pedido_id)

        except (RelatedResourceNotFoundError, BusinessRuleError):
            db.session.rollback()
            # Relanza la excepción para que sea manejada por la ruta
            raise  
        except Exception as e:
            db.session.rollback()
            # Envuelve cualquier otra excepción en un BusinessRuleError
            raise BusinessRuleError(f"Error interno al actualizar el estado: {str(e)}")