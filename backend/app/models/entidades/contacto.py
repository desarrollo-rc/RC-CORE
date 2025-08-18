from app.extensions import db
from sqlalchemy.orm import validates
from .entidades_auxiliares import MixinAuditoria


class Contacto(db.Model, MixinAuditoria):
    __tablename__ = 'contactos'
    __table_args__ = {'schema': 'entidades'}

    id_contacto = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    cargo = db.Column(db.String(100))
    email = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(20))
    es_principal = db.Column(db.Boolean, default=False, nullable=False)
    
    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), nullable=False)
    cliente = db.relationship('MaestroClientes', back_populates='contactos')

    @validates('nombre', 'email')
    def validate_required(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        cleaned = value.strip()
        if key == 'email':
            return cleaned.lower()
        return cleaned

    def __repr__(self):
        return f'<Contacto {self.nombre}>'