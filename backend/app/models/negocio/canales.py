from app.extensions import db
from sqlalchemy.orm import validates
from app.models.entidades.entidades_auxiliares import MixinAuditoria

class CanalVenta(db.Model, MixinAuditoria):
    __tablename__ = 'canales_venta'
    __table_args__ = {'schema': 'negocio', 'comment': 'Canales de venta (B2B, Call Center, Presencial, etc.)'}

    id_canal = db.Column(db.Integer, primary_key=True)
    codigo_canal = db.Column(db.String(20), unique=True, nullable=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)

    # Relaciones analíticas (para métricas por canal)
    cliente_metricas_canal = db.relationship('ClienteMetricasCanal', back_populates='canal')
    
    @validates('codigo_canal', 'nombre')
    def validate_fields(self, key, value):
        if value is None:
            if key == 'codigo_canal':
                return None
            raise ValueError(f'El campo {key} es requerido')
        cleaned = value.strip()
        if key == 'codigo_canal':
            return cleaned.upper()
        return cleaned

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_canal=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<CanalVenta {self.nombre}>'