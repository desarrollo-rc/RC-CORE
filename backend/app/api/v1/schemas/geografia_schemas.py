# backend/app/api/v1/schemas/geografia_schemas.py
from marshmallow import Schema, fields

class PaisSimpleSchema(Schema):
    id_pais = fields.Int(dump_only=True)
    nombre_pais = fields.Str()

class RegionSchema(Schema):
    id_region = fields.Int(dump_only=True)
    nombre_region = fields.Str()
    pais = fields.Nested(PaisSimpleSchema, dump_only=True)

class CiudadSchema(Schema):
    id_ciudad = fields.Int(dump_only=True)
    nombre_ciudad = fields.Str()

class ComunaSchema(Schema):
    id_comuna = fields.Int(dump_only=True)
    nombre_comuna = fields.Str()