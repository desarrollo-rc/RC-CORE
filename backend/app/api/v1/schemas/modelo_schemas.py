# backend/app/api/v1/schemas/modelo_schemas.py
from marshmallow import Schema, fields, validate
from app.api.v1.schemas.marcas_schemas import MarcaSchema

class ModeloSchema(Schema):
    """
    Schema para crear y mostrar Modelos.
    """
    id_modelo = fields.Int(dump_only=True)
    codigo_modelo = fields.Str(required=True, validate=validate.Length(min=1, max=10))

    nombre_modelo = fields.Str(required=True, validate=validate.Length(min=1))
    nombre_antiguo = fields.Str(dump_only=True)
    id_marca = fields.Int(dump_only=True)
    activo = fields.Bool(dump_only=True)
    marca = fields.Nested(MarcaSchema, dump_only=True)

class UpdateModeloSchema(Schema):
    """
    Schema para actualizar un Modelo. Todos los campos son opcionales.
    """
    codigo_modelo = fields.Str(validate=validate.Length(min=1, max=10))
    nombre_modelo = fields.Str(validate=validate.Length(min=1))
    nombre_antiguo = fields.Str()