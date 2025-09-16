# backend/app/api/v1/schemas/atributo_schemas.py
from marshmallow import Schema, fields, validate

class AtributoSchema(Schema):
    """
    Schema para la validación y serialización de datos de Atributo.
    """
    id_atributo = fields.Int(dump_only=True)
    nombre = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)

class UpdateAtributoSchema(Schema):
    """
    Schema para la actualización de Atributos (campos opcionales).
    """
    nombre = fields.Str(validate=validate.Length(min=3, max=100))