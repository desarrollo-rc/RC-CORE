# backend/app/api/v1/schemas/tipo_cliente_schemas.py
from marshmallow import Schema, fields, validate

class TipoClienteSchema(Schema):
    """
    Schema para la validación y serialización de datos de TipoCliente.
    """
    id_tipo_cliente = fields.Int(dump_only=True)
    codigo_tipo_cliente = fields.Str(required=True, validate=validate.Length(min=3))
    nombre_tipo_cliente = fields.Str(required=True)
    descripcion_tipo_cliente = fields.Str()
    activo = fields.Bool(load_default=True)

    class Meta:
        ordered = True
        strict = True

class UpdateTipoClienteSchema(Schema):
    """
    Schema para la actualización de Tipos de Cliente (todos los campos son opcionales).
    """
    codigo_tipo_cliente = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_tipo_cliente = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_tipo_cliente = fields.Str(allow_none=True)