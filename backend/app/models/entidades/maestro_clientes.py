from app.extensions import db
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
from app.models.entidades.entidades_auxiliares import cliente_empresa

class MaestroClientes(db.Model):
    __tablename__ = 'maestro_clientes'
    __table_args__ = {'schema': 'entidades', 'comment': 'Tabla central de clientes'}

    # --- Llave Primaria ---
    id_cliente = db.Column(db.Integer, primary_key=True) # Llave primaria de la tabla.

    # --- Datos del Cliente ---
    codigo_cliente = db.Column(db.String(30), unique=True, nullable=False, index=True) # Código del cliente. (C12345678-9)
    rut_cliente = db.Column(db.String(15), unique=True, nullable=False, index=True) # Rut del cliente. (12345678-9)
    nombre_cliente = db.Column(db.String(100), nullable=False, index=True) # Nombre del cliente. (Repuesto Center S.A.)
    giro_economico = db.Column(db.String(100)) # Giro económico del cliente. (Repuestos, Servicios, etc)


    # --- Datos Financieros ---
    descuento_base = db.Column(db.Numeric(10, 2), server_default='0.0')
    linea_credito = db.Column(db.Numeric(10, 2), server_default='0.0')

    # --- Banderas de Estado ---
    activo = db.Column(db.Boolean, default=True, nullable=False, comment='Cliente activo para operar. Si es False, revisar motivo_bloqueo.')
    motivo_bloqueo = db.Column(db.String(255), nullable=True, comment='Causa del bloqueo. Si activo = True, este campo debe ser NULO.')
    b2b_habilitado = db.Column(db.Boolean, default=False, nullable=False, comment='Si la empresa cliente tiene acceso al portal B2B.')
    es_vip = db.Column(db.Boolean, default=False, nullable=False, comment='Si el cliente es VIP.')
    
    # --- Llaves Foráneas ---
    id_tipo_cliente = db.Column(db.Integer, db.ForeignKey('entidades.tipos_cliente.id_tipo_cliente'), nullable=False)
    id_segmento_cliente = db.Column(db.Integer, db.ForeignKey('entidades.segmentos_cliente.id_segmento_cliente'), nullable=False)
    id_tipo_negocio = db.Column(db.Integer, db.ForeignKey('entidades.tipo_negocio.id_tipo_negocio'), nullable=False)
    id_lista_precios = db.Column(db.Integer, db.ForeignKey('entidades.listas_precios.id_lista_precios'), nullable=False)
    id_condicion_pago = db.Column(db.Integer, db.ForeignKey('entidades.condiciones_pago.id_condicion_pago'))
    id_usuario_creacion = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=False)
    id_vendedor = db.Column(db.Integer, db.ForeignKey('negocio.vendedores.id_vendedor'))

    # --- Relaciones ---
    tipo_cliente = db.relationship('TipoCliente', back_populates='clientes')
    segmento_cliente = db.relationship('SegmentoCliente', back_populates='clientes')
    tipo_negocio = db.relationship('TipoNegocio', back_populates='clientes')
    lista_precios = db.relationship('ListaPrecios', back_populates='clientes')
    condicion_pago = db.relationship('CondicionPago', back_populates='clientes')
    empresas = db.relationship('Empresa', secondary=cliente_empresa, back_populates='clientes')

    # Relaciona al cliente con sus personas de contacto (administrativos, técnicos, etc.). Pieza clave para la gestión de relaciones.
    contactos = db.relationship('Contacto', back_populates='cliente', cascade="all, delete-orphan")
    
    # Relación genérica a todas las direcciones del cliente.
    # La lógica de negocio filtrará por tipo de dirección (ej. 'FACTURACION', 'DESPACHO', etc)
    direcciones = db.relationship('Direccion', back_populates='cliente', cascade="all, delete-orphan")
    
    # Relaciona al cliente con sus usuarios de B2B.
    usuarios_b2b = db.relationship('UsuarioB2B', back_populates='cliente', cascade="all, delete-orphan")

    # Relación 1 a 1 con la tabla que almacena las metricas de comportamiento del cliente
    metricas = db.relationship('ClienteMetricas', back_populates='cliente', uselist=False, cascade="all, delete-orphan")


    creador = db.relationship('Usuario', foreign_keys=[id_usuario_creacion], back_populates='clientes_creados')
    vendedor = db.relationship('Vendedor', back_populates='clientes')
    
    # --- Auditoría ---
    fecha_creacion = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_modificacion = db.Column(db.DateTime, onupdate=func.now())

    def __repr__(self):
        return f'<Cliente {self.codigo_cliente}: {self.nombre_cliente}>'

    @hybrid_property
    def contacto_principal(self):
        """
        PROPIEDAD ESTRATÉGICA: Proporciona acceso directo e inmediato al punto de contacto
        principal de la empresa, simplificando la operación para ventas, soporte y administración.
        """
        # Filtra la lista de contactos en memoria para encontrar el contacto principal.
        for contacto in self.contactos:
            if contacto.es_principal:
                return contacto
        return None # Devuelve None si no hay un contacto principal definido.

    @hybrid_property
    def direccion_facturacion(self):
        """
        PROPIEDAD ESTRATÉGICA: Proporciona acceso directo e inmediato al domicilio fiscal único del cliente.
        """
        # Filtra la lista de direcciones en memoria para encontrar la dirección de facturación.
        for direccion in self.direcciones:
            if direccion.es_facturacion:
                return direccion
        return None # Devuelve None si no hay una dirección de facturación definida.