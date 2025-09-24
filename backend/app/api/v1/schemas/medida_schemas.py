# backend/app/api/v1/schemas/medida_schemas.py
from marshmallow import Schema, fields, validate

class MedidaSchema(Schema):
    """
    Schema para la validación y serialización de datos de Medida.
    """
    id_medida = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=2, max=10))
    nombre = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    unidad = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)

class UpdateMedidaSchema(Schema):
    """
    Schema para la actualización de Medidas (campos opcionales).
    """
    codigo = fields.Str(validate=validate.Length(min=2, max=10))
    nombre = fields.Str(validate=validate.Length(min=2, max=100))
    unidad = fields.Str(validate=validate.Length(min=1, max=20))

class MedidaAsignadaSchema(Schema):
    id_codigo_referencia = fields.Int(dump_only=True)
    id_medida = fields.Int(required=True)
    valor = fields.Decimal(as_string=True, required=True, validate=validate.Range(min=0, error="El valor no puede ser negativo."))
    medida = fields.Nested('MedidaSchema', dump_only=True)

class UpdateMedidaAsignadaSchema(Schema):
    valor = fields.Decimal(as_string=True, required=True, validate=validate.Range(min=0, error="El valor no puede ser negativo."))
