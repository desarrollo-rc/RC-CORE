# backend/app/models/soporte/casos.py
from app.extensions import db
from sqlalchemy.sql import func
import enum

# Tabla asociativa para la relación muchos a muchos entre Caso y BaseConocimiento
casos_conocimiento = db.Table('casos_conocimiento',
    db.Column('id_caso', db.Integer, db.ForeignKey('soporte.casos.id_caso'), primary_key=True),
    db.Column('id_articulo', db.Integer, db.ForeignKey('soporte.base_conocimiento.id_articulo'), primary_key=True),
    schema='soporte'
)

class EstadoCaso(enum.Enum):
    ABIERTO = "Abierto"
    EN_PROGRESO = "En Progreso"
    RESUELTO = "Resuelto"
    CERRADO = "Cerrado"

class PrioridadCaso(enum.Enum):
    BAJA = "Baja"
    MEDIA = "Media"
    ALTA = "Alta"
    URGENTE = "Urgente"

class Caso(db.Model):
    __tablename__ = 'casos'
    __table_args__ = {'schema': 'soporte', 'comment': 'Ticket o solicitud central de un cliente'}

    id_caso = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(255), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    
    # Usamos Enums para garantizar la integridad de los datos
    estado = db.Column(db.Enum(EstadoCaso), nullable=False, default=EstadoCaso.ABIERTO)
    prioridad = db.Column(db.Enum(PrioridadCaso), nullable=False, default=PrioridadCaso.MEDIA)

    fecha_creacion = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_cierre = db.Column(db.DateTime, nullable=True)

    # --- Relaciones Clave ---
    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), nullable=False)
    id_usuario_creacion = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=False, comment="Usuario interno que registra el caso")
    id_usuario_asignado = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=True)
    id_tipo_caso = db.Column(db.Integer, db.ForeignKey('soporte.tipos_caso.id_tipo_caso'), nullable=False)

    cliente = db.relationship('MaestroClientes')
    creador = db.relationship('Usuario', foreign_keys=[id_usuario_creacion])
    asignado = db.relationship('Usuario', foreign_keys=[id_usuario_asignado])
    tipo_caso = db.relationship('TipoCaso', back_populates='casos')

    # Relación uno a muchos con las instalaciones
    instalaciones = db.relationship('Instalacion', back_populates='caso', cascade="all, delete-orphan")
    
    # Relación muchos a muchos con la base de conocimiento
    articulos_relacionados = db.relationship('BaseConocimiento', secondary=casos_conocimiento, back_populates='casos_relacionados')

    def __repr__(self):
        return f"<Caso {self.id_caso}: {self.titulo}>"