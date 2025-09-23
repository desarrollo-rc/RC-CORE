# backend/app/api/v1/schemas/codigo_tecnico_schemas.py
from marshmallow import Schema, fields, validate

class CodigoTecnicoSchema(Schema):
    """Schema para crear y mostrar Códigos Técnicos."""
    id_codigo_tecnico = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=1))
    tipo = fields.Str(required=True, validate=validate.OneOf(["OEM", "SKU", "PLAZA", "OTRO"]))
    id_codigo_referencia = fields.Int(load_only=True) 
    activo = fields.Bool(dump_only=True)

class UpdateCodigoTecnicoSchema(Schema):
    """Schema para actualizaciones parciales de un Código Técnico."""
    codigo = fields.Str(validate=validate.Length(min=1))
    tipo = fields.Str(validate=validate.OneOf(["OEM", "SKU", "PLAZA", "OTRO"]))