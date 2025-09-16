# backend/app/api/v1/schemas/atributo_schemas.py
from marshmallow import Schema, fields, validate

class ValorAtributoSchema(Schema):
    id_valor = fields.Int(dump_only=True)
    codigo = fields.Str()
    valor = fields.Str()
    activo = fields.Bool(dump_only=True)

class AtributoSchema(Schema):
    """
    Schema para la validación y serialización de datos de Atributo.
    """
    id_atributo = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=1, max=10))
    nombre = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)

    valores = fields.List(fields.Nested(ValorAtributoSchema), dump_only=True)

class UpdateAtributoSchema(Schema):
    """
    Schema para la actualización de Atributos (campos opcionales).
    """
    codigo = fields.Str(validate=validate.Length(min=2, max=10))
    nombre = fields.Str(validate=validate.Length(min=3, max=100))