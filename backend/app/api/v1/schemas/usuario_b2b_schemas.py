# backend/app/api/v1/schemas/usuario_b2b_schemas.py
from marshmallow import Schema, fields, validate

class UsuarioB2BSchema(Schema):
    id_usuario_b2b = fields.Int(dump_only=True)
    nombre_completo = fields.Str()
    usuario = fields.Str()
    email = fields.Str()
    id_cliente = fields.Int()
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)
    cliente = fields.Nested("MaestroClientesSchema", dump_only=True)

class CreateUsuarioB2BSchema(Schema):
    nombre_completo = fields.Str(required=True, validate=validate.Length(min=1, max=150))
    usuario = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    id_cliente = fields.Int(required=True)

class UpdateUsuarioB2BSchema(Schema):
    nombre_completo = fields.Str(validate=validate.Length(min=1, max=150))
    usuario = fields.Str(validate=validate.Length(min=1, max=100))
    email = fields.Email()
    id_cliente = fields.Int()

usuarios_b2b_schema = UsuarioB2BSchema()
usuarios_b2b_schema_list = UsuarioB2BSchema(many=True)
create_usuario_b2b_schema = CreateUsuarioB2BSchema()
update_usuario_b2b_schema = UpdateUsuarioB2BSchema()