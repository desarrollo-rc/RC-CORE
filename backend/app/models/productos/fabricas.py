# backend/app/models/productos/fabricas.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class Fabrica(db.Model, MixinAuditoria):
    __tablename__ = 'fabricas'
    __table_args__ = {'schema': 'productos', 'comment': 'Fábrica o manufacturador del producto'}

    id_fabrica = db.Column(db.Integer, primary_key=True)
    nombre_fabrica = db.Column(db.String(150), unique=True, nullable=False)
    
    id_pais = db.Column(db.Integer, db.ForeignKey('general.paises.id_pais'))
    pais = db.relationship('Pais')

    productos = db.relationship('MaestroProductos', back_populates='fabrica')

    @validates('nombre_fabrica')
    def validate_nombre(self, key, value):
        if not value:
            raise ValueError('El nombre de la fábrica es requerido')
        return value.strip()

    def __repr__(self):
        return f'<Fabrica {self.nombre_fabrica}>'
