# backend/app/api/v1/schemas/instalacion_schemas.py
from marshmallow import Schema, fields, validate

class InstalacionSchema(Schema):
    id = fields.Int(dump_only=True)
    id_caso = fields.Int(required=True)
    id_usuario_b2b = fields.Int(required=True)
    fecha_visita = fields.DateTime(allow_none=True)
    fecha_instalacion = fields.DateTime(allow_none=True)
    estado = fields.Str(dump_only=True)
    observaciones = fields.Str(allow_none=True)
    
    caso = fields.Nested("CasoSchema", dump_only=True)
    usuario_b2b = fields.Nested("UsuarioB2BSchema", dump_only=True)

class CreateInstalacionSchema(Schema):
    id_caso = fields.Int(required=True)
    id_usuario_b2b = fields.Int(required=True)
    fecha_visita = fields.DateTime(allow_none=True)
    observaciones = fields.Str(allow_none=True)

class UpdateInstalacionSchema(Schema):
    fecha_visita = fields.DateTime(allow_none=True)
    fecha_instalacion = fields.DateTime(allow_none=True)
    estado = fields.Str(validate=validate.OneOf(["Pendiente Aprobación", "Pendiente Instalación", "Agendada", "Completada", "Cancelada"]))
    observaciones = fields.Str(allow_none=True)

instalacion_schema = InstalacionSchema()
instalaciones_schema = InstalacionSchema(many=True)
create_instalacion_schema = CreateInstalacionSchema()
update_instalacion_schema = UpdateInstalacionSchema()