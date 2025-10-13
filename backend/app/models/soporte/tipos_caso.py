# backend/app/models/soporte/tipos_caso.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates
import enum

class CategoriaTipoCaso(enum.Enum):
    INSTALACION_CLIENTE_NUEVO = "INSTALACION_CLIENTE_NUEVO"
    INSTALACION_USUARIO_ADICIONAL = "INSTALACION_USUARIO_ADICIONAL"
    INSTALACION_CAMBIO_EQUIPO = "INSTALACION_CAMBIO_EQUIPO"
    SOPORTE_TECNICO = "SOPORTE_TECNICO"
    CONSULTA = "CONSULTA"
    BLOQUEO = "BLOQUEO"
    OTRO = "OTRO"
    
    def __str__(self):
        return self.value

class TipoCaso(db.Model, MixinAuditoria):
    __tablename__ = 'tipos_caso'
    __table_args__ = {'schema': 'soporte', 'comment': 'Categoriza los casos de soporte (Instalación, Bloqueo, etc.)'}

    id_tipo_caso = db.Column(db.Integer, primary_key=True)
    codigo_tipo_caso = db.Column(db.String(50), unique=True, nullable=False)
    nombre_tipo_caso = db.Column(db.String(100), nullable=False)
    descripcion_tipo_caso = db.Column(db.String(255), nullable=True)
    categoria_uso = db.Column(db.Enum(CategoriaTipoCaso), nullable=True, 
                              comment='Categoría para identificar automáticamente el tipo de caso en flujos')

    # Relación inversa: Un tipo puede tener muchos casos
    casos = db.relationship('Caso', back_populates='tipo_caso')
    articulos_conocimiento = db.relationship('BaseConocimiento', back_populates='tipo_caso')

    @validates('codigo_tipo_caso', 'nombre_tipo_caso')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo_tipo_caso' else value.strip()

    @classmethod
    def get_by_codigo(cls, codigo):
        """Busca un tipo de caso por su código."""
        return cls.query.filter_by(codigo_tipo_caso=codigo.upper().strip(), activo=True).first()
    
    @classmethod
    def get_by_categoria(cls, categoria):
        """Busca un tipo de caso por su categoría."""
        return cls.query.filter_by(categoria_uso=categoria, activo=True).first()

    def __repr__(self):
        return f"<TipoCaso {self.nombre_tipo_caso}>"