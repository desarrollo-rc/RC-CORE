# backend/app/api/v1/schemas/clasificacion_estadistica_schemas.py
from marshmallow import Schema, fields, validate

class ClasificacionEstadisticaSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=2, max=30))
    nombre = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    activo = fields.Bool(dump_only=True)

class UpdateClasificacionEstadisticaSchema(Schema):
    codigo = fields.Str(validate=validate.Length(min=2, max=30))
    nombre = fields.Str(validate=validate.Length(min=3, max=100))