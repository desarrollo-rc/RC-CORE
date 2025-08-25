# backend/app/api/v1/schemas/contacto_schemas.py
from marshmallow import Schema, fields, validate

class ContactoSchema(Schema):
    """
    Schema para la validación y serialización de datos de Contacto.
    """
    id_contacto = fields.Int(dump_only=True)
    nombre = fields.Str(required=True, validate=validate.Length(min=3))
    cargo = fields.Str()
    email = fields.Email(required=True)
    telefono = fields.Str()
    es_principal = fields.Bool(load_default=False)
    id_cliente = fields.Int(required=True, load_only=True)

class UpdateContactoSchema(Schema):
    """
    Schema para la actualización de un Contacto (campos opcionales).
    """
    nombre = fields.Str(validate=validate.Length(min=3))
    cargo = fields.Str(allow_none=True)
    email = fields.Email()
    telefono = fields.Str(allow_none=True)
    es_principal = fields.Bool()