# backend/app/models/soporte/base_conocimiento.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from .casos import casos_conocimiento

class BaseConocimiento(db.Model):
    __tablename__ = 'base_conocimiento'
    __table_args__ = {'schema': 'soporte', 'comment': 'Artículos para resolver problemas comunes'}

    id_articulo = db.Column(db.Integer, primary_key=True)
    problema_frecuente = db.Column(db.String(255), nullable=False, unique=True)
    solucion_detallada = db.Column(db.Text, nullable=False, comment="Puede contener Markdown para formato enriquecido")
    
    id_tipo_caso = db.Column(db.Integer, db.ForeignKey('soporte.tipos_caso.id_tipo_caso'), nullable=False)

    tipo_caso = db.relationship('TipoCaso', back_populates='articulos_conocimiento')
    casos_relacionados = db.relationship('Caso', secondary=casos_conocimiento, back_populates='articulos_relacionados')
    
    def __repr__(self):
        return f"<BaseConocimiento {self.problema}>"