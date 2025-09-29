# backend/app/models/negocio/vendedores.py
from app.extensions import db
from sqlalchemy.sql import func
from app.models.entidades.entidades_auxiliares import MixinAuditoria

class Vendedor(db.Model, MixinAuditoria):
    __tablename__ = 'vendedores'
    __table_args__ = {'schema': 'negocio'}

    id_vendedor = db.Column(db.Integer, primary_key=True)
    codigo_vendedor_sap = db.Column(db.String(50), unique=True, nullable=True)

    # relaciones
    id_usuario = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), unique=True, nullable=False)
    usuario = db.relationship('Usuario', back_populates='perfil_vendedor')
    
    clientes = db.relationship('MaestroClientes', back_populates='vendedor')

    metas = db.relationship('Meta', back_populates='vendedor', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Vendedor {self.usuario.nombre_completo}>'
