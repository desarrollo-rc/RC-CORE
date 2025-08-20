# backend/app/api/v1/schemas/cliente_schemas.py
from marshmallow import Schema, fields, validate
from app.api.v1.schemas.vendedor_schemas import VendedorSchema

# --- Schemas para entidades anidadas ---

class ContactoSchema(Schema):
    id_contacto = fields.Int()
    nombre = fields.Str(required=True)
    cargo = fields.Str()
    email = fields.Email(required=True)
    telefono = fields.Str()
    es_principal = fields.Bool(load_default=False)

class DireccionSchema(Schema):
    id_direccion = fields.Int()
    calle = fields.Str(required=True)
    numero = fields.Str()
    comuna = fields.Str(required=True)
    ciudad = fields.Str(required=True)
    region = fields.Str(required=True)
    codigo_postal = fields.Str()
    es_facturacion = fields.Bool(load_default=False)
    es_despacho = fields.Bool(load_default=True)

class TipoClienteResponseSchema(Schema):
    id_tipo_cliente = fields.Int()
    codigo_tipo_cliente = fields.Str()
    nombre_tipo_cliente = fields.Str()

class SegmentoClienteResponseSchema(Schema):
    id_segmento_cliente = fields.Int()
    codigo_segmento_cliente = fields.Str()
    nombre_segmento_cliente = fields.Str()

class ListaPreciosResponseSchema(Schema):
    id_lista_precios = fields.Int()
    codigo_lista_precios = fields.Str()
    nombre_lista_precios = fields.Str()


class CondicionPagoResponseSchema(Schema):
    id_condicion_pago = fields.Int()
    codigo_condicion_pago = fields.Str()
    nombre_condicion_pago = fields.Str()

class EmpresaResponseSchema(Schema):
    id_empresa = fields.Int()
    codigo_empresa = fields.Str()
    nombre_empresa = fields.Str()

class BaseClienteSchema(Schema):
    codigo_cliente = fields.Str()
    rut_cliente = fields.Str()
    nombre_cliente = fields.Str()
    giro_economico = fields.Str(allow_none=True)
    
    # Datos Financieros
    descuento_base = fields.Decimal(as_string=True, places=2)
    linea_credito = fields.Decimal(as_string=True, places=2)

    # Banderas de Estado
    b2b_habilitado = fields.Bool()
    
    # Relaciones
    contactos = fields.List(fields.Nested(ContactoSchema))
    direcciones = fields.List(fields.Nested(DireccionSchema))

# --- Schema principal para la creación y actualización ---

class ClienteSchema(BaseClienteSchema):
    # Hacemos los campos requeridos y añadimos validaciones
    codigo_cliente = fields.Str(required=True, validate=validate.Length(min=3))
    rut_cliente = fields.Str(required=True, validate=validate.Length(min=8))
    nombre_cliente = fields.Str(required=True)
    contactos = fields.List(fields.Nested(ContactoSchema), required=True, validate=validate.Length(min=1))
    direcciones = fields.List(fields.Nested(DireccionSchema), required=True, validate=validate.Length(min=1))

    # Campos de código para las relaciones, requeridos en la creación
    codigo_tipo_cliente = fields.Str(required=True)
    codigo_segmento_cliente = fields.Str(required=True)
    codigo_lista_precios = fields.Str(required=True)
    codigo_condicion_pago = fields.Str(required=True)
    codigo_empresa = fields.Str(required=True)

    id_vendedor = fields.Int(required=False, allow_none=True)

    vendedor = fields.Nested(VendedorSchema, dump_only=True, allow_none=True)


# --- Schema para mostrar los datos de salida ---

class ClienteResponseSchema(BaseClienteSchema):
    id_cliente = fields.Int(dump_only=True)
    activo = fields.Bool(dump_only=True)
    fecha_creacion = fields.DateTime(dump_only=True)
    fecha_modificacion = fields.DateTime(dump_only=True)
    
    # Mostrar el objeto completo en lugar de solo los códigos
    tipo_cliente = fields.Nested(TipoClienteResponseSchema(), dump_only=True)
    segmento_cliente = fields.Nested(SegmentoClienteResponseSchema(), dump_only=True)
    lista_precios = fields.Nested(ListaPreciosResponseSchema(), dump_only=True)
    condicion_pago = fields.Nested(CondicionPagoResponseSchema(), dump_only=True)
    empresa = fields.Nested(EmpresaResponseSchema(), dump_only=True)

class PaginationSchema(Schema):
    """
    Schema para la metadata de paginación
    """
    total = fields.Int(dump_only=True)
    pages = fields.Int(dump_only=True)
    page = fields.Int(dump_only=True)
    per_page = fields.Int(dump_only=True)
    has_next = fields.Bool(dump_only=True)
    has_prev = fields.Bool(dump_only=True)

class UpdateClienteSchema(Schema):
    """
    Schema explícito para la actualización de clientes.
    Todos los campos son opcionales.
    """
    # Datos del Cliente
    codigo_cliente = fields.Str(validate=validate.Length(min=3))
    rut_cliente = fields.Str(validate=validate.Length(min=8))
    nombre_cliente = fields.Str()
    giro_economico = fields.Str(allow_none=True)

    # Datos Financieros
    descuento_base = fields.Decimal(as_string=True, places=2)
    linea_credito = fields.Decimal(as_string=True, places=2)

    # Banderas de Estado
    b2b_habilitado = fields.Bool()

    # Campos de código para las relaciones
    codigo_tipo_cliente = fields.Str()
    codigo_segmento_cliente = fields.Str()
    codigo_lista_precios = fields.Str()
    codigo_condicion_pago = fields.Str()
    codigo_empresa = fields.Str()

    id_vendedor = fields.Int(allow_none=True)

    # Relaciones anidadas (no son requeridas en la actualización)
    contactos = fields.List(fields.Nested(ContactoSchema))
    direcciones = fields.List(fields.Nested(DireccionSchema))

class DeactivateClienteSchema(Schema):
    """
    Schema para la desactivación de un cliente.
    El motivo del bloqueo es obligatorio.
    """
    motivo_bloqueo = fields.Str(required=True, validate=validate.Length(min=10, max=255))