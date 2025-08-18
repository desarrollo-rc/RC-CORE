# backend/app/api/v1/schemas/auth_schemas.py
from marshmallow import Schema, fields, validate

class LoginSchema(Schema):
    # Schema para validar la entrada del endpoint de login

    email = fields.Email(required=True, error_messages={'required': 'El email es requerido'})
    password = fields.Str(required=True, validate=validate.Length(min=8), error_messages={'required': 'La contraseña es requerida'})
    