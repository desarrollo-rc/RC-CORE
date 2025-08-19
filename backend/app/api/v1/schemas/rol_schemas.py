# backend/app/api/v1/schemas/rol_schemas.py
from marshmallow import Schema, fields, validate

class PermisoSchema(Schema):
    """Schema simple para mostrar información de permisos anidados."""
    id_permiso = fields.Int()
    nombre_permiso = fields.Str()

class RolSchema(Schema):
    """Schema para la creación y visualización de Roles."""
    id_rol = fields.Int(dump_only=True)
    nombre_rol = fields.Str(required=True, validate=validate.Length(min=3, max=100))
    descripcion_rol = fields.Str(allow_none=True)
    
    # Para la entrada: recibimos una lista de IDs de permisos
    permisos_ids = fields.List(fields.Int(), load_only=True)
    
    # Para la salida: mostramos la lista de objetos de permisos completos
    permisos = fields.List(fields.Nested(PermisoSchema), dump_only=True)

class UpdateRolSchema(Schema):
    """Schema para la actualización de Roles (campos opcionales)."""
    nombre_rol = fields.Str(validate=validate.Length(min=3, max=100))
    descripcion_rol = fields.Str(allow_none=True)
    permisos_ids = fields.List(fields.Int())