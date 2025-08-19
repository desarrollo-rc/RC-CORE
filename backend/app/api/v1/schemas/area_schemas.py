# backend/app/api/v1/schemas/area_schemas.py
from marshmallow import Schema, fields, validate

class AreaSchema(Schema):
    """
    Schema para la validación y serialización de datos de Area.
    """
    id_area = fields.Int(dump_only=True)
    codigo_area = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombre_area = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion_area = fields.Str(allow_none=True)
    activo = fields.Bool(dump_only=True)

class UpdateAreaSchema(Schema):
    """
    Schema para la actualización de Areas (campos opcionales).
    """
    codigo_area = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_area = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_area = fields.Str(allow_none=True)