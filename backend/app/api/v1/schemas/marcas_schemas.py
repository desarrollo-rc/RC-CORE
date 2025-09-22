# backend/app/api/v1/schemas/marcas_schemas.py
from marshmallow import Schema, fields, validate
from app.models.productos.marcas import AmbitoMarca

class EnumField(fields.Field):
    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        return value.value

    def _deserialize(self, value, attr, data, **kwargs):
        if value is None:
            return None
        try:
            return AmbitoMarca(value)
        except ValueError as error:
            raise validate.ValidationError("Ámbito de marca no válido. Debe ser uno de: Vehículo, Repuesto, Mixto.") from error

class MarcaSchema(Schema):
    id_marca = fields.Int(dump_only=True)
    codigo_marca = fields.Str(required=True, validate=validate.Length(min=2, max=30))
    nombre_marca = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    
    # Usamos nuestro campo EnumField para validar y procesar el ámbito
    ambito_marca = EnumField(required=True)
    
    descripcion = fields.Str(allow_none=True)
    tier_marca = fields.Str(allow_none=True)
    id_pais_origen = fields.Int(allow_none=True, load_default=None)
    url_imagen = fields.Str(allow_none=True)
    activo = fields.Bool(dump_only=True)

class UpdateMarcaSchema(Schema):
    codigo_marca = fields.Str(validate=validate.Length(min=2, max=30))
    nombre_marca = fields.Str(validate=validate.Length(min=2, max=100))
    ambito_marca = EnumField()
    descripcion = fields.Str(allow_none=True)
    tier_marca = fields.Str(allow_none=True)
    id_pais_origen = fields.Int(allow_none=True)
    url_imagen = fields.Str(allow_none=True)