from app.extensions import db
from sqlalchemy.orm import validates
from .entidades_auxiliares import MixinAuditoria


class Direccion(db.Model, MixinAuditoria):
    __tablename__ = 'direcciones'
    __table_args__ = {'schema': 'entidades'}

    id_direccion = db.Column(db.Integer, primary_key=True)
    calle = db.Column(db.String(255), nullable=False)
    numero = db.Column(db.String(20))
    comuna = db.Column(db.String(100), nullable=False)
    ciudad = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100), nullable=False)
    codigo_postal = db.Column(db.String(20))
    
    es_facturacion = db.Column(db.Boolean, default=False, nullable=False)
    es_despacho = db.Column(db.Boolean, default=True, nullable=False)

    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), nullable=False)
    cliente = db.relationship('MaestroClientes', back_populates='direcciones')

    @validates('calle', 'comuna', 'ciudad', 'region')
    def validate_required(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip()

    def __repr__(self):
        return f'<Direccion {self.calle} {self.numero}, {self.ciudad}>'