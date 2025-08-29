# backend/app/models/entidades/tipo_negocio.py

from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class TipoNegocio(db.Model, MixinAuditoria):
    __tablename__ = 'tipo_negocio'
    __table_args__ = {'schema': 'entidades'}

    id_tipo_negocio = db.Column(db.Integer, primary_key=True)
    codigo_tipo_negocio = db.Column(db.String(25), unique=True, nullable=False)
    nombre_tipo_negocio = db.Column(db.String(255), nullable=False)
    descripcion_tipo_negocio = db.Column(db.String(255), nullable=True)

    clientes = db.relationship('MaestroClientes', back_populates='tipo_negocio')

    @validates('codigo_tipo_negocio', 'nombre_tipo_negocio')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo_tipo_negocio' else value.strip()

    @staticmethod
    def get_by_codigo(codigo):
        return TipoNegocio.query.filter_by(codigo_tipo_negocio=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f"<TipoNegocio {self.nombre_tipo_negocio}>"