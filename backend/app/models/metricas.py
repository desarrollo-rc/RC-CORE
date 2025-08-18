# backend/app/models/metricas.py
from app.extensions import db
from sqlalchemy.dialects.postgresql import JSONB

class ClienteMetricas(db.Model):
    __tablename__ = 'cliente_metricas'
    __table_args__ = {'schema': 'analitica', 'comment': 'Almacena KPIs y métricas agregadas por cliente para una consulta rápida.'}

    id_metrica = db.Column(db.Integer, primary_key=True)

    #Llave Foranea y Relación 1 a 1
    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), unique=True, nullable=False)
    cliente = db.relationship('MaestroClientes', back_populates='metricas')

    # --- KPIs Universales del Cliente ---
    fecha_ultima_compra = db.Column(db.DateTime, nullable=True)
    monto_total_global = db.Column(db.Numeric(12, 2), nullable=True, server_default='0.0')
    ticket_promedio_global = db.Column(db.Numeric(12, 2), nullable=True, server_default='0.0')

    # --- KPIs Desglosados por Canal (Flexibilidad Máxima) ---
    metricas_por_canal = db.Column(JSONB, nullable=True, comment='Objeto JSON con KPIs por canal de venta (B2B, Call Center, etc)')

    def __repr__(self):
        return f'<ClienteMetricas {self.id_metrica}>'
    