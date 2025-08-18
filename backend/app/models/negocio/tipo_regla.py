from app.extensions import db
from sqlalchemy.orm import validates
from app.models.entidades.entidades_auxiliares import MixinAuditoria


class TipoRegla(db.Model, MixinAuditoria):
    __tablename__ = 'tipos_reglas'
    __table_args__ = {'schema': 'negocio', 'comment': 'Tipos de regla del motor (precio, descuento, tope, etc.)'}
    
    id_tipo_regla = db.Column(db.Integer, primary_key=True)
    codigo_tipo_regla = db.Column(db.String(20), unique=True, nullable=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    reglas = db.relationship('MotorReglasComerciales', back_populates='tipo_regla')

    @validates('codigo_tipo_regla', 'nombre')
    def validate_fields(self, key, value):
        if value is None:
            if key == 'codigo_tipo_regla':
                return None
            raise ValueError(f'El campo {key} es requerido')
        cleaned = value.strip()
        if key == 'codigo_tipo_regla':
            return cleaned.upper()
        return cleaned

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_tipo_regla=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<TipoRegla {self.nombre}>'