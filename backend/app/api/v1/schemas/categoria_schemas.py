from marshmallow import Schema, fields, validate

class CategoriaSchema(Schema):
    id_categoria = fields.Int(dump_only=True)
    codigo_categoria = fields.Str(required=True)
    nombre_categoria = fields.Str(required=True)
    id_division = fields.Int(required=True)
    activo = fields.Bool(dump_only=True)

class UpdateCategoriaSchema(Schema):
    codigo_categoria = fields.Str()
    nombre_categoria = fields.Str()