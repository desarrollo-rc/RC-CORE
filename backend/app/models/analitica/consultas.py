from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
import enum
from sqlalchemy import Column, Integer, String, Text, Boolean, Enum as SQLAlchemyEnum

class TipoQuery(enum.Enum):
    LECTURA = "LECTURA"
    ESCRITURA = "ESCRITURA"
    PROCESO = "PROCESO" # Para lógica más compleja que un simple CRUD

class OrigenBdd(enum.Enum):
    RC_CORE = "RC_CORE"
    SAPB1 = "SAPB1"
    OMSRC = "OMSRC"

class Consulta(db.Model):
    __tablename__ = 'consultas'
    __table_args__ = {
        'schema': 'analitica',
        'comment': 'Catálogo de consultas SQL y procesos para reporting y automatización.'
    }

    id_consulta = db.Column(db.Integer, primary_key=True)

    # Identificación y metadata
    codigo_consulta = db.Column(db.String(100), unique=True, nullable=False, index=True)
    nombre = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=True)
    categoria = db.Column(db.String(100), nullable=True, index=True)
    tags = db.Column(JSONB, nullable=True, comment='Lista de etiquetas como arreglo JSON')

    # Definición técnica
    query_sql = db.Column(db.Text, nullable=False, comment='Consulta SQL parametrizada. Debe ser SOLO SELECT')
    parametros_defecto = db.Column(JSONB, nullable=True, comment='Valores por defecto para parámetros (clave->valor)')
    version = db.Column(db.Integer, nullable=False, default=1)

    # Auditoría básica
    creado_por = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=True)
    fecha_creacion = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_modificacion = db.Column(db.DateTime, onupdate=func.now())
    activo = db.Column(db.Boolean, default=True, nullable=False)

    tipo = db.Column(SQLAlchemyEnum(TipoQuery), nullable=False, default=TipoQuery.LECTURA, server_default='LECTURA')
    bdd_source = db.Column(SQLAlchemyEnum(OrigenBdd), nullable=False, default=OrigenBdd.RC_CORE, server_default='RC_CORE')

    creador = db.relationship('Usuario')
    ejecuciones = db.relationship('ConsultaEjecucion', back_populates='consulta', cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Consulta codigo={self.codigo_consulta} v{self.version}>'


class ConsultaEjecucion(db.Model):
    __tablename__ = 'consulta_ejecuciones'
    __table_args__ = {
        'schema': 'analitica',
        'comment': 'Historial de ejecuciones de consultas para auditoría y performance.'
    }

    id_ejecucion = db.Column(db.Integer, primary_key=True)
    id_consulta = db.Column(db.Integer, db.ForeignKey('analitica.consultas.id_consulta'), nullable=False, index=True)

    # Contexto de ejecución
    ejecutada_por = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=True)
    parametros_usados = db.Column(JSONB, nullable=True)
    duracion_ms = db.Column(db.Integer, nullable=True)
    filas = db.Column(db.Integer, nullable=True)
    fecha_ejecucion = db.Column(db.DateTime, server_default=func.now(), nullable=False)

    consulta = db.relationship('Consulta', back_populates='ejecuciones')
    usuario = db.relationship('Usuario')

    def __repr__(self):
        return f'<ConsultaEjecucion consulta_id={self.id_consulta} filas={self.filas} dur_ms={self.duracion_ms}>'


