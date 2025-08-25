# backend/app/api/v1/schemas/canal_venta_schemas.py
from marshmallow import Schema, fields, validate

class CanalVentaSchema(Schema):
    """
    Schema para la validación y serialización de datos de CanalVenta.
    """
    id_canal = fields.Int(dump_only=True)
    codigo_canal = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombre = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    activo = fields.Bool(dump_only=True)

class UpdateCanalVentaSchema(Schema):
    """
    Schema para la actualización de un Canal de Venta (campos opcionales).
    """
    codigo_canal = fields.Str(validate=validate.Length(min=1, max=20))
    nombre = fields.Str(validate=validate.Length(min=3, max=100))