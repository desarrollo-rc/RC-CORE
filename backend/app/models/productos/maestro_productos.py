# backend/app/models/productos/maestro_productos.py
from app.extensions import db
from app.models.entidades.entidades_auxiliares import MixinAuditoria
from sqlalchemy.orm import validates

class MaestroProductos(db.Model, MixinAuditoria):
    __tablename__ = 'maestro_productos'
    __table_args__ = {'schema': 'productos', 'comment': 'PRODUCTO HIJO (SKU): El producto físico y vendible en inventario.'}

    id_producto = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(50), unique=True, nullable=False, index=True)
    nombre_producto = db.Column(db.String(255), nullable=False) # Nombre específico de la variante si es necesario
    
    id_codigo_referencia = db.Column(db.Integer, db.ForeignKey('productos.codigos_referencia.id_codigo_referencia'), nullable=False)
    codigo_referencia = db.relationship('CodigoReferencia', back_populates='productos_sku')

    id_marca = db.Column(db.Integer, db.ForeignKey('productos.marcas.id_marca'), nullable=False)
    id_calidad = db.Column(db.Integer, db.ForeignKey('productos.calidades.id_calidad'), nullable=False)
    id_origen = db.Column(db.Integer, db.ForeignKey('productos.origenes.id_origen'), nullable=True)
    id_fabrica = db.Column(db.Integer, db.ForeignKey('productos.fabricas.id_fabrica'), nullable=True)

    costo_base = db.Column(db.Numeric(12, 2), nullable=False, default=0.0)
    es_kit = db.Column(db.Boolean, default=False)
    
    marca = db.relationship('Marca', back_populates='productos')
    calidad = db.relationship('Calidad', back_populates='productos')
    origen = db.relationship('Origen', back_populates='productos')
    fabrica = db.relationship('Fabrica', back_populates='productos')
    proveedores = db.relationship('ProductoProveedor', back_populates='producto', cascade="all, delete-orphan")
    
    # --- AUDITORÍA ---
    id_usuario_creacion = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), nullable=False)
    creador = db.relationship('Usuario', foreign_keys=[id_usuario_creacion])
    razon_bloqueo = db.Column(db.String(255), nullable=True)

    @validates('nombre_producto', 'sku')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        return value.strip().upper() if key == 'sku' else value.strip()
    
    def __repr__(self):
        return f'<MaestroProductos {self.sku}>'

class ProductoProveedor(db.Model, MixinAuditoria):
    __tablename__ = 'producto_proveedor'
    __table_args__ = {'schema': 'productos', 'comment': 'Tabla N-M entre SKUs y Proveedores'}

    id_producto = db.Column(db.Integer, db.ForeignKey('productos.maestro_productos.id_producto'), primary_key=True)
    id_proveedor = db.Column(db.Integer, db.ForeignKey('entidades.maestro_proveedores.id_proveedor'), primary_key=True)

    # --- Atributos específicos de esta relación ---
    costo_proveedor = db.Column(db.Numeric(12, 2), nullable=False)
    codigo_producto_proveedor = db.Column(db.String(100), comment="El código que el proveedor usa para este producto")
    es_proveedor_principal = db.Column(db.Boolean, default=False)
    
    # --- Relaciones SQLAlchemy ---
    producto = db.relationship('MaestroProductos', back_populates='proveedores')
    proveedor = db.relationship('MaestroProveedores', back_populates='productos')

    def __repr__(self):
        return f'<ProductoProveedor Prod:{self.id_producto} - Prov:{self.id_proveedor}>'
