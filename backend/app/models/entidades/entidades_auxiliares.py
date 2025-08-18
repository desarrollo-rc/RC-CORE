from app.extensions import db
from sqlalchemy.sql import func
from sqlalchemy.orm import validates

class MixinAuditoria:
    """
    Mixin para añadir campos de auditoría a los modelos.
    No es una tabla, es un molde que otros modelos pueden heredar
    """
    activo = db.Column(db.Boolean, default=True, nullable=False, comment='Permite desactivar un usuario sin borrarlo.')
    fecha_creacion = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_modificacion = db.Column(db.DateTime, onupdate=func.now())

class TipoCliente(db.Model, MixinAuditoria):
    __tablename__ = 'tipos_cliente'
    __table_args__ = {'schema': 'entidades', 'comment': 'Clasifica clientes por su naturaleza (Nacional, Extranjero, etc.)'}

    id_tipo_cliente = db.Column(db.Integer, primary_key=True)
    codigo_tipo_cliente = db.Column(db.String(20), unique=True, nullable=False, comment='Código del tipo de cliente (NAC, EXT, etc.)')
    nombre_tipo_cliente = db.Column(db.String(100), nullable=False)
    descripcion_tipo_cliente = db.Column(db.String(255), nullable=True)

    clientes = db.relationship('MaestroClientes', back_populates='tipo_cliente')

    @validates('codigo_tipo_cliente', 'nombre_tipo_cliente')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        if key == 'codigo_tipo_cliente':
            return value.upper().strip()
        return value.strip()

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_tipo_cliente=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<TipoCliente {self.nombre_tipo_cliente}>'

class SegmentoCliente(db.Model, MixinAuditoria):
    __tablename__ = 'segmentos_cliente'
    __table_args__ = {'schema': 'entidades', 'comment': 'Clasifica clientes por su segmento (Grandes, Medianos, Pequeños, etc.)'}

    id_segmento_cliente = db.Column(db.Integer, primary_key=True)
    codigo_segmento_cliente = db.Column(db.String(20), unique=True, nullable=False, comment='Código del segmento de cliente (SM, L, XL VOLUMEN, XL REPOSICION)')
    nombre_segmento_cliente = db.Column(db.String(100), nullable=False)
    descripcion_segmento_cliente = db.Column(db.String(255), nullable=True)

    clientes = db.relationship('MaestroClientes', back_populates='segmento_cliente')

    @validates('codigo_segmento_cliente', 'nombre_segmento_cliente')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        if key == 'codigo_segmento_cliente':
            return value.upper().strip()
        return value.strip()

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_segmento_cliente=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<SegmentoCliente {self.nombre_segmento_cliente}>'

class ListaPrecios(db.Model, MixinAuditoria):
    __tablename__ = 'listas_precios'
    __table_args__ = {'schema': 'entidades', 'comment': 'Almacena las listas de precios para cada cliente'}

    id_lista_precios = db.Column(db.Integer, primary_key=True)
    codigo_lista_precios = db.Column(db.String(20), unique=True, nullable=False, comment='Código de la lista de precios (Alpha, Beta, etc.)')
    nombre_lista_precios = db.Column(db.String(100), nullable=False)
    descripcion_lista_precios = db.Column(db.String(255), nullable=True)
    moneda = db.Column(db.String(3), nullable=False, default='CLP')
    
    clientes = db.relationship('MaestroClientes', back_populates='lista_precios')

    @validates('codigo_lista_precios', 'nombre_lista_precios', 'moneda')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        if key in ('codigo_lista_precios', 'moneda'):
            cleaned = value.upper().strip()
            if key == 'moneda' and len(cleaned) != 3:
                raise ValueError('La moneda debe tener 3 caracteres (ISO 4217)')
            return cleaned
        return value.strip()

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_lista_precios=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<ListaPrecios {self.nombre_lista_precios}>'

class CondicionPago(db.Model, MixinAuditoria):
    __tablename__ = 'condiciones_pago'
    __table_args__ = {'schema': 'entidades', 'comment': 'Almacena las condiciones de pago para cada cliente'}

    id_condicion_pago = db.Column(db.Integer, primary_key=True)
    codigo_condicion_pago = db.Column(db.String(20), unique=True, nullable=False, comment='Código de la condición de pago')
    nombre_condicion_pago = db.Column(db.String(100), nullable=False)
    descripcion_condicion_pago = db.Column(db.String(255), nullable=True)
    dias_credito = db.Column(db.Integer, nullable=False, default=0)
    ambito = db.Column(db.String(20), nullable=False, default='VENTA')

    clientes = db.relationship('MaestroClientes', back_populates='condicion_pago')

    @validates('codigo_condicion_pago')
    def validate_codigo(self, key, codigo):
        if not codigo:
            raise ValueError('El código de la condición de pago es requerido')
        return codigo.upper().strip()
    @property
    def es_credito(self):
        return self.dias_credito > 0
    
    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_condicion_pago=codigo, activo=True).first()

    def __repr__(self):
        return f'<CondicionPago [{self.codigo_condicion_pago}] {self.dias_credito} días>'

class Empresa(db.Model, MixinAuditoria):
    __tablename__ = 'empresas'
    __table_args__ = {'schema': 'entidades', 'comment': 'Almacena las empresas (Repuesto Center S.A., etc)'}

    id_empresa = db.Column(db.Integer, primary_key=True)
    nombre_empresa = db.Column(db.String(100), nullable=False)
    rut_empresa = db.Column(db.String(15), unique=True, nullable=False, index=True)
    codigo_empresa = db.Column(db.String(20), unique=True, nullable=False, comment='Código de la empresa (RC_CL, RC_PE, GH, etc)')

    clientes = db.relationship('MaestroClientes', back_populates='empresa')

    @validates('codigo_empresa', 'nombre_empresa', 'rut_empresa')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        if key == 'codigo_empresa':
            return value.upper().strip()
        return value.strip()

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_empresa=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<Empresa {self.nombre_empresa}>'
