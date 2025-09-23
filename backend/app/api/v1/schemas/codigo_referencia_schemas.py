# backend/app/api/v1/schemas/codigo_referencia_schemas.py
from marshmallow import Schema, fields, validate
from .codigo_tecnico_schemas import CodigoTecnicoSchema 
from .clasificacion_servicio_schemas import ClasificacionServicioSchema
from .clasificacion_estadistica_schemas import ClasificacionEstadisticaSchema

class CodigoReferenciaSchema(Schema):
    """Schema principal para crear y mostrar Codigos de Referencia."""
    id_codigo_referencia = fields.Int(dump_only=True)
    codigo = fields.Str(required=True, validate=validate.Length(min=3))
    descripcion = fields.Str(allow_none=True)
    id_sub_categoria = fields.Int(required=True)
    id_det_sub_categoria = fields.Int(allow_none=True, load_default=None)

    id_clasificacion_servicio = fields.Int(allow_none=True, load_default=None)
    id_clasificacion_estadistica = fields.Int(allow_none=True, load_default=None)

    activo = fields.Bool(dump_only=True)

    codigos_tecnicos = fields.List(fields.Nested(CodigoTecnicoSchema), dump_only=True)
    clasificacion_servicio = fields.Nested(ClasificacionServicioSchema, dump_only=True)
    clasificacion_estadistica = fields.Nested(ClasificacionEstadisticaSchema, dump_only=True)


class UpdateCodigoReferenciaSchema(Schema):
    """Schema para actualizaciones parciales del Código de Referencia (sin sus hijos)."""
    codigo = fields.Str(validate=validate.Length(min=3))
    descripcion = fields.Str(allow_none=True)
    id_sub_categoria = fields.Int()
    id_det_sub_categoria = fields.Int(allow_none=True)

    id_clasificacion_servicio = fields.Int(allow_none=True)
    id_clasificacion_estadistica = fields.Int(allow_none=True)