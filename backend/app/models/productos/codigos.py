# backend/app/models/productos/codigos.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria

class CodigoReferencia(db.Model, MixinAuditoria):
    __tablename__ = 'codigos_referencia'
    __table_args__ = {'schema': 'productos', 'comment': 'El estándar universal de un repuesto (OEM o de mercado)'}

    id_codigo_referencia = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100), unique=True, nullable=False, index=True)
    descripcion = db.Column(db.String(255), nullable=True)
    id_sub_categoria = db.Column(db.Integer, db.ForeignKey('productos.sub_categorias.id_sub_categoria'), nullable=False)

    # Relaciones
    productos = db.relationship('MaestroProductos', back_populates='codigo_referencia')
    aplicaciones = db.relationship('Aplicacion', back_populates='codigo_referencia', cascade="all, delete-orphan")
    codigos_tecnicos = db.relationship('CodigoTecnico', back_populates='codigo_referencia', cascade="all, delete-orphan")
    sub_categoria = db.relationship('SubCategoria', back_populates='codigos_referencia')


    atributos_asignados = db.relationship('AtributoAsignado', back_populates='codigo_referencia', cascade="all, delete-orphan")
    medidas_asignadas = db.relationship('MedidaAsignada', back_populates='codigo_referencia', cascade="all, delete-orphan")

    def __repr__(self):
        return f'<CodigoReferencia {self.codigo}>'

class CodigoTecnico(db.Model, MixinAuditoria):
    __tablename__ = 'codigos_tecnicos'
    __table_args__ = {'schema': 'productos', 'comment': 'Otros códigos estándar asociados a un código de referencia'}

    id_codigo_tecnico = db.Column(db.Integer, primary_key=True)
    codigo = db.Column(db.String(100), unique=True, nullable=False)
    descripcion = db.Column(db.String(255), nullable=True)

    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), nullable=False)
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='codigos_tecnicos')

    def __repr__(self):
        return f'<CodigoTecnico {self.codigo}>'