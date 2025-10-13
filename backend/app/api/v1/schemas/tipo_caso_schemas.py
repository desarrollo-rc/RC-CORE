# backend/app/api/v1/schemas/tipo_caso_schemas.py
from marshmallow import Schema, fields, validate

CATEGORIAS_VALIDAS = [
    'INSTALACION_CLIENTE_NUEVO',
    'INSTALACION_USUARIO_ADICIONAL',
    'INSTALACION_CAMBIO_EQUIPO',
    'SOPORTE_TECNICO',
    'CONSULTA',
    'BLOQUEO',
    'OTRO'
]

class TipoCasoSchema(Schema):
    id_tipo_caso = fields.Int(dump_only=True)
    codigo_tipo_caso = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    nombre_tipo_caso = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    descripcion_tipo_caso = fields.Str(allow_none=True, validate=validate.Length(max=255))
    categoria_uso = fields.Str(allow_none=True, validate=validate.OneOf(CATEGORIAS_VALIDAS))
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)

class CreateTipoCasoSchema(Schema):
    codigo_tipo_caso = fields.Str(required=True, validate=validate.Length(min=1, max=50))
    nombre_tipo_caso = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    descripcion_tipo_caso = fields.Str(allow_none=True, validate=validate.Length(max=255))
    categoria_uso = fields.Str(allow_none=True, validate=validate.OneOf(CATEGORIAS_VALIDAS))

class UpdateTipoCasoSchema(Schema):
    codigo_tipo_caso = fields.Str(validate=validate.Length(min=1, max=50))
    nombre_tipo_caso = fields.Str(validate=validate.Length(min=1, max=100))
    descripcion_tipo_caso = fields.Str(allow_none=True, validate=validate.Length(max=255))
    categoria_uso = fields.Str(allow_none=True, validate=validate.OneOf(CATEGORIAS_VALIDAS))

tipo_caso_schema = TipoCasoSchema()
tipos_caso_schema = TipoCasoSchema(many=True)
create_tipo_caso_schema = CreateTipoCasoSchema()
update_tipo_caso_schema = UpdateTipoCasoSchema()

