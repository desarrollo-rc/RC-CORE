# backend/app/models/productos/codigos.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria

class CodigoReferencia(db.Model, MixinAuditoria):
    __tablename__ = 'codigos_referencia'
    __table_args__ = {'schema': 'productos', 'comment': 'PRODUCTO PADRE: La entidad conceptual de un repuesto.'}

    id_codigo_referencia = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100), unique=True, nullable=False, index=True)
    descripcion = db.Column(db.String(255), nullable=True)

    id_sub_categoria = db.Column(db.Integer, db.ForeignKey('productos.sub_categorias.id_sub_categoria'), nullable=False)
    sub_categoria = db.relationship('SubCategoria', back_populates='codigos_referencia')

    id_det_sub_categoria = db.Column(db.Integer, db.ForeignKey('productos.detalles_sub_categoria.id_det_sub_categoria'), nullable=True)
    det_sub_categoria = db.relationship('DetSubCategoria', back_populates='codigos_referencia')

    id_clasificacion_servicio = db.Column(db.Integer, db.ForeignKey('productos.clasificaciones_servicio.id'), nullable=True)
    clasificacion_servicio = db.relationship('ClasificacionServicio', back_populates='codigos_referencia')

    id_clasificacion_estadistica = db.Column(db.Integer, db.ForeignKey('productos.clasificaciones_estadistica.id'), nullable=True)
    clasificacion_estadistica = db.relationship('ClasificacionEstadistica', back_populates='codigos_referencia')
    
    codigos_tecnicos = db.relationship('CodigoTecnico', back_populates='codigo_referencia', cascade="all, delete-orphan")

    aplicaciones = db.relationship('Aplicacion', back_populates='codigo_referencia', cascade="all, delete-orphan")

    atributos_asignados = db.relationship('AtributoAsignado', back_populates='codigo_referencia', cascade="all, delete-orphan")
    medidas_asignadas = db.relationship('MedidaAsignada', back_populates='codigo_referencia', cascade="all, delete-orphan")
    productos_sku = db.relationship('MaestroProductos', back_populates='codigo_referencia')


    def __repr__(self):
        return f'<CodigoReferencia {self.codigo}>'

class CodigoTecnico(db.Model, MixinAuditoria):
    __tablename__ = 'codigos_tecnicos'
    __table_args__ = {'schema': 'productos', 'comment': 'Otros códigos estándar asociados a un código de referencia'}

    id_codigo_tecnico = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100), unique=True, nullable=False)
    tipo = db.Column(db.String(50), nullable=False, default='OEM')

    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), nullable=False)
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='codigos_tecnicos')

    id_producto = db.Column(db.Integer, db.ForeignKey('productos.maestro_productos.id_producto'), nullable=True, unique=True)
    producto_sku = db.relationship('MaestroProductos', backref=db.backref('codigo_tecnico_sku', uselist=False))
    def __repr__(self):
        return f'<CodigoTecnico {self.codigo}>'