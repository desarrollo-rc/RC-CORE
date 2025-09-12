# backend/app/api/v1/services/pedidos_service.py
from app.extensions import db
from app.models.negocio.pedidos import Pedido, PedidoDetalle, HistorialEstadoPedido
from app.models.entidades import MaestroClientes, UsuarioB2B
from app.models.productos import MaestroProductos
from app.models.negocio import CanalVenta, Vendedor
from app.api.v1.utils.errors import BusinessRuleError, RelatedResourceNotFoundError, ResourceConflictError

class PedidoService:

    @staticmethod
    def get_all_pedidos(page, per_page, **filters):
        # --- INICIO DE LA MODIFICACIÓN ---
        query = Pedido.query

        # Aplicar filtros dinámicamente
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
        return Pedido.query.get_or_404(pedido_id)

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
        
        try:
            if data.get('codigo_pedido_origen'):
                nuevo_pedido = Pedido(
                    codigo_pedido_origen=data['codigo_pedido_origen'],
                    id_cliente=data['id_cliente'],
                    id_canal_venta=data['id_canal_venta'],
                    id_vendedor=data.get('id_vendedor'),
                    id_usuario_b2b=data.get('id_usuario_b2b'),
                    id_estado_general=1,
                    id_estado_credito=1,
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

            monto_neto = 0

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
            nuevo_pedido.monto_impuestos = monto_neto * 0.19
            nuevo_pedido.monto_total = monto_neto * 1.19

            db.session.add(nuevo_pedido)
            db.session.flush()

            historial = HistorialEstadoPedido(
                id_pedido = nuevo_pedido.id_pedido,
                estado_nuevo = "PENDIENTE",
                tipo_estado = "GENERAL",
                id_usuario_responsable = user_id_creador,
                observaciones="Pedido creado desde el canal B2B."
            )
            db.session.add(historial)

            db.session.commit()
            return nuevo_pedido
        except Exception as e:
            db.session.rollback()
            raise BusinessRuleError(f"Error al crear el pedido: {e}")

    @staticmethod
    def update_estado(pedido_id, data, user_id_responsable):
        pedido = PedidoService.get_pedido_by_id(pedido_id)
        
        cambios = [] # Para registrar qué cambió

        # Mapeo de campos de ID a sus relaciones y tipo de estado
        mapa_estados = {
            'id_estado_general': (pedido.estado_general, 'GENERAL'),
            'id_estado_credito': (pedido.estado_credito, 'CREDITO'),
            'id_estado_logistico': (pedido.estado_logistico, 'LOGISTICO'),
        }

        try:
            for id_field, (relacion, tipo) in mapa_estados.items():
                if id_field in data and data[id_field] is not None:
                    estado_anterior_obj = relacion
                    estado_anterior_nombre = estado_anterior_obj.nombre_estado if estado_anterior_obj else "N/A"
                    
                    nuevo_id = data[id_field]
                    
                    # Actualizar el ID en el pedido
                    setattr(pedido, id_field, nuevo_id)
                    db.session.flush() # Forzamos la actualización para que la relación se refresque

                    estado_nuevo_obj = getattr(pedido, id_field.replace('id_', ''))
                    estado_nuevo_nombre = estado_nuevo_obj.nombre_estado if estado_nuevo_obj else "N/A"

                    # Solo registrar si hubo un cambio real
                    if estado_anterior_nombre != estado_nuevo_nombre:
                        cambios.append({
                            "estado_anterior": estado_anterior_nombre,
                            "estado_nuevo": estado_nuevo_nombre,
                            "tipo_estado": tipo,
                        })

            if not cambios:
                raise BusinessRuleError("No se especificó ningún cambio de estado válido.")

            # Crear registros en el historial para cada cambio
            for cambio in cambios:
                historial = HistorialEstadoPedido(
                    id_pedido=pedido.id_pedido,
                    id_usuario_responsable=user_id_responsable,
                    observaciones=data['observaciones'],
                    **cambio
                )
                db.session.add(historial)

            db.session.commit()
            return pedido

        except Exception as e:
            db.session.rollback()
            raise BusinessRuleError(f"Error al actualizar el estado: {e}")