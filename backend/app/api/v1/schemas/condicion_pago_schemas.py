# backend/app/api/v1/schemas/condicion_pago_schemas.py
from marshmallow import Schema, fields, validate

class CondicionPagoSchema(Schema):
    """
    Schema para la validación y serialización de datos de CondicionPago.
    """
    id_condicion_pago = fields.Int(dump_only=True)
    codigo_condicion_pago = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombre_condicion_pago = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion_condicion_pago = fields.Str(allow_none=True)
    dias_credito = fields.Int(required=True, validate=validate.Range(min=0))
    ambito = fields.Str(load_default='VENTA')
    activo = fields.Bool(dump_only=True)

class UpdateCondicionPagoSchema(Schema):
    """
    Schema para la actualización de Condiciones de Pago (campos opcionales).
    """
    codigo_condicion_pago = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_condicion_pago = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_condicion_pago = fields.Str(allow_none=True)
    dias_credito = fields.Int(validate=validate.Range(min=0))
    ambito = fields.Str()