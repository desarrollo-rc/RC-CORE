# backend/app/api/v1/schemas/equipo_schemas.py
from marshmallow import Schema, fields, validate

class EquipoSchema(Schema):
    id_equipo = fields.Int(dump_only=True)
    id_usuario_b2b = fields.Int(required=True)
    nombre_equipo = fields.Str(required=True, validate=validate.Length(min=1))
    mac_address = fields.Str(required=True, validate=validate.Length(min=1))
    procesador = fields.Str(required=True, validate=validate.Length(min=1))
    placa_madre = fields.Str(required=True, validate=validate.Length(min=1))
    disco_duro = fields.Str(required=True, validate=validate.Length(min=1))
    estado_alta = fields.Str(dump_only=True)
    estado = fields.Bool(dump_only=True)

class CreateEquipoSchema(Schema):
    id_usuario_b2b = fields.Int(required=True)
    nombre_equipo = fields.Str(required=True, validate=validate.Length(min=1))
    mac_address = fields.Str(required=True, validate=validate.Length(min=1))
    procesador = fields.Str(required=True, validate=validate.Length(min=1))
    placa_madre = fields.Str(required=True, validate=validate.Length(min=1))
    disco_duro = fields.Str(required=True, validate=validate.Length(min=1))

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