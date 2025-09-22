from marshmallow import Schema, fields, validate

class SubCategoriaSchema(Schema):
    id_sub_categoria = fields.Int(dump_only=True)
    codigo_sub_categoria = fields.Str(required=True)
    nombre_sub_categoria = fields.Str(required=True)
    id_categoria = fields.Int(required=True, load_only=True)
    activo = fields.Bool(dump_only=True)

class UpdateSubCategoriaSchema(Schema):
    codigo_sub_categoria = fields.Str()
    nombre_sub_categoria = fields.Str()