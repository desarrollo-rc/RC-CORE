# backend/app/api/v1/schemas/calidad_schemas.py
from marshmallow import Schema, fields, validate

class CalidadSchema(Schema):
    """
    Schema para la validación y serialización de datos de Calidad.
    """
    id_calidad = fields.Int(dump_only=True)
    codigo_calidad = fields.Str(required=True, validate=validate.Length(min=2, max=30))
    nombre_calidad = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion = fields.Str(allow_none=True)
    activo = fields.Bool(dump_only=True)

class UpdateCalidadSchema(Schema):
    """
    Schema para la actualización de Calidades (campos opcionales).
    """
    codigo_calidad = fields.Str(validate=validate.Length(min=2, max=30))
    nombre_calidad = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion = fields.Str(allow_none=True)