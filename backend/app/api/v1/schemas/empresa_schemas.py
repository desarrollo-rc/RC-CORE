# backend/app/api/v1/schemas/empresa_schemas.py
from marshmallow import Schema, fields, validate

class EmpresaSchema(Schema):
    id_empresa = fields.Int(dump_only=True)
    nombre_empresa = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    rut_empresa = fields.Str(required=True, validate=validate.Length(min=8, max=15))
    codigo_empresa = fields.Str(required=True, validate=validate.Length(min=2, max=20))
    activo = fields.Bool(dump_only=True)

class UpdateEmpresaSchema(Schema):
    nombre_empresa = fields.Str(validate=validate.Length(min=3, max=100))
    rut_empresa = fields.Str(validate=validate.Length(min=8, max=15))
    codigo_empresa = fields.Str(validate=validate.Length(min=2, max=20))