from marshmallow import Schema, fields, validate

class SegmentoClienteSchema(Schema):
    """
    Schema para la validación y serialización de datos de SegmentoCliente.
    """
    id_segmento_cliente = fields.Int(dump_only=True)
    codigo_segmento_cliente = fields.Str(required=True, validate=validate.Length(min=1))
    nombre_segmento_cliente = fields.Str(required=True)
    descripcion_segmento_cliente = fields.Str(allow_none=True)
    activo = fields.Bool(load_default=True)

class UpdateSegmentoClienteSchema(Schema):
    """
    Schema para la actualización de SegmentoCliente (campos opcionales).
    """
    codigo_segmento_cliente = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_segmento_cliente = fields.Str(validate=validate.Length(min=1, max=100))
    descripcion_segmento_cliente = fields.Str(allow_none=True)