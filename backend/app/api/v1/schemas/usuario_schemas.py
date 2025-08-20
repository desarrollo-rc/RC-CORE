# backend/app/api/v1/schemas/usuario_schemas.py
from marshmallow import Schema, fields, validate

class RolSchema(Schema):
    id_rol = fields.Int()
    nombre_rol = fields.Str()

class AreaSchema(Schema):
    id_area = fields.Int()
    nombre_area = fields.Str()

class UsuarioSimpleSchema(Schema):
    id_usuario = fields.Int()
    nombre_completo = fields.Str()
    email = fields.Email()

class UsuarioBaseSchema(Schema):
    nombre_completo = fields.Str()
    email = fields.Email()
    telefono = fields.Str(allow_none=True)
    id_area = fields.Int()
    id_jefe_directo = fields.Int(allow_none=True, load_default=None)
    roles_ids = fields.List(fields.Int(), load_default=[])

class UsuarioSchema(UsuarioBaseSchema):
    nombre_completo = fields.Str(required=True)
    email = fields.Email(required=True)
    id_area = fields.Int(required=True)
    password = fields.Str(required=True, load_only=True, validate=validate.Length(min=8))

class UsuarioResponseSchema(UsuarioBaseSchema):
    id_usuario = fields.Int(dump_only=True)
    activo = fields.Bool(dump_only=True)
    area = fields.Nested(AreaSchema, dump_only=True)
    roles = fields.List(fields.Nested(RolSchema), dump_only=True)
    jefe_directo = fields.Nested(UsuarioSimpleSchema, dump_only=True)
    subordinados = fields.List(fields.Nested(UsuarioSimpleSchema), dump_only=True)
    
    perfil_vendedor = fields.Nested("VendedorSchema", dump_only=True, allow_none=True)

    class Meta:
        exclude = ('roles_ids', 'id_jefe_directo')

class UpdateUsuarioSchema(Schema):
    nombre_completo = fields.Str()
    email = fields.Email()
    telefono = fields.Str(allow_none=True)
    password = fields.Str(load_only=True, validate=validate.Length(min=8))
    id_area = fields.Int()
    id_jefe_directo = fields.Int(allow_none=True)
    roles_ids = fields.List(fields.Int())