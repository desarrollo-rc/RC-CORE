# backend/app/models/productos/caracteristicas.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria

class Atributo(db.Model, MixinAuditoria):
    __tablename__ = 'atributos'
    __table_args__ = {'schema': 'productos', 'comment': 'Atributos de los productos (Lado, Material, Color, etc.)'}
    id_atributo = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False) # Ej: "Lado", "Material", "Color"

class Medida(db.Model, MixinAuditoria):
    __tablename__ = 'medidas'
    __table_args__ = {'schema': 'productos', 'comment': 'Medidas de los productos (Alto, Ancho, Diámetro, etc.)'}
    id_medida = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False) # Ej: "Alto", "Ancho", "Diámetro"
    unidad = db.Column(db.String(20), nullable=False) # Ej: "cm", "mm", "kg"

class AtributoAsignado(db.Model):
    __tablename__ = 'atributos_asignados'
    __table_args__ = {'schema': 'productos', 'comment': 'Atributos asignados a los productos'}
    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), primary_key=True)
    id_atributo = db.Column(db.Integer, db.ForeignKey('productos.atributos.id_atributo'), primary_key=True)
    valor = db.Column(db.String(255), nullable=False) # Ej: "Izquierdo", "Acero", "Rojo"
    
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='atributos_asignados')
    atributo = db.relationship('Atributo')

class MedidaAsignada(db.Model):
    __tablename__ = 'medidas_asignadas'
    __table_args__ = {'schema': 'productos', 'comment': 'Medidas asignadas a los productos'}
    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), primary_key=True)
    id_medida = db.Column(db.Integer, db.ForeignKey('productos.medidas.id_medida'), primary_key=True)
    valor = db.Column(db.Numeric(10, 2), nullable=False) # Ej: 120.50, 35.00
    
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='medidas_asignadas')
    medida = db.relationship('Medida')