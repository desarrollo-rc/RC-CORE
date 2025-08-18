# backend/app/models/analitica/historial_cambios.py
from app.extensions import db
from sqlalchemy.sql import func

class HistorialCambios(db.Model):
    __tablename__ = 'historial_cambios'
    __table_args__ = {'schema': 'analitica', 'comment': 'Log de auditoría para cambios en tablas críticas.'}

    id_historial = db.Column(db.Integer, primary_key=True)
    fecha_cambio = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    
    # Quién hizo el cambio (si está disponible en el contexto de la app)
    id_usuario = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=True)
    
    # Qué se cambió
    nombre_tabla = db.Column(db.String(100), nullable=False)
    id_registro = db.Column(db.String(100), nullable=False) # Usamos String para ser flexibles con PKs no numéricas
    nombre_campo = db.Column(db.String(100), nullable=False)
    
    # Valores
    valor_anterior = db.Column(db.Text, nullable=True)
    valor_nuevo = db.Column(db.Text, nullable=True)
    
    # Contexto
    tipo_operacion = db.Column(db.String(20), nullable=False, comment='CREATE, UPDATE, DELETE')
    
    usuario = db.relationship('Usuario')

    def __repr__(self):
        return f'<HistorialCambios {self.nombre_tabla}:{self.id_registro}>'