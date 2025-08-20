# backend/app/api/v1/schemas/vendedor_schemas.py
from marshmallow import Schema, fields, validate

class VendedorSchema(Schema):
    id_vendedor = fields.Int(dump_only=True)
    codigo_vendedor_sap = fields.Str()

    usuario = fields.Nested("UsuarioSimpleSchema", dump_only=True)

    id_usuario = fields.Int(load_only=True, required=True)

class VendedorUpdateSchema(Schema):
    codigo_vendedor_sap = fields.Str()