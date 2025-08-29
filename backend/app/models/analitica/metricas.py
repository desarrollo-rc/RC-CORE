# backend/app/models/metricas.py
from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import PrimaryKeyConstraint

class ClienteMetricas(db.Model):
    __tablename__ = 'cliente_metricas'
    __table_args__ = {'schema': 'analitica', 'comment': 'HUB de métricas. Almacena KPIs agregados a nivel de cliente.'}

    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), primary_key=True)
    cliente = db.relationship('MaestroClientes', back_populates='metricas')

    # --- KPIs Universales del Cliente ---
    fecha_primera_compra = db.Column(db.DateTime, nullable=True)
    fecha_ultima_compra = db.Column(db.DateTime, nullable=True)
    dias_desde_ultima_compra = db.Column(db.Integer, nullable=True, comment='Calculado diariamente. Para segmentación RFM.')

    monto_total_historico = db.Column(db.Numeric(15, 2), nullable=True, server_default='0.0')
    #DIARIO Y MENSUAL
    ticket_promedio_historico = db.Column(db.Numeric(12, 2), nullable=True, server_default='0.0')
    cantidad_ordenes_historico = db.Column(db.Integer, nullable=True, server_default='0')

    estado_cliente = db.Column(db.String(50), nullable=True, default='Nuevo')

    # Relaciones hacia los "Spokes"
    metricas_canal = db.relationship('ClienteMetricasCanal', back_populates='cliente_metricas', cascade="all, delete-orphan")
    metricas_marca = db.relationship('ClienteMetricasMarca', back_populates='cliente_metricas', cascade="all, delete-orphan")
    actividad = db.relationship('ClienteActividad', back_populates='cliente_metricas', cascade="all, delete-orphan", uselist=False)
    metricas_mensuales = db.relationship('ClienteMetricasMensuales', back_populates='cliente_metricas', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<ClienteMetricas id_cliente={self.id_cliente}>'

class ClienteMetricasCanal(db.Model):
    __tablename__ = 'cliente_metricas_canal'
    __table_args__ = (
        PrimaryKeyConstraint('id_cliente', 'id_canal', name='pk_cliente_canal'),
        {'schema': 'analitica', 'comment': 'SPOKE. KPIs de un cliente por cada canal de venta.'}
    )

    id_cliente = db.Column(db.Integer, db.ForeignKey('analitica.cliente_metricas.id_cliente'), nullable=False, index=True)

    id_canal = db.Column(db.Integer, db.ForeignKey('negocio.canales.id_canal'), nullable=False, index=True)
    canal = db.relationship('Canales', back_populates='cliente_metricas_canal')

    # --- KPIs por Canal ---
    monto_total_canal = db.Column(db.Numeric(15, 2), default=0.0)
    ticket_promedio_canal = db.Column(db.Numeric(12, 2), default=0.0)
    cantidad_ordenes_canal = db.Column(db.Integer, default=0)
    fecha_ultima_compra_canal = db.Column(db.DateTime)

    metricas = db.relationship('ClienteMetricas', back_populates='metricas_canal') 

    def __repr__(self):
        return f'<ClienteMetricasCanal id_cliente={self.id_cliente} canal={self.canal}>'

class ClienteMetricasMarca(db.Model):
    __tablename__ = 'cliente_metricas_marca'
    __table_args__ = (
        PrimaryKeyConstraint('id_cliente', 'id_marca', name='pk_cliente_marca'),
        {'schema': 'analitica', 'comment': 'SPOKE. KPIs de un cliente por cada marca.'}
    )

    id_cliente = db.Column(db.Integer, db.ForeignKey('analitica.cliente_metricas.id_cliente'), nullable=False, index=True)

    id_marca = db.Column(db.Integer, db.ForeignKey('negocio.marcas.id_marca'), nullable=False, index=True)
    marca = db.relationship('Marcas', back_populates='cliente_metricas_marca')

    monto_total_marca = db.Column(db.Numeric(15, 2), default=0.0)
    cantidad_productos_marca = db.Column(db.Integer, default=0)
    ticket_promedio_marca = db.Column(db.Numeric(12, 2), default=0.0)
    fecha_ultima_compra_marca = db.Column(db.DateTime, nullable=True)
    
    metricas = db.relationship('ClienteMetricas', back_populates='metricas_marca')
    
    def __repr__(self):
        return f'<ClienteMetricasMarca id_cliente={self.id_cliente} marca={self.marca}>'

class ClienteActividad(db.Model):
    __tablename__ = 'cliente_actividad'
    __table_args__ = {'schema': 'analitica', 'comment': 'SPOKE. Registros de actividad y engagement del cliente.'}

    id_cliente = db.Column(db.Integer, db.ForeignKey('analitica.cliente_metricas.id_cliente'), primary_key=True)

    ultimo_login_b2b = db.Column(db.DateTime)
    sesiones_b2b_ultimos_30d = db.Column(db.Integer, default=0)
    sesiones_b2b_total = db.Column(db.Integer, default=0)
    busquedas_sin_resultado_ultimos_30d = db.Column(db.Integer, default=0)
    busquedas_sin_resultado_total = db.Column(db.Integer, default=0)
    #COIDOGS QUE VIO VS LOS QUE COMPRÓ

    metricas = db.relationship('ClienteMetricas', back_populates='actividad')

    def __repr__(self):
        return f'<ClienteActividad id_cliente={self.id_cliente}>'

class ClienteMetricasMensuales(db.Model):
    __tablename__ = 'cliente_metricas_mensuales'
    __table_args__ = (
        PrimaryKeyConstraint('id_cliente', 'year', 'month', name='pk_cliente_mes'),
        {'schema': 'analitica', 'comment': 'SPOKE. KPIs mensuales de un cliente para análisis de tendencias.'}
    )

    id_cliente = db.Column(db.Integer, db.ForeignKey('analitica.cliente_metricas.id_cliente'), nullable=False)
    year = db.Column(db.SmallInteger, nullable=False, comment='Ej: 2025')
    month = db.Column(db.SmallInteger, nullable=False, comment='Ej: 8 para Agosto')

    # --- KPIs Mensuales ---
    monto_total_mes = db.Column(db.Numeric(15, 2), default=0.0) #monto_total_historico
    ordenes_mes = db.Column(db.Integer, default=0) #cantidad_ordenes_historico
    ticket_promedio_mes = db.Column(db.Numeric(12, 2), default=0.0) #monto_total_mes / ordenes_mes


    # Relación de vuelta al Hub
    cliente_metricas = db.relationship('ClienteMetricas', back_populates='metricas_mensuales')

    def __repr__(self):
        return f'<ClienteMetricasMensuales id_cliente={self.id_cliente} anio={self.anio} mes={self.mes}>'