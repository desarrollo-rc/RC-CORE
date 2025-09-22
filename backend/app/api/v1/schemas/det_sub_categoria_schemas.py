from marshmallow import Schema, fields, validate

class DetSubCategoriaSchema(Schema):
    id_det_sub_categoria = fields.Int(dump_only=True)
    codigo_det_sub_categoria = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombre_det_sub_categoria = fields.Str(required=True, validate=validate.Length(min=3))
    id_sub_categoria = fields.Int(required=True)
    activo = fields.Bool(dump_only=True)

class UpdateDetSubCategoriaSchema(Schema):
    codigo_det_sub_categoria = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_det_sub_categoria = fields.Str(validate=validate.Length(min=3))