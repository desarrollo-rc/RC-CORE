# backend/app/api/v1/schemas/listas_precios_schemas.py
from marshmallow import Schema, fields, validate

class ListaPreciosSchema(Schema):
    """
    Schema para la validación y serialización de datos de ListaPrecios.
    """
    id_lista_precios = fields.Int(dump_only=True)
    codigo_lista_precios = fields.Str(required=True, validate=validate.Length(min=1, max=20))
    nombre_lista_precios = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion_lista_precios = fields.Str(allow_none=True)
    moneda = fields.Str(required=True, validate=validate.Length(equal=3))
    activo = fields.Bool(dump_only=True)

class UpdateListaPreciosSchema(Schema):
    """
    Schema para la actualización de Listas de Precios (campos opcionales).
    """
    codigo_lista_precios = fields.Str(validate=validate.Length(min=1, max=20))
    nombre_lista_precios = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_lista_precios = fields.Str(allow_none=True)
    moneda = fields.Str(validate=validate.Length(equal=3))