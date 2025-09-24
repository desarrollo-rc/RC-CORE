# backend/app/api/v1/schemas/codigo_referencia_schemas.py
from marshmallow import Schema, fields, validate
from .codigo_tecnico_schemas import CodigoTecnicoSchema 
from .clasificacion_servicio_schemas import ClasificacionServicioSchema
from .clasificacion_estadistica_schemas import ClasificacionEstadisticaSchema
from .medida_schemas import MedidaAsignadaSchema
from .atributo_schemas import AtributoAsignadoSchema
from .marcas_schemas import MarcaSchema

class VersionVehiculoSimpleSchema(Schema):
    id_version = fields.Int(dump_only=True)
    nombre_version = fields.Str(dump_only=True)
    anios_fabricacion = fields.List(fields.Int(), dump_only=True)

class ModeloSimpleSchema(Schema):
    nombre_modelo = fields.Str(dump_only=True)
    marca = fields.Nested(MarcaSchema, dump_only=True, only=("nombre_marca",))

# --- Schema principal para Aplicacion ---
class AplicacionSchema(Schema):
    # Para la entrada (creación)
    id_version_vehiculo = fields.Int(required=True)
    
    # Para la salida (respuesta)
    id_codigo_referencia = fields.Int(dump_only=True)
    version_vehiculo = fields.Nested(VersionVehiculoSimpleSchema, dump_only=True)
    # Atributo anidado para mostrar el nombre completo del vehículo en el frontend
    modelo_info = fields.Nested(ModeloSimpleSchema, attribute="version_vehiculo.modelo", dump_only=True)


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
    medidas_asignadas = fields.List(fields.Nested(MedidaAsignadaSchema), dump_only=True)
    atributos_asignados = fields.List(fields.Nested(AtributoAsignadoSchema), dump_only=True)
    # Incluir aplicaciones (vehículos asociados)
    aplicaciones = fields.List(fields.Nested(AplicacionSchema), dump_only=True)


class UpdateCodigoReferenciaSchema(Schema):
    """Schema para actualizaciones parciales del Código de Referencia (sin sus hijos)."""
    codigo = fields.Str(validate=validate.Length(min=3))
    descripcion = fields.Str(allow_none=True)
    id_sub_categoria = fields.Int()
    id_det_sub_categoria = fields.Int(allow_none=True)

    id_clasificacion_servicio = fields.Int(allow_none=True)
    id_clasificacion_estadistica = fields.Int(allow_none=True)