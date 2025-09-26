# backend/app/api/v1/schemas/tipo_negocio_schemas.py
from marshmallow import Schema, fields, validate

class TipoNegocioSchema(Schema):
    """
    Schema para la validación y serialización de datos de TipoNegocio.
    """
    id_tipo_negocio = fields.Int(dump_only=True)
    codigo_tipo_negocio = fields.Str(required=True, validate=validate.Length(min=2, max=25))
    nombre_tipo_negocio = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion_tipo_negocio = fields.Str(allow_none=True)
    activo = fields.Bool(dump_only=True)

class UpdateTipoNegocioSchema(Schema):
    """
    Schema para la actualización de un Tipo de Negocio (campos opcionales).
    """
    codigo_tipo_negocio = fields.Str(validate=validate.Length(min=2, max=25))
    nombre_tipo_negocio = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_tipo_negocio = fields.Str(allow_none=True)