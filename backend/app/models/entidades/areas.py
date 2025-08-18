from app.extensions import db
from .entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class Area(db.Model, MixinAuditoria):
    __tablename__ = 'areas'
    __table_args__ = {'schema': 'entidades', 'comment': 'Almacena las areas (Repuesto Center S.A., etc)'}

    id_area = db.Column(db.Integer, primary_key=True)
    codigo_area = db.Column(db.String(20), unique=True, nullable=False)
    nombre_area = db.Column(db.String(100), nullable=False)
    descripcion_area = db.Column(db.String(255), nullable=True)

    usuarios = db.relationship('Usuario', back_populates='area')

    @validates('codigo_area', 'nombre_area')
    def validate_text_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        if key == 'codigo_area':
            return value.upper().strip()
        return value
    @classmethod
    def get_activos(cls):
        return cls.query.filter_by(activo=True).order_by(cls.nombre_area).all()

    def __repr__(self):
        return f'<Area {self.nombre_area}>'
