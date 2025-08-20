# backend/app/models/negocio/metas.py
from app.extensions import db
from sqlalchemy.sql import func

class TipoMeta(db.Model):
    __tablename__ = 'tipos_metas'
    __table_args__ = {'schema': 'negocio'}

    id_tipo_meta = db.Column(db.Integer, primary_key=True)
    codigo_meta = db.Column(db.String(50), unique=True, nullable=False)
    nombre_meta = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)
    unidad_medida = db.Column(db.String(50), nullable=False, default='CLP')
    activo = db.Column(db.Boolean, default=True, nullable=False)

    metas_asignadas = db.relationship('Meta', back_populates='tipo_meta')
    
    def __repr__(self):
        return f'<TipoMeta {self.nombre_meta}>'

class Meta(db.Model):
    __tablename__ = 'metas'
    __table_args__ = {'schema': 'negocio'}

    id_meta = db.Column(db.Integer, primary_key=True)
    periodo_anio = db.Column(db.Integer, nullable=False)
    periodo_mes = db.Column(db.Integer, nullable=False)
    valor_objetivo = db.Column(db.Numeric(12, 2), nullable=False)
    valor_alcanzado = db.Column(db.Numeric(12, 2), default=0.0)

    monto_comision = db.Column(db.Numeric(10, 2), nullable=False, default=0.0)

    # relaciones
    id_vendedor = db.Column(db.Integer, db.ForeignKey('negocio.vendedores.id_vendedor'), nullable=False)
    vendedor = db.relationship('Vendedor', back_populates='metas')

    id_tipo_meta = db.Column(db.Integer, db.ForeignKey('negocio.tipos_metas.id_tipo_meta'), nullable=False)
    tipo_meta = db.relationship('TipoMeta', back_populates='metas_asignadas')

    # --- Auditoría ---
    fecha_creacion = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_modificacion = db.Column(db.DateTime, onupdate=func.now())

    def __repr__(self):
        return f'<Meta {self.tipo_meta.nombre_meta} para {self.vendedor.usuario.nombre_completo} - {self.periodo_mes}/{self.periodo_anio}>'
