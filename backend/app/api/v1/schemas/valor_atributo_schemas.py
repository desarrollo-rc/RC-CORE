# backend/app/api/v1/schemas/valor_atributo_schemas.py
from marshmallow import Schema, fields, validate

class ValorAtributoSchema(Schema):
    id_valor = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=1))
    valor = fields.Str(required=True, validate=validate.Length(min=1))
    activo = fields.Bool(dump_only=True)

class UpdateValorAtributoSchema(Schema):
    codigo = fields.Str()
    valor = fields.Str()