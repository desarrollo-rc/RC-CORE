# backend/app/models/reglas.py
from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB

class MotorReglasComerciales(db.Model):
    __tablename__ = 'motor_reglas_comerciales'
    __table_args__ = {'schema': 'negocio', 'comment': 'Cerebro central de reglas de negocio para precios, descuentos, etc.'}

    id_regla = db.Column(db.Integer, primary_key=True)
    nombre_regla = db.Column(db.String(255), nullable=False)
    
    # --- Tipo de Regla ---
    id_tipo_regla = db.Column(db.Integer, db.ForeignKey('negocio.tipos_reglas.id_tipo_regla'), nullable=False)
    tipo_regla = db.relationship('TipoRegla', back_populates='reglas')

    # --- Logica de la Regla ---
    condiciones = db.Column(JSONB, nullable=False, comment='Define CUÁNDO se aplica la regla. Ej: {"canal": "B2B", "segmento": "XL"}')
    resultado = db.Column(JSONB, nullable=False, comment='Define QUÉ sucede. Ej: {"tipo": "descuento_porcentual", "valor": 5}')
    prioridad = db.Column(db.Integer, default=100, nullable=False, comment='Para resolver conflictos entre reglas. Mayor número = mayor prioridad.')


    # --- ciclo de vida de la regla ---
    activa = db.Column(db.Boolean, default=True, nullable=False, comment='Si la regla está activa o no.')
    fecha_inicio = db.Column(db.DateTime, nullable=True, comment='Fecha de inicio de la regla.')
    fecha_fin = db.Column(db.DateTime, nullable=True, comment='Fecha de fin de la regla.')

    def __repr__(self):
        return f'<MotorReglasComerciales {self.id_regla}: {self.nombre_regla}>'
