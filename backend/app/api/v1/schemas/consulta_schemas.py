# backend/app/api/v1/schemas/consulta_schemas.py
from marshmallow import Schema, fields, validate
from app.models.analitica.consultas import TipoQuery, OrigenBdd

class EnumField(fields.Field):
    """Campo custom para serializar/deserializar enums de Python."""
    def _serialize(self, value, attr, obj, **kwargs):
        if value is None:
            return None
        return value.value

    def _deserialize(self, value, attr, data, **kwargs):
        try:
            return self.enum_class[value]
        except KeyError:
            raise validate.ValidationError(f"Valor inválido. Debe ser uno de: {[e.value for e in self.enum_class]}")

class TipoQueryField(EnumField):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.enum_class = TipoQuery

class OrigenBddField(EnumField):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.enum_class = OrigenBdd

class ConsultaSchema(Schema):
    id_consulta = fields.Int(dump_only=True)
    codigo_consulta = fields.Str(required=True)
    nombre = fields.Str(required=True)
    descripcion = fields.Str()
    categoria = fields.Str()
    tags = fields.List(fields.Str())
    query_sql = fields.Str(required=True)
    parametros_defecto = fields.Dict()
    version = fields.Int(dump_only=True)
    activo = fields.Bool()
    
    # Nuevos campos estratégicos
    tipo = TipoQueryField(required=True)
    bdd_source = OrigenBddField(required=True)

    # Campos de auditoría (solo para mostrar)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)
    creado_por = fields.Int(dump_only=True)

class ConsultaUpdateSchema(Schema):
    # En la actualización, ningún campo es requerido
    codigo_consulta = fields.Str(allow_none=True, load_default=None)  # Se ignora si viene en el body
    nombre = fields.Str()
    descripcion = fields.Str()
    categoria = fields.Str()
    tags = fields.List(fields.Str())
    query_sql = fields.Str()
    parametros_defecto = fields.Dict()
    activo = fields.Bool()
    tipo = TipoQueryField()
    bdd_source = OrigenBddField()

class EjecucionParametrosSchema(Schema):
    parametros = fields.Dict(required=False)