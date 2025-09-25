# backend/app/api/v1/schemas/proveedor_schemas.py
from marshmallow import Schema, fields, validate
from .pais_schemas import PaisSchema

class ProveedorSchema(Schema):
    id_proveedor = fields.Int(dump_only=True)
    codigo_proveedor = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    nombre_proveedor = fields.Str(required=True, validate=validate.Length(min=3, max=150))
    rut_proveedor = fields.Str(required=True, validate=validate.Length(min=8, max=15))
    id_pais = fields.Int(required=True)
    direccion = fields.Str(allow_none=True)
    telefono = fields.Str(allow_none=True)
    email = fields.Email(allow_none=True)
    activo = fields.Bool(dump_only=True)
    
    # Campo anidado para mostrar el nombre del país en las respuestas
    pais = fields.Nested(PaisSchema, dump_only=True)

class UpdateProveedorSchema(Schema):
    codigo_proveedor = fields.Str(validate=validate.Length(min=1, max=50))
    nombre_proveedor = fields.Str(validate=validate.Length(min=3, max=150))
    rut_proveedor = fields.Str(validate=validate.Length(min=8, max=15))
    id_pais = fields.Int()
    direccion = fields.Str(allow_none=True)
    telefono = fields.Str(allow_none=True)
    email = fields.Email(allow_none=True)