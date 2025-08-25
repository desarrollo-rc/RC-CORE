# backend/app/api/v1/schemas/direccion_schemas.py
from marshmallow import Schema, fields, validate

class DireccionSchema(Schema):
    """
    Schema para la validación y serialización de datos de Direccion.
    """
    id_direccion = fields.Int(dump_only=True)
    calle = fields.Str(required=True)
    numero = fields.Str()
    comuna = fields.Str(required=True)
    ciudad = fields.Str(required=True)
    region = fields.Str(required=True)
    codigo_postal = fields.Str()
    es_facturacion = fields.Bool(load_default=False)
    es_despacho = fields.Bool(load_default=True)
    id_cliente = fields.Int(required=True, load_only=True)

class UpdateDireccionSchema(Schema):
    """
    Schema para la actualización de una Direccion (campos opcionales).
    """
    calle = fields.Str()
    numero = fields.Str(allow_none=True)
    comuna = fields.Str()
    ciudad = fields.Str()
    region = fields.Str()
    codigo_postal = fields.Str(allow_none=True)
    es_facturacion = fields.Bool()
    es_despacho = fields.Bool()