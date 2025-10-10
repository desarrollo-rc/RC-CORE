# backend/app/api/v1/schemas/pedidos_schemas.py
from marshmallow import Schema, fields, validate, ValidationError, validates, validates_schema
from .usuario_schemas import UsuarioSimpleSchema
from .cliente_schemas import ClienteResponseSchema
from ....models.negocio.pedidos import EstadoAprobacionCredito, EstadoLogistico, EstadoPedido
from ....extensions import db


class EstadoPedidoSchema(Schema):
    id_estado = fields.Int(dump_only=True)
    codigo_estado = fields.Str(allow_none=True)
    nombre_estado = fields.Str(allow_none=True)

class EstadoAprobacionCreditoSchema(Schema):
    id_estado = fields.Int(dump_only=True)
    codigo_estado = fields.Str(allow_none=True)
    nombre_estado = fields.Str(allow_none=True)

class EstadoLogisticoSchema(Schema):
    id_estado = fields.Int(dump_only=True)
    codigo_estado = fields.Str(allow_none=True)
    nombre_estado = fields.Str(allow_none=True)

class ProductoSimpleSchema(Schema):
    producto_sku = fields.Str(attribute="sku")
    producto_nombre = fields.Str(attribute="nombre_producto")

class PedidoDetalleResponseSchema(Schema):
    id_producto = fields.Int()
    cantidad = fields.Int()
    precio_unitario = fields.Decimal(as_string=True, places=2)
    subtotal = fields.Decimal(as_string=True, places=2)
    
    cantidad_enviada = fields.Int(allow_none=True)
    cantidad_recibida = fields.Int(allow_none=True)
    observacion_linea = fields.Str(allow_none=True)

    producto = fields.Nested(ProductoSimpleSchema, attribute="producto")

class PedidoDetalleUpdateCantidadesSchema(Schema):
    """Schema para validar cada línea de producto que se actualiza."""
    id_pedido_detalle = fields.Int(required=True)
    cantidad_enviada = fields.Int(required=False, allow_none=True, validate=validate.Range(min=0))
    cantidad_recibida = fields.Int(required=False, allow_none=True, validate=validate.Range(min=0))
    observacion_linea = fields.Str(required=False, allow_none=True, validate=validate.Length(max=255))

class PedidoUpdateCantidadesSchema(Schema):
    """Schema principal para validar el payload de la ruta /cantidades."""
    detalles = fields.List(
        fields.Nested(PedidoDetalleUpdateCantidadesSchema), 
        required=True, 
        validate=validate.Length(min=1)
    )

class HistorialEstadoPedidoSchema(Schema):
    fecha_evento = fields.DateTime()
    estado_anterior = fields.Str()
    estado_nuevo = fields.Str()
    tipo_estado = fields.Str()
    observaciones = fields.Str()
    usuario_responsable = fields.Nested(UsuarioSimpleSchema)

class PedidoDetalleCreateSchema(Schema):
    id_producto = fields.Int(required=True)
    cantidad = fields.Int(required=True, validate=validate.Range(min=1))
    precio_unitario = fields.Decimal(required=True, validate=validate.Range(min=0))

class PedidoCreateSchema(Schema):
    codigo_pedido_origen = fields.Str(allow_none=True)
    id_cliente = fields.Int(required=True)
    id_canal_venta = fields.Int(required=True)
    id_usuario_b2b = fields.Int(allow_none=True)
    id_vendedor = fields.Int(allow_none=True)
    detalles = fields.List(fields.Nested(PedidoDetalleCreateSchema), required=True, validate=validate.Length(min=1))
    aprobacion_automatica = fields.Bool(load_default=False)
    numero_pedido_sap = fields.Str(allow_none=True)
    fecha_evento = fields.DateTime(required=True)

    @validates_schema
    def validate_numero_pedido_sap_on_auto(self, data, **kwargs):
        if data.get('aprobacion_automatica'):
            num = (data.get('numero_pedido_sap') or '').strip()
            if not num:
                raise ValidationError({'numero_pedido_sap': ['Debe indicar el número de orden SAP cuando la aprobación es automática.']})

