# backend/app/models/productos/clasificaciones.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class ClasificacionServicio(db.Model, MixinAuditoria):
    __tablename__ = 'clasificaciones_servicio'
    __table_args__ = {'schema': 'productos'}

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    codigo = db.Column(db.String(30), unique=True, nullable=False)
    
    codigos_referencia = db.relationship('CodigoReferencia', back_populates='clasificacion_servicio')

    @validates('nombre', 'codigo')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo' else value.strip()

class ClasificacionEstadistica(db.Model, MixinAuditoria):
    __tablename__ = 'clasificaciones_estadistica'
    __table_args__ = {'schema': 'productos'}

    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    codigo = db.Column(db.String(30), unique=True, nullable=False)
    
    codigos_referencia = db.relationship('CodigoReferencia', back_populates='clasificacion_estadistica')

    @validates('nombre', 'codigo')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo' else value.strip()