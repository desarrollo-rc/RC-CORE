# backend/app/models/entidades/equipos.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates
import enum

class EstadoAltaEquipo(enum.Enum):
    PENDIENTE = "Pendiente"
    APROBADO = "Aprobado"
    RECHAZADO = "Rechazado"

class Equipo(db.Model, MixinAuditoria):
    __tablename__ = 'equipos'
    __table_args__ = {'schema': 'entidades', 'comment': 'Equipos de clientes autorizados para operar con el B2B'}

    id_equipo = db.Column(db.Integer, primary_key=True)
    id_usuario_b2b = db.Column(db.Integer, db.ForeignKey('entidades.usuarios_b2b.id_usuario_b2b'), nullable=False)

    nombre_equipo = db.Column(db.String(100), nullable=False)
    mac_address = db.Column(db.String(17), nullable=True, comment="Dirección MAC del dispositivo")

    procesador = db.Column(db.String(100), nullable=True)
    placa_madre = db.Column(db.String(100), nullable=True)
    disco_duro = db.Column(db.String(100), nullable=True)

    estado_alta = db.Column(db.Enum(EstadoAltaEquipo), nullable=False, default=EstadoAltaEquipo.PENDIENTE, comment="Aprobado/Rechazado/Pendiente")
    estado = db.Column(db.Boolean, default=False, nullable=False, comment="Activo=True/Inactivo=False")

    usuario_b2b = db.relationship('UsuarioB2B', back_populates='equipos')
    instalaciones = db.relationship('Instalacion', back_populates='equipo')

    @validates('mac_address')
    def validate_mac_address(self, key, mac):
        if mac:
            return mac.upper().strip()
        return None

    def __repr__(self):
        return f"<Equipo {self.nombre_equipo} ({'Activo' if self.estado else 'Inactivo'})>"