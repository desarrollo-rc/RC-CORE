# backend/app/models/productos/categorias.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class Division(db.Model, MixinAuditoria):
    __tablename__ = 'divisiones'
    __table_args__ = {'schema': 'productos', 'comment': 'Divisiones de los productos (Repuestos, Accesorios, etc.)'}

    id_division = db.Column(db.Integer, primary_key=True)
    codigo_division = db.Column(db.String(20), unique=True, nullable=False)
    nombre_division = db.Column(db.String(100), nullable=False)

    categorias = db.relationship('Categoria', back_populates='division', cascade="all, delete-orphan")

class Categoria(db.Model, MixinAuditoria):
    __tablename__ = 'categorias'
    __table_args__ = {'schema': 'productos', 'comment': 'Categorías de los productos (Electrónica, Mecánica, etc.)'}

    id_categoria = db.Column(db.Integer, primary_key=True)
    codigo_categoria = db.Column(db.String(20), unique=True, nullable=False)
    nombre_categoria = db.Column(db.String(100), nullable=False)

    id_division = db.Column(db.Integer, db.ForeignKey('productos.divisiones.id_division'), nullable=False)
    division = db.relationship('Division', back_populates='categorias')

    sub_categorias = db.relationship('SubCategoria', back_populates='categoria', cascade="all, delete-orphan")

    @validates('codigo_categoria', 'nombre_categoria')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo_categoria' else value.strip()
    
    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_categoria=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<Categoria {self.nombre_categoria}>'

class SubCategoria(db.Model, MixinAuditoria):
    __tablename__ = 'sub_categorias'
    __table_args__ = {'schema': 'productos', 'comment': 'Subcategorías de las categorías (Electrónica, Mecánica, etc.)'}

    id_sub_categoria = db.Column(db.Integer, primary_key=True)
    id_categoria = db.Column(db.Integer, db.ForeignKey('productos.categorias.id_categoria'), nullable=False)
    codigo_sub_categoria = db.Column(db.String(20), unique=True, nullable=False)
    nombre_sub_categoria = db.Column(db.String(100), nullable=False)
    
    categoria = db.relationship('Categoria', back_populates='sub_categorias')

    detalles_sub_categoria = db.relationship('DetSubCategoria', back_populates='sub_categoria')
    codigos_referencia = db.relationship('CodigoReferencia', back_populates='sub_categoria')

    @validates('codigo_sub_categoria', 'nombre_sub_categoria')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'codigo_sub_categoria' else value.strip()
    
    @classmethod
    def get_by_codigo(cls, codigo):
        return cls.query.filter_by(codigo_sub_categoria=codigo.upper().strip(), activo=True).first()

    def __repr__(self):
        return f'<SubCategoria {self.nombre_sub_categoria}>'

class DetSubCategoria(db.Model, MixinAuditoria):
    __tablename__ = 'detalles_sub_categoria'
    __table_args__ = {'schema': 'productos', 'comment': 'Detalles de las subcategorías'}

    id_det_sub_categoria = db.Column(db.Integer, primary_key=True)
    nombre_det_sub_categoria = db.Column(db.String(100), nullable=False)
    
    id_sub_categoria = db.Column(db.Integer, db.ForeignKey('productos.sub_categorias.id_sub_categoria'), nullable=False)
    sub_categoria = db.relationship('SubCategoria', back_populates='detalles_sub_categoria')