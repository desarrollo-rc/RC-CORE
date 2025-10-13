# backend/app/api/v1/schemas/caso_schemas.py
from marshmallow import Schema, fields, validate

class ClienteSchema(Schema):
    id_cliente = fields.Int(dump_only=True)
    nombre_cliente = fields.Str(dump_only=True)
    codigo_cliente = fields.Str(dump_only=True)

class CasoSchema(Schema):
    id_caso = fields.Int(dump_only=True)
    titulo = fields.Str(required=True)
    descripcion = fields.Str(required=True)
    estado = fields.Method("get_estado_value", dump_only=True)
    prioridad = fields.Method("get_prioridad_value", dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)
    id_cliente = fields.Int(dump_only=True)
    cliente = fields.Nested(ClienteSchema, dump_only=True)
    
    def get_estado_value(self, obj):
        """Extrae el valor del enum EstadoCaso"""
        if hasattr(obj, 'estado') and obj.estado:
            return obj.estado.value if hasattr(obj.estado, 'value') else str(obj.estado)
        return None
    
    def get_prioridad_value(self, obj):
        """Extrae el valor del enum PrioridadCaso"""
        if hasattr(obj, 'prioridad') and obj.prioridad:
            return obj.prioridad.value if hasattr(obj.prioridad, 'value') else str(obj.prioridad)
        return None

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