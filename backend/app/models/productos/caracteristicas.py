# backend/app/models/productos/caracteristicas.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class Atributo(db.Model, MixinAuditoria):
    __tablename__ = 'atributos'
    __table_args__ = {'schema': 'productos', 'comment': 'Atributos de los productos (Lado, Material, Color, etc.)'}
    id_atributo = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10), unique=True, nullable=False) # Ej: "LAD", "MAT", "COL"
    nombre = db.Column(db.String(100), unique=True, nullable=False) # Ej: "Lado", "Material", "Color"

    valores = db.relationship('ValorAtributo', back_populates='atributo', cascade="all, delete-orphan")

    @validates('codigo', 'nombre')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo' else value.strip()

class ValorAtributo(db.Model, MixinAuditoria):
    __tablename__ = 'valores_atributo'
    __table_args__ = {'schema': 'productos', 'comment': 'Valores posibles para un atributo (Rojo, Azul, Izquierdo)'}
    
    id_valor = db.Column(db.Integer, primary_key=True)
    id_atributo = db.Column(db.Integer, db.ForeignKey('productos.atributos.id_atributo'), nullable=False)
    codigo = db.Column(db.String(30), nullable=False)
    valor = db.Column(db.String(100), nullable=False)
    
    atributo = db.relationship('Atributo', back_populates='valores')

    @validates('codigo', 'valor')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo' else value.strip()

    __table_args__ = (
        db.UniqueConstraint('id_atributo', 'codigo', name='uq_atributo_codigo_valor'),
        {'schema': 'productos'}
    )

class Medida(db.Model, MixinAuditoria):
    __tablename__ = 'medidas'
    __table_args__ = {'schema': 'productos', 'comment': 'Medidas de los productos (Alto, Ancho, Diámetro, etc.)'}
    id_medida = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(10), unique=True, nullable=False) # Ej: "ALT", "ANC", "DIA"
    nombre = db.Column(db.String(100), unique=True, nullable=False) # Ej: "Alto", "Ancho", "Diámetro"
    unidad = db.Column(db.String(20), nullable=False) # Ej: "cm", "mm", "kg"

class AtributoAsignado(db.Model):
    __tablename__ = 'atributos_asignados'
    __table_args__ = {'schema': 'productos', 'comment': 'Atributos asignados a los productos'}
    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), primary_key=True)
    id_atributo = db.Column(db.Integer, db.ForeignKey('productos.atributos.id_atributo'), primary_key=True)
    id_valor = db.Column(db.Integer, db.ForeignKey('productos.valores_atributo.id_valor'), nullable=False) # CAMBIO CLAVE
    
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='atributos_asignados')
    atributo = db.relationship('Atributo')
    valor_asignado = db.relationship('ValorAtributo')

class MedidaAsignada(db.Model):
    __tablename__ = 'medidas_asignadas'
    __table_args__ = {'schema': 'productos', 'comment': 'Medidas asignadas a los productos'}
    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), primary_key=True)
    id_medida = db.Column(db.Integer, db.ForeignKey('productos.medidas.id_medida'), primary_key=True)
    valor = db.Column(db.Numeric(10, 2), nullable=False) # Ej: 120.50, 35.00
    
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='medidas_asignadas')
    medida = db.relationship('Medida')