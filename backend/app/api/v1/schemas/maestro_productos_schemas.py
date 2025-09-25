# backend/app/api/v1/schemas/maestro_productos_schemas.py
from marshmallow import Schema, fields, validate

# Schemas para relaciones anidadas simples
class CodigoReferenciaSimpleSchema(Schema):
    id_codigo_referencia = fields.Int()
    codigo = fields.Str()

class MarcaSimpleSchema(Schema):
    id_marca = fields.Int()
    nombre_marca = fields.Str()

class CalidadSimpleSchema(Schema):
    id_calidad = fields.Int()
    nombre_calidad = fields.Str()

class OrigenSimpleSchema(Schema):
    id_origen = fields.Int()
    pais = fields.Nested("PaisSchema", only=("nombre_pais",))

class FabricaSimpleSchema(Schema):
    id_fabrica = fields.Int()
    nombre_fabrica = fields.Str()

class ProveedorSimpleSchema(Schema):
    id_proveedor = fields.Int()
    nombre_proveedor = fields.Str()

# Schema para la relación Producto-Proveedor
class ProductoProveedorSchema(Schema):
    id_proveedor = fields.Int(required=True)
    costo_proveedor = fields.Decimal(as_string=True, required=True)
    codigo_producto_proveedor = fields.Str(required=True)
    es_proveedor_principal = fields.Bool(load_default=False)

    # Para la respuesta, mostramos el nombre del proveedor
    proveedor = fields.Nested(ProveedorSimpleSchema, dump_only=True)


# --- Schema Principal del Producto (SKU) ---
class MaestroProductoSchema(Schema):
    id_producto = fields.Int(dump_only=True)
    sku = fields.Str(required=True, validate=validate.Length(min=3, max=50))
    nombre_producto = fields.Str(required=True, validate=validate.Length(min=3, max=255))

    # IDs para la creación/actualización
    id_codigo_referencia = fields.Int(required=True)
    id_marca = fields.Int(required=True)
    id_calidad = fields.Int(required=True)
    id_origen = fields.Int(required=True)
    id_fabrica = fields.Int(allow_none=True)

    costo_base = fields.Decimal(as_string=True, required=True, validate=validate.Range(min=0))
    es_kit = fields.Bool(load_default=False)
    activo = fields.Bool(dump_only=True)

    # Relación con proveedores
    proveedores = fields.List(fields.Nested(ProductoProveedorSchema), required=True, validate=validate.Length(min=1))

    # Campos anidados para respuestas enriquecidas (solo lectura)
    codigo_referencia = fields.Nested(CodigoReferenciaSimpleSchema, dump_only=True)
    marca = fields.Nested(MarcaSimpleSchema, dump_only=True)
    calidad = fields.Nested(CalidadSimpleSchema, dump_only=True)
    origen = fields.Nested(OrigenSimpleSchema, dump_only=True)
    fabrica = fields.Nested(FabricaSimpleSchema, dump_only=True)


class UpdateMaestroProductoSchema(Schema):
    sku = fields.Str(validate=validate.Length(min=3, max=50))
    nombre_producto = fields.Str(validate=validate.Length(min=3, max=255))
    id_codigo_referencia = fields.Int()
    id_marca = fields.Int()
    id_calidad = fields.Int()
    id_origen = fields.Int()
    id_fabrica = fields.Int(allow_none=True)
    costo_base = fields.Decimal(as_string=True, validate=validate.Range(min=0))
    es_kit = fields.Bool()
    proveedores = fields.List(fields.Nested(ProductoProveedorSchema))