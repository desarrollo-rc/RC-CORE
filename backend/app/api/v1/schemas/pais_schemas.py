# backend/app/api/v1/schemas/pais_schemas.py
from marshmallow import Schema, fields, validate

class PaisSchema(Schema):
    id_pais = fields.Int(dump_only=True)
    nombre_pais = fields.Str(required=True, validate=validate.Length(min=2, error="El nombre debe tener al menos 2 caracteres."))

class UpdatePaisSchema(Schema):
    nombre_pais = fields.Str(required=True, validate=validate.Length(min=2, error="El nombre debe tener al menos 2 caracteres."))