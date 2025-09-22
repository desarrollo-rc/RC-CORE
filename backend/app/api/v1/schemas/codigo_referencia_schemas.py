# backend/app/api/v1/schemas/codigo_referencia_schemas.py
from marshmallow import Schema, fields, validate
from .codigo_tecnico_schemas import CodigoTecnicoSchema 

class CodigoReferenciaSchema(Schema):
    """Schema principal para crear y mostrar Codigos de Referencia."""
    id_codigo_referencia = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=3))
    descripcion = fields.Str(allow_none=True)
    id_sub_categoria = fields.Int(required=True)
    id_det_sub_categoria = fields.Int(allow_none=True, load_default=None)
    activo = fields.Bool(dump_only=True)

    codigos_tecnicos = fields.List(fields.Nested(CodigoTecnicoSchema), dump_only=True)

class UpdateCodigoReferenciaSchema(Schema):
    """Schema para actualizaciones parciales del Código de Referencia (sin sus hijos)."""
    codigo = fields.Str(validate=validate.Length(min=3))
    descripcion = fields.Str(allow_none=True)
    id_sub_categoria = fields.Int()
    id_det_sub_categoria = fields.Int(allow_none=True)

