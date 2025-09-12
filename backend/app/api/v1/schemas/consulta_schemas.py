from marshmallow import Schema, fields


class ConsultaSchema(Schema):
    id_consulta = fields.Int(dump_only=True)
    codigo_consulta = fields.Str(required=True)
    nombre = fields.Str(required=True)
    descripcion = fields.Str(allow_none=True)
    categoria = fields.Str(allow_none=True)
    tags = fields.Raw(allow_none=True)

    query_sql = fields.Str(required=True)
    parametros_defecto = fields.Raw(allow_none=True)
    version = fields.Int(required=True)

    creado_por = fields.Int(allow_none=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)
    activo = fields.Bool()


