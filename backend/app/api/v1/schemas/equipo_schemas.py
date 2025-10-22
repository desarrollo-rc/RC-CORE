# backend/app/api/v1/schemas/equipo_schemas.py
from marshmallow import Schema, fields, validate
from .usuario_b2b_schemas import UsuarioB2BSchema

class EquipoSchema(Schema):
    id_equipo = fields.Int(dump_only=True)
    id_usuario_b2b = fields.Int(required=True)
    nombre_equipo = fields.Str(required=True, validate=validate.Length(min=1))
    mac_address = fields.Str(required=True, validate=validate.Length(min=1))
    procesador = fields.Str(required=True, validate=validate.Length(min=1))
    placa_madre = fields.Str(required=True, validate=validate.Length(min=1))
    disco_duro = fields.Str(required=True, validate=validate.Length(min=1))
    estado_alta = fields.Method("get_estado_alta", dump_only=True)
    activo = fields.Bool(attribute="estado", dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True, allow_none=True)
    usuario_b2b = fields.Nested(UsuarioB2BSchema, dump_only=True)
    
    def get_estado_alta(self, obj):
        if hasattr(obj, 'estado_alta'):
            return obj.estado_alta.value if hasattr(obj.estado_alta, 'value') else str(obj.estado_alta)
        return None

class CreateEquipoSchema(Schema):
    id_usuario_b2b = fields.Int(required=True)
    nombre_equipo = fields.Str(required=True, validate=validate.Length(min=1))
    mac_address = fields.Str(required=True, validate=validate.Length(min=1))
    procesador = fields.Str(required=True, validate=validate.Length(min=1))
    placa_madre = fields.Str(required=True, validate=validate.Length(min=1))
    disco_duro = fields.Str(required=True, validate=validate.Length(min=1))
    fecha_creacion_personalizada = fields.Str(required=False, allow_none=True)

class UpdateEquipoSchema(Schema):
    nombre_equipo = fields.Str(required=True, validate=validate.Length(min=1))
    mac_address = fields.Str(required=True, validate=validate.Length(min=1))
    procesador = fields.Str(required=True, validate=validate.Length(min=1))
    placa_madre = fields.Str(required=True, validate=validate.Length(min=1))
    disco_duro = fields.Str(required=True, validate=validate.Length(min=1))
    estado_alta = fields.Str(required=True, validate=validate.OneOf(["PENDIENTE", "APROBADO", "RECHAZADO"]))

equipo_schema = EquipoSchema()
equipos_schema = EquipoSchema(many=True)
create_equipo_schema = CreateEquipoSchema()
update_equipo_schema = UpdateEquipoSchema()