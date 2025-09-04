from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class Calidad(db.Model, MixinAuditoria):
    __tablename__ = 'calidades'
    __table_args__ = {'schema': 'productos', 'comment': 'Calidades de los productos (Original, Alternativo Premium, etc.)'}

    id_calidad = db.Column(db.Integer, primary_key=True)
    codigo_calidad = db.Column(db.String(30), unique=True, nullable=False)
    nombre_calidad = db.Column(db.String(100), nullable=False)
    descripcion = db.Column(db.String(255))
    
    # Relación inversa a los productos
    productos = db.relationship('MaestroProductos', back_populates='calidad')

    @validates('codigo_calidad', 'nombre_calidad')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        cleaned = value.strip()
        if key == 'codigo_calidad':
            return cleaned.upper()
        return cleaned

    def __repr__(self):
        return f'<Calidad {self.nombre_calidad}>'
