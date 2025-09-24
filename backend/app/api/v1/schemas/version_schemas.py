# backend/app/api/v1/schemas/version_schemas.py
from marshmallow import Schema, fields, validate
from app.models.productos.modelos import TipoTransmision, TipoTraccion, TipoCombustible
from app.api.v1.schemas.modelo_schemas import ModeloSchema

class VersionVehiculoSchema(Schema):
    """
    Schema para MOSTRAR datos de VersionVehiculo.
    """
    id_version = fields.Int(dump_only=True)
    id_modelo = fields.Int()
    nombre_version = fields.Str()
    detalle_motor = fields.Str(allow_none=True)
    cilindrada = fields.Int(allow_none=True)
    transmision = fields.Enum(TipoTransmision, by_value=False, allow_none=True)
    traccion = fields.Enum(TipoTraccion, by_value=False, allow_none=True)
    combustible = fields.Enum(TipoCombustible, by_value=False, allow_none=True)
    anios_fabricacion = fields.List(fields.Int())
    activo = fields.Bool(dump_only=True)
    modelo = fields.Nested(ModeloSchema, dump_only=True)

class CreateVersionVehiculoSchema(Schema):
    """
    Schema para CREAR una VersionVehiculo. Solo lo necesario.
    """
    nombre_version = fields.Str(required=True)
    detalle_motor = fields.Str(allow_none=True)
    cilindrada = fields.Int(allow_none=True)
    transmision = fields.Enum(TipoTransmision, by_value=False, allow_none=True)
    traccion = fields.Enum(TipoTraccion, by_value=False, allow_none=True)
    combustible = fields.Enum(TipoCombustible, by_value=False, allow_none=True)
    anios_fabricacion = fields.List(fields.Int(), required=True, validate=validate.Length(min=1))
    activo = fields.Bool(dump_only=True)
    modelo = fields.Nested(ModeloSchema, dump_only=True)


class UpdateVersionVehiculoSchema(Schema):
    """
    Schema para ACTUALIZAR una VersionVehiculo. Campos opcionales.
    """
    nombre_version = fields.Str()
    detalle_motor = fields.Str(allow_none=True)
    cilindrada = fields.Int(allow_none=True)
    transmision = fields.Enum(TipoTransmision, by_value=False, allow_none=True)
    traccion = fields.Enum(TipoTraccion, by_value=False, allow_none=True)
    combustible = fields.Enum(TipoCombustible, by_value=False, allow_none=True)
    anios_fabricacion = fields.List(fields.Int(), validate=validate.Length(min=1))