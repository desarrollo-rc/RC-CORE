# backend/app/api/v1/schemas/fabrica_schemas.py
from marshmallow import Schema, fields, validate

class FabricaSchema(Schema):
    id_fabrica = fields.Int(dump_only=True)
    nombre_fabrica = fields.Str(required=True, validate=validate.Length(min=2, max=150))
    id_pais = fields.Int(required=True)
    activo = fields.Bool(dump_only=True)

class UpdateFabricaSchema(Schema):
    nombre_fabrica = fields.Str(validate=validate.Length(min=2, max=150))
    id_pais = fields.Int()