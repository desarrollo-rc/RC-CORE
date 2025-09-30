# backend/app/api/v1/schemas/pedidos_schemas.py
from marshmallow import Schema, fields, validate, ValidationError, validates
from .usuario_schemas import UsuarioSimpleSchema
from .cliente_schemas import ClienteResponseSchema

class EstadoPedidoSchema(Schema):
    codigo_estado = fields.Str()
    nombre_estado = fields.Str()

class EstadoAprobacionCreditoSchema(Schema):
    codigo_estado = fields.Str()
    nombre_estado = fields.Str()

class EstadoLogisticoSchema(Schema):
    codigo_estado = fields.Str()
    nombre_estado = fields.Str()

class ProductoSimpleSchema(Schema):
    producto_sku = fields.Str(attribute="sku")
    producto_nombre = fields.Str(attribute="nombre_producto")

class PedidoDetalleResponseSchema(Schema):
    id_producto = fields.Int()
    cantidad = fields.Int()
    precio_unitario = fields.Decimal(as_string=True, places=2)
    subtotal = fields.Decimal(as_string=True, places=2)
    
    # Añadimos datos del producto para enriquecer la respuesta
    producto = fields.Nested(ProductoSimpleSchema, attribute="producto")

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

class PedidoCreateSchema(Schema):
    codigo_pedido_origen = fields.Str(allow_none=True)
    id_cliente = fields.Int(required=True)
    id_canal_venta = fields.Int(required=True)
    id_usuario_b2b = fields.Int(allow_none=True)
    id_vendedor = fields.Int(allow_none=True)
    detalles = fields.List(fields.Nested(PedidoDetalleCreateSchema), required=True, validate=validate.Length(min=1))
    aprobacion_automatica = fields.Bool(load_default=False)

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

    @validates('id_estado_general')
    def validate_estado_general(self, value):
        if value is not None and not isinstance(value, int):
            raise ValidationError('id_estado_general debe ser un entero.')

    @validates('id_estado_credito')
    def validate_estado_credito(self, value):
        if value is not None and not isinstance(value, int):
            raise ValidationError('id_estado_credito debe ser un entero.')

    @validates('id_estado_logistico')
    def validate_estado_logistico(self, value):
        if value is not None and not isinstance(value, int):
            raise ValidationError('id_estado_logistico debe ser un entero.')