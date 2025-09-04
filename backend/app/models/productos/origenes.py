# backend/app/models/productos/origenes.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class Origen(db.Model, MixinAuditoria):
    __tablename__ = 'origenes'
    __table_args__ = {'schema': 'productos', 'comment': 'País de origen del diseño o ingeniería del producto'}

    id_origen = db.Column(db.Integer, primary_key=True)
    id_pais = db.Column(db.Integer, db.ForeignKey('general.paises.id_pais'), unique=True, nullable=False)
    
    pais = db.relationship('Pais')
    productos = db.relationship('MaestroProductos', back_populates='origen')

    def __repr__(self):
        try:
            return f'<Origen {self.pais.nombre_pais}>'
        except Exception:
            return f'<Origen ID: {self.id_origen}>'
