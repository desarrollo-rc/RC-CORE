# backend/app/models/productos/aplicaciones.py
from app.extensions import db

class Aplicacion(db.Model):
    __tablename__ = 'aplicaciones'
    __table_args__ = {'schema': 'productos', 'comment': 'Tabla de unión que define qué repuesto universal le sirve a qué versión de vehículo'}

    # Llave primaria compuesta
    id_version_vehiculo = db.Column(db.Integer, db.ForeignKey('productos.versiones_vehiculo.id_version'), primary_key=True)
    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), primary_key=True)

    # Relaciones para poder navegar desde la aplicación
    version_vehiculo = db.relationship('VersionVehiculo', back_populates='aplicaciones')
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='aplicaciones')

    def __repr__(self):
        try:
            return f'<Aplicacion: {self.version_vehiculo.nombre_version} -> {self.codigo_referencia.codigo}>'
        except Exception:
            return f'<Aplicacion V_ID:{self.id_version_vehiculo} -> C_ID:{self.id_codigo_referencia}>'
