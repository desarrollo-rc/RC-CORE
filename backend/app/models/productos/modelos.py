# backend/app/models/productos/modelos.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy import ARRAY

class Modelo(db.Model, MixinAuditoria):
    __tablename__ = 'modelos'
    __table_args__ = {'schema': 'productos'}

    id_modelo = db.Column(db.Integer, primary_key=True)
    nombre_modelo = db.Column(db.String(100), nullable=False)
    
    id_marca = db.Column(db.Integer, db.ForeignKey('productos.marcas.id_marca'), nullable=False)
    marca = db.relationship('Marca', back_populates='modelos')
    
    versiones = db.relationship('VersionVehiculo', back_populates='modelo', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<Modelo {self.marca.nombre_marca} {self.nombre_modelo}>'

class VersionVehiculo(db.Model, MixinAuditoria):
    __tablename__ = 'versiones_vehiculo'
    __table_args__ = {'schema': 'productos'}

    id_version = db.Column(db.Integer, primary_key=True)
    id_modelo = db.Column(db.Integer, db.ForeignKey('productos.modelos.id_modelo'), nullable=False)

    nombre_version = db.Column(db.String(150), nullable=False) # Ej: "1.5L GLI AT"
    detalle_motor = db.Column(db.String(100)) # Ej: "1NZ-FE VVT-i"
    cilindrada = db.Column(db.Integer)

    anios_fabricacion = db.Column(ARRAY(db.Integer), nullable=False, comment='Lista explícita de años compatibles, ej: [2018, 2019, 2021]')

    modelo = db.relationship('Modelo', back_populates='versiones')
    aplicaciones = db.relationship('Aplicacion', back_populates='version_vehiculo', cascade="all, delete-orphan")

    def __repr__(self):
        try:
            marca_nombre = self.modelo.marca.nombre_marca
            modelo_nombre = self.modelo.nombre_modelo
            return f'<VersionVehiculo {marca_nombre} {modelo_nombre} {self.nombre_version}>'
        except Exception:
            return f'<VersionVehiculo ID: {self.id_version}>'
