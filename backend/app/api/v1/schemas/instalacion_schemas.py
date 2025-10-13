# backend/app/api/v1/schemas/instalacion_schemas.py
from marshmallow import Schema, fields, validate

class InstalacionSchema(Schema):
    id_instalacion = fields.Int(dump_only=True)
    id_caso = fields.Int(required=True)
    id_usuario_b2b = fields.Int(allow_none=True)
    id_equipo = fields.Int(allow_none=True)
    id_usuario_asignado = fields.Int(allow_none=True)
    
    fecha_solicitud = fields.DateTime(dump_only=True)
    fecha_aprobacion = fields.DateTime(allow_none=True)
    fecha_creacion_usuario = fields.DateTime(allow_none=True)
    fecha_instalacion = fields.DateTime(allow_none=True)
    fecha_capacitacion = fields.DateTime(allow_none=True)
    fecha_finalizacion = fields.DateTime(allow_none=True)
    
    estado = fields.Str(dump_only=True)
    observaciones = fields.Str(allow_none=True)
    activa = fields.Bool(dump_only=True)
    
    caso = fields.Nested("CasoSchema", dump_only=True, only=("id_caso", "titulo"))
    usuario_b2b = fields.Nested("UsuarioB2BSchema", dump_only=True, only=("id_usuario_b2b", "nombre_completo", "usuario", "email", "id_cliente"))
    equipo = fields.Nested("EquipoSchema", dump_only=True, only=("id_equipo", "nombre_equipo", "mac_address", "procesador", "placa_madre", "disco_duro", "activo", "estado_alta"))

class CreateInstalacionSchema(Schema):
    id_caso = fields.Int(required=True)
    id_usuario_b2b = fields.Int(allow_none=True)
    observaciones = fields.Str(allow_none=True)

class UpdateInstalacionSchema(Schema):
    fecha_instalacion = fields.DateTime(allow_none=True)
    estado = fields.Str(validate=validate.OneOf([
        "Pendiente Aprobación", 
        "Pendiente Instalación", 
        "Usuario Creado",
        "Configuración Pendiente",
        "Agendada", 
        "Completada", 
        "Cancelada"
    ]))
    observaciones = fields.Str(allow_none=True)

class CrearUsuarioInstalacionSchema(Schema):
    nombre_completo = fields.Str(required=True)
    usuario = fields.Str(required=True)
    email = fields.Email(required=True)
    password = fields.Str(allow_none=True)
    id_usuario_b2b = fields.Int(allow_none=True)
    existe_en_sistema = fields.Bool(load_default=False)
    existe_en_corp = fields.Bool(load_default=False)

class ActivarEquipoSchema(Schema):
    equipo_id = fields.Int(required=True)

class FinalizarInstalacionSchema(Schema):
    capacitacion_realizada = fields.Bool(load_default=True)

instalacion_schema = InstalacionSchema()
instalaciones_schema = InstalacionSchema(many=True)
create_instalacion_schema = CreateInstalacionSchema()
update_instalacion_schema = UpdateInstalacionSchema()
crear_usuario_schema = CrearUsuarioInstalacionSchema()
activar_equipo_schema = ActivarEquipoSchema()
finalizar_schema = FinalizarInstalacionSchema()