class PedidoResponseSchema(Schema):
    id_pedido = fields.Int()
    codigo_pedido_origen = fields.Str()
    numero_pedido_sap = fields.Str()
    numero_factura_sap = fields.Str()
    
    cliente = fields.Nested(lambda: ClienteResponseSchema(only=("id_cliente", "codigo_cliente", "nombre_cliente")))
    
    estado_general = fields.Nested(EstadoPedidoSchema)
    estado_credito = fields.Nested(EstadoAprobacionCreditoSchema)
    estado_logistico = fields.Nested(EstadoLogisticoSchema)
    
    monto_neto = fields.Decimal(as_string=True, places=2)
    monto_impuestos = fields.Decimal(as_string=True, places=2)
    monto_total = fields.Decimal(as_string=True, places=2)

    fecha_creacion = fields.DateTime()
    fecha_modificacion = fields.DateTime()
    
    detalles = fields.List(fields.Nested(PedidoDetalleResponseSchema))
    historial_estados = fields.List(fields.Nested(HistorialEstadoPedidoSchema))

class PedidoListResponseSchema(Schema):
    """Schema simplificado para listas de pedidos."""
    id_pedido = fields.Int()
    codigo_pedido_origen = fields.Str()
    numero_pedido_sap = fields.Str()
    numero_factura_sap = fields.Str()
    cliente_nombre = fields.Str(attribute="cliente.nombre_cliente")
    fecha_creacion = fields.DateTime()
    monto_total = fields.Decimal(as_string=True, places=2)
    estado_general = fields.Nested(EstadoPedidoSchema)

class PedidoUpdateEstadoSchema(Schema):
    id_estado_general = fields.Int()
    id_estado_credito = fields.Int()
    id_estado_logistico = fields.Int()
    observaciones = fields.Str(required=True, validate=validate.Length(min=5))
    fecha_evento = fields.DateTime(required=True)
    numero_pedido_sap = fields.Str(allow_none=True)

    @validates('id_estado_credito')
    def validate_estado_credito(self, value, **kwargs):
        if value is not None and not db.session.get(EstadoAprobacionCredito, value):
            raise ValidationError(f"El estado de crédito con ID {value} no existe.")

    @validates('id_estado_logistico')
    def validate_estado_logistico(self, value, **kwargs):
        if value is not None and not db.session.get(EstadoLogistico, value):
            raise ValidationError(f"El estado logístico con ID {value} no existe.")

    @validates('id_estado_general')
    def validate_estado_general(self, value, **kwargs):
        if value is not None and not db.session.get(EstadoPedido, value):
            raise ValidationError(f"El estado general con ID {value} no existe.")

    @validates_schema
    def validate_numero_sap_when_approving(self, data, **kwargs):
        id_estado_credito = data.get('id_estado_credito')
        if id_estado_credito is None:
            return
        estado = db.session.get(EstadoAprobacionCredito, id_estado_credito)
        if estado and getattr(estado, 'codigo_estado', None) == 'APROBADO':
            num = (data.get('numero_pedido_sap') or '').strip()
            if not num:
                raise ValidationError({'numero_pedido_sap': ['Debe indicar el número de orden SAP al aprobar crédito.']})

class PedidoFacturadoSchema(Schema):
    factura_manual = fields.Bool(required=True)
    numero_factura_sap = fields.Str(required=False, allow_none=True)
    fecha_facturacion = fields.DateTime(required=False, allow_none=True)
    observaciones = fields.Str(required=False, allow_none=True)

class PedidoEntregadoSchema(Schema):
    fecha_evento = fields.DateTime(required=True)
    observaciones = fields.Str(required=False, allow_none=True)