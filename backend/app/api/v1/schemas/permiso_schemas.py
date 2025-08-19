# backend/app/api/v1/schemas/permiso_schemas.py
from marshmallow import Schema, fields, validate

class PermisoSchema(Schema):
    id_permiso = fields.Int(dump_only=True)
    nombre_permiso = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion_permiso = fields.Str(allow_none=True)

class UpdatePermisoSchema(Schema):
    nombre_permiso = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_permiso = fields.Str(allow_none=True)