# backend/app/api/v1/schemas/division_schemas.py
from marshmallow import Schema, fields, validate

class DivisionSchema(Schema):
    """
    Schema para la validación y serialización de datos de Division.
    """
    id_division = fields.Int(dump_only=True)
    codigo_division = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombre_division = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)

class UpdateDivisionSchema(Schema):
    """
    Schema para la actualización de Divisiones (campos opcionales).
    """
    codigo_division = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_division = fields.Str(validate=validate.Length(min=3, max=100))