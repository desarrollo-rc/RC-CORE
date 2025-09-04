# backend/app/models/entidades/maestro_proveedores.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class MaestroProveedores(db.Model, MixinAuditoria):
    __tablename__ = 'maestro_proveedores'
    __table_args__ = {'schema': 'entidades', 'comment': 'Tabla Maestra de Proveedores'}

    id_proveedor = db.Column(db.Integer, primary_key=True)
    codigo_proveedor = db.Column(db.String(50), unique=True, nullable=False)
    nombre_proveedor = db.Column(db.String(150), nullable=False)
    rut_proveedor = db.Column(db.String(15), unique=True, nullable=False, index=True)
    
    id_pais = db.Column(db.Integer, db.ForeignKey('general.paises.id_pais'))
    pais = db.relationship('Pais')
    
    direccion = db.Column(db.String(255))
    telefono = db.Column(db.String(50))
    email = db.Column(db.String(100))
    
    productos = db.relationship('ProductoProveedor', back_populates='proveedor', cascade="all, delete-orphan")

    @validates('codigo_proveedor', 'nombre_proveedor', 'rut_proveedor')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo_proveedor' else value.strip()
    
    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_proveedor=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<MaestroProveedores {self.nombre_proveedor}>'
