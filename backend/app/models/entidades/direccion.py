from app.extensions import db
from sqlalchemy.orm import validates
from .entidades_auxiliares import MixinAuditoria


class Direccion(db.Model, MixinAuditoria):
    __tablename__ = 'direcciones'
    __table_args__ = {'schema': 'entidades'}

    id_direccion = db.Column(db.Integer, primary_key=True)
    calle = db.Column(db.String(255), nullable=False)
    numero = db.Column(db.String(20))
    id_comuna = db.Column(db.Integer, db.ForeignKey('general.comunas.id_comuna'), nullable=False)
    codigo_postal = db.Column(db.String(20))
    
    es_facturacion = db.Column(db.Boolean, default=False, nullable=False)
    es_despacho = db.Column(db.Boolean, default=True, nullable=False)

    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), nullable=False)
    cliente = db.relationship('MaestroClientes', back_populates='direcciones')

    # Relaciones geográficas
    comuna = db.relationship('Comuna', back_populates='direcciones')

    @validates('calle')
    def validate_required(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip()

    def __repr__(self):
        return f'<Direccion {self.calle} {self.numero}>'

class Comuna(db.Model):
    __tablename__ = 'comunas'
    __table_args__ = {'schema': 'general'}

    id_comuna = db.Column(db.Integer, primary_key=True)
    nombre_comuna = db.Column(db.String(100), nullable=False)
    id_ciudad = db.Column(db.Integer, db.ForeignKey('general.ciudades.id_ciudad'), nullable=False)

    ciudad = db.relationship('Ciudad', back_populates='comunas')
    direcciones = db.relationship('Direccion', back_populates='comuna')

    def __repr__(self):
        return f'<Comuna {self.nombre_comuna}>'

class Ciudad(db.Model):
    __tablename__ = 'ciudades'
    __table_args__ = {'schema': 'general'}

    id_ciudad = db.Column(db.Integer, primary_key=True)
    nombre_ciudad = db.Column(db.String(100), nullable=False)
    id_region = db.Column(db.Integer, db.ForeignKey('general.regiones.id_region'), nullable=False)

    region = db.relationship('Region', back_populates='ciudades')
    comunas = db.relationship('Comuna', back_populates='ciudad')

    def __repr__(self):
        return f'<Ciudad {self.nombre_ciudad}>'

class Region(db.Model):
    __tablename__ = 'regiones'
    __table_args__ = {'schema': 'general'}

    id_region = db.Column(db.Integer, primary_key=True)
    nombre_region = db.Column(db.String(100), nullable=False)
    id_pais = db.Column(db.Integer, db.ForeignKey('general.paises.id_pais'), nullable=False)

    pais = db.relationship('Pais', back_populates='regiones')
    ciudades = db.relationship('Ciudad', back_populates='region')

    def __repr__(self):
        return f'<Region {self.nombre_region}>'

class Pais(db.Model):
    __tablename__ = 'paises'
    __table_args__ = {'schema': 'general'}

    id_pais = db.Column(db.Integer, primary_key=True)
    nombre_pais = db.Column(db.String(100), unique=True, nullable=False)

    regiones = db.relationship('Region', back_populates='pais')

    def __repr__(self):
        return f'<Pais {self.nombre_pais}>'