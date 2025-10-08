# backend/app/models/soporte/instalaciones.py
from app.extensions import db
from sqlalchemy.sql import func
from app.models.soporte.casos import Caso 
import enum

class EstadoInstalacion(enum.Enum):
    PENDIENTE_APROBACION = "Pendiente Aprobación"
    PENDIENTE_INSTALACION = "Pendiente Instalación"
    USUARIO_CREADO = "Usuario Creado"
    CONFIGURACION_PENDIENTE = "Configuración Pendiente"
    AGENDADA = "Agendada"
    COMPLETADA = "Completada"
    CANCELADA = "Cancelada"
    
    def __str__(self):
        return self.value


class Instalacion(db.Model):
    __tablename__ = 'instalaciones'
    __table_args__ = {'schema': 'soporte', 'comment': 'Registra el flujo de trabajo de una instalación específica'}

    id_instalacion = db.Column(db.Integer, primary_key=True)
    id_caso = db.Column(db.Integer, db.ForeignKey('soporte.casos.id_caso'), nullable=False)
    
    id_usuario_b2b = db.Column(db.Integer, db.ForeignKey('entidades.usuarios_b2b.id_usuario_b2b'), nullable=True, comment="Usuario B2B a instalar")
    id_equipo = db.Column(db.Integer, db.ForeignKey('entidades.equipos.id_equipo'), nullable=True)
    
    fecha_solicitud = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_aprobacion = db.Column(db.DateTime, nullable=True, comment="Fecha de aprobación de Gerencia")
    fecha_creacion_usuario = db.Column(db.DateTime, nullable=True, comment="Fecha de creación del usuario en el sistema")
    fecha_instalacion = db.Column(db.DateTime, nullable=True, comment="Fecha de instalación en el equipo del cliente")
    fecha_capacitacion = db.Column(db.DateTime, nullable=True, comment="Fecha de la capacitación (opcional)")
    fecha_finalizacion = db.Column(db.DateTime, nullable=True, comment="Fecha de cierre del proceso completo")

    id_usuario_asignado = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=True, comment="Usuario asignado a la instalación")
    estado = db.Column(db.Enum(EstadoInstalacion), nullable=False, default=EstadoInstalacion.PENDIENTE_APROBACION)
    observaciones = db.Column(db.Text, nullable=True, comment="Observaciones del proceso")

    caso = db.relationship('Caso', back_populates='instalaciones')
    usuario_asignado = db.relationship('Usuario', foreign_keys=[id_usuario_asignado])
    usuario_b2b = db.relationship('UsuarioB2B', foreign_keys=[id_usuario_b2b])
    equipo = db.relationship('Equipo', back_populates='instalaciones')

    def __repr__(self):
        return f"<Instalacion ID: {self.id_instalacion} para Caso ID: {self.id_caso}>"
    
    def puede_ser_aprobada(self):
        return self.estado == EstadoInstalacion.PENDIENTE_APROBACION
    
    def puede_crear_usuario(self):
        return self.estado == EstadoInstalacion.PENDIENTE_INSTALACION
    
    def puede_agendar(self):
        return self.estado in [EstadoInstalacion.USUARIO_CREADO, EstadoInstalacion.CONFIGURACION_PENDIENTE]
    
    def puede_ser_instalada(self):
        return self.estado in [EstadoInstalacion.USUARIO_CREADO, EstadoInstalacion.CONFIGURACION_PENDIENTE, EstadoInstalacion.AGENDADA]
    
    def puede_ser_finalizada(self):
        # Solo se puede finalizar después de instalar
        return self.fecha_instalacion is not None and self.estado != EstadoInstalacion.COMPLETADA
