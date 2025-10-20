# backend/app/models/negocio/pedidos.py
from app.extensions import db
from sqlalchemy.sql import func
from app.models.entidades.entidades_auxiliares import MixinAuditoria

class EstadoPedido(db.Model, MixinAuditoria):
    __tablename__ = 'estados_pedido'
    __table_args__ = {'schema': 'negocio', 'comment': 'Estados generales de los pedidos'}
    id_estado = db.Column(db.Integer, primary_key=True)
    codigo_estado = db.Column(db.String(50), unique=True, nullable=False)
    nombre_estado = db.Column(db.String(100), nullable=False)
    descripcion_estado = db.Column(db.String(255), nullable=True)

class EstadoAprobacionCredito(db.Model, MixinAuditoria):
    __tablename__ = 'estados_credito'
    __table_args__ = {'schema': 'negocio', 'comment': 'Estados de la aprobación de crédito'}
    id_estado = db.Column(db.Integer, primary_key=True)
    codigo_estado = db.Column(db.String(50), unique=True, nullable=False)
    nombre_estado = db.Column(db.String(100), nullable=False)
    descripcion_estado = db.Column(db.String(255), nullable=True)

class EstadoLogistico(db.Model, MixinAuditoria):
    __tablename__ = 'estados_logisticos'
    __table_args__ = {'schema': 'negocio', 'comment': 'Estados del flujo logístico'}
    id_estado = db.Column(db.Integer, primary_key=True)
    codigo_estado = db.Column(db.String(50), unique=True, nullable=False)
    nombre_estado = db.Column(db.String(100), nullable=False)
    descripcion_estado = db.Column(db.String(255), nullable=True)

class Pedido(db.Model, MixinAuditoria):
    __tablename__ = 'pedidos'
    __table_args__ = {'schema': 'negocio', 'comment': 'Encabezado y estado de los pedidos'}

    id_pedido = db.Column(db.Integer, primary_key=True)

    codigo_pedido_origen = db.Column(db.String(50), nullable=True, index=True) # De momento si el pedido no es B2B este campo es NULL
    numero_pedido_sap = db.Column(db.String(50), nullable=True, index=True)
    numero_factura_sap = db.Column(db.String(50), nullable=True, index=True)
    ruta_pdf = db.Column(db.String(500), nullable=True, comment="Ruta del PDF extraído de Gmail")

    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), nullable=False)
    id_usuario_b2b = db.Column(db.Integer, db.ForeignKey('entidades.usuarios_b2b.id_usuario_b2b'), nullable=True, comment="Si el pedido fue creado por un usuario B2B")
    id_vendedor = db.Column(db.Integer, db.ForeignKey('negocio.vendedores.id_vendedor'), nullable=True)
    id_canal_venta = db.Column(db.Integer, db.ForeignKey('negocio.canales_venta.id_canal'), nullable=False)

    cliente = db.relationship('MaestroClientes')
    usuario_b2b = db.relationship('UsuarioB2B')
    vendedor = db.relationship('Vendedor')
    canal_venta = db.relationship('CanalVenta')

    id_estado_general = db.Column(db.Integer, db.ForeignKey('negocio.estados_pedido.id_estado'), nullable=False)
    id_estado_credito = db.Column(db.Integer, db.ForeignKey('negocio.estados_credito.id_estado'), nullable=False)
    id_estado_logistico = db.Column(db.Integer, db.ForeignKey('negocio.estados_logisticos.id_estado'), nullable=True)

    estado_general = db.relationship('EstadoPedido')
    estado_credito = db.relationship('EstadoAprobacionCredito')
    estado_logistico = db.relationship('EstadoLogistico')

    monto_neto = db.Column(db.Numeric(15, 2), nullable=False)
    monto_impuestos = db.Column(db.Numeric(15, 2), nullable=False)
    monto_total = db.Column(db.Numeric(15, 2), nullable=False)

    factura_manual = db.Column(db.Boolean, nullable=True, comment="True si la factura fue manual, False si fue automática")
    fecha_facturacion = db.Column(db.DateTime, nullable=True)

    detalles = db.relationship('PedidoDetalle', back_populates='pedido', cascade="all, delete-orphan")
    historial_estados = db.relationship('HistorialEstadoPedido', back_populates='pedido', cascade="all, delete-orphan")

    @property
    def sku_count(self):
        """Cantidad de SKU únicos en el pedido."""
        return len(set(d.id_producto for d in self.detalles))

    @property
    def total_unidades(self):
        """Total de unidades en el pedido."""
        return sum(d.cantidad for d in self.detalles)

    @property
    def tipo(self):
        """
        Clasifica el pedido como RIFLEO o MAYORISTA.
        RIFLEO: hasta 6 SKU y máximo 1 unidad por SKU
        MAYORISTA: cualquier otro caso
        """
        es_rifleo = self.sku_count <= 6 and all(d.cantidad <= 1 for d in self.detalles)
        return "RIFLEO" if es_rifleo else "MAYORISTA"

    @property
    def puede_despachar(self):
        return self.numero_factura_sap is not None or self.factura_manual is not None
        
    def __repr__(self):
        return f'<Pedido {self.codigo_pedido_origen} - Cliente {self.id_cliente}>'

class PedidoDetalle(db.Model):
    __tablename__ = 'pedidos_detalle'
    __table_args__ = {'schema': 'negocio', 'comment': 'Lineas de productos para cada pedido'}

    id_pedido_detalle = db.Column(db.Integer, primary_key=True)

    id_pedido = db.Column(db.Integer, db.ForeignKey('negocio.pedidos.id_pedido'), nullable=False, index=True)
    id_producto = db.Column(db.Integer, db.ForeignKey('productos.maestro_productos.id_producto'), nullable=False)

    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(15, 2), nullable=False)
    descuento_aplicado = db.Column(db.Numeric(10, 2), default=0.0)
    subtotal = db.Column(db.Numeric(15, 2), nullable=False)

    cantidad_enviada = db.Column(db.Integer, nullable=True)
    cantidad_recibida = db.Column(db.Integer, nullable=True)
    observacion_linea = db.Column(db.String(255), nullable=True)

    pedido = db.relationship('Pedido', back_populates='detalles')
    producto = db.relationship('MaestroProductos')

    def __repr__(self):
        return f'<PedidoDetalle {self.id_pedido} - Producto {self.id_producto}>'

class HistorialEstadoPedido(db.Model):
    __tablename__ = 'historial_estados_pedido'
    __table_args__ = {'schema': 'negocio', 'comment': 'Log de auditoría para cada cambio de estado del pedido'}

    id_historial = db.Column(db.Integer, primary_key=True)
    id_pedido = db.Column(db.Integer, db.ForeignKey('negocio.pedidos.id_pedido'), nullable=False, index=True)

    fecha_evento = db.Column(db.DateTime, nullable=False)
    id_usuario_responsable = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=True, comment="Usuario interno que gatilló el cambio")

    estado_anterior = db.Column(db.String(50), nullable=True)
    estado_nuevo = db.Column(db.String(50), nullable=False)
    tipo_estado = db.Column(db.String(30), nullable=False, comment="Ej: 'CREDITO', 'LOGISTICO', 'GENERAL'")

    observaciones = db.Column(db.Text, nullable=True, comment="Ej: 'Cliente paga por adelantado', 'Ruta de despacho reprogramada'")

    pedido = db.relationship('Pedido', back_populates='historial_estados')
    usuario_responsable = db.relationship('Usuario')

    def __repr__(self):
        return f'<Historial Pedido:{self.id_pedido} de {self.estado_anterior} a {self.estado_nuevo}>'