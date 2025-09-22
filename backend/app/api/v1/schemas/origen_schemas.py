# backend/app/api/v1/schemas/origen_schemas.py
from marshmallow import Schema, fields
from .pais_schemas import PaisSchema

class OrigenSchema(Schema):
    id_origen = fields.Int(dump_only=True)
    id_pais = fields.Int(required=True)
    
    pais = fields.Nested(PaisSchema, dump_only=True)

class CreateOrigenSchema(Schema):
    id_pais = fields.Int(required=True)