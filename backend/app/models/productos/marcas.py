# backend/app/models/productos/marcas.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates
import enum

class AmbitoMarca(enum.Enum):
    VEHICULO = 'Vehículo'
    REPUESTO = 'Repuesto'
    MIXTO = 'Mixto'

class Marca(db.Model, MixinAuditoria):
    __tablename__ = 'marcas'
    __table_args__ = {'schema': 'productos', 'comment': 'Marcas de vehículos y productos (Toyota, Bosch, etc.)'}

    id_marca = db.Column(db.Integer, primary_key=True)
    codigo_marca = db.Column(db.String(30), unique=True, nullable=False)
    nombre_marca = db.Column(db.String(100), nullable=False)
    
    ambito_marca = db.Column(db.Enum(AmbitoMarca), nullable=False, default=AmbitoMarca.MIXTO, comment="Define si la marca es de Vehículos, Repuestos o Mixta")

    descripcion = db.Column(db.String(255), nullable=True, comment="Breve descripción o eslogan de la marca.")
    tier_marca = db.Column(db.String(50), nullable=True, comment="Tier de la marca (TIER 1, TIER 2, etc.)")
    
    id_pais_origen = db.Column(db.Integer, db.ForeignKey('general.paises.id_pais'), nullable=True)
    pais_origen = db.relationship('Pais')
    
    url_imagen = db.Column(db.String(255), nullable=True, comment="URL del logo de la marca")

    # Relaciones
    modelos = db.relationship('Modelo', back_populates='marca', cascade="all, delete-orphan")
    productos = db.relationship('MaestroProductos', back_populates='marca')
    cliente_metricas_marca = db.relationship('ClienteMetricasMarca', back_populates='marca')
    
    @validates('codigo_marca', 'nombre_marca')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        cleaned = value.strip()
        if key == 'codigo_marca':
            return cleaned.upper()
        return cleaned

    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_marca=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<Marca {self.nombre_marca}>'
