# backend/app/api/v1/schemas/caso_schemas.py
from marshmallow import Schema, fields, validate

class CasoSchema(Schema):
    id_caso = fields.Int(dump_only=True)
    titulo = fields.Str(required=True)
    descripcion = fields.Str(required=True)
    estado = fields.Str(required=True)
    prioridad = fields.Str(required=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)

class CreateCasoSchema(Schema):
    titulo = fields.Str(required=True, validate=validate.Length(min=1, max=255))
    descripcion = fields.Str(required=True, validate=validate.Length(min=1))
    estado = fields.Str(required=True, validate=validate.OneOf(["Abierto", "En Progreso", "Resuelto", "Cerrado"]))
    prioridad = fields.Str(required=True, validate=validate.OneOf(["Baja", "Media", "Alta", "Urgente"]))

class UpdateCasoSchema(Schema):
    titulo = fields.Str(validate=validate.Length(min=1, max=255))
    descripcion = fields.Str(validate=validate.Length(min=1))
    estado = fields.Str(validate=validate.OneOf(["Abierto", "En Progreso", "Resuelto", "Cerrado"]))
    prioridad = fields.Str(validate=validate.OneOf(["Baja", "Media", "Alta", "Urgente"]))

caso_schema = CasoSchema()
casos_schema = CasoSchema(many=True)
create_caso_schema = CreateCasoSchema()
update_caso_schema = UpdateCasoSchema()