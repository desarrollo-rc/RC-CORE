# backend/app/api/v1/services/tipo_cliente_service.py
from app.models.entidades.entidades_auxiliares import TipoCliente
from app.api.v1.utils.errors import ResourceConflictError
from app import db

class TipoClienteService:

    @staticmethod
    def get_all_tipos_cliente():
        return TipoCliente.query.all()

    @staticmethod
    def get_tipo_cliente_by_id(tipo_cliente_id):
        return TipoCliente.query.get_or_404(tipo_cliente_id)

    @staticmethod
    def create_tipo_cliente(data):
        codigo = data['codigo_tipo_cliente'].upper()
        if TipoCliente.query.filter_by(codigo_tipo_cliente=codigo).first():
            raise ResourceConflictError(f"El código de tipo de cliente '{codigo}' ya existe.")
        
        nuevo_tipo = TipoCliente(
            codigo_tipo_cliente=codigo,
            nombre_tipo_cliente=data['nombre_tipo_cliente'],
            descripcion_tipo_cliente=data.get('descripcion_tipo_cliente'),
            activo=data.get('activo', True)
        )
        
        db.session.add(nuevo_tipo)
        db.session.commit()
        return nuevo_tipo

    @staticmethod
    def update_tipo_cliente(tipo_cliente_id, data):
        tipo_cliente = TipoClienteService.get_tipo_cliente_by_id(tipo_cliente_id)

        if 'codigo_tipo_cliente' in data:
            nuevo_codigo = data['codigo_tipo_cliente'].upper()
            if nuevo_codigo != tipo_cliente.codigo_tipo_cliente and TipoCliente.query.filter_by(codigo_tipo_cliente=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de tipo de cliente '{nuevo_codigo}' ya está en uso.")
            tipo_cliente.codigo_tipo_cliente = nuevo_codigo

        if 'nombre_tipo_cliente' in data:
            tipo_cliente.nombre_tipo_cliente = data['nombre_tipo_cliente']
        if 'descripcion_tipo_cliente' in data:
            tipo_cliente.descripcion_tipo_cliente = data['descripcion_tipo_cliente']

        db.session.commit()
        return tipo_cliente
    
    @staticmethod
    def delete_tipo_cliente(tipo_cliente_id):
        """
        Realiza un borrado lógico del tipo de cliente.
        """
        tipo_cliente = TipoClienteService.get_tipo_cliente_by_id(tipo_cliente_id)
        tipo_cliente.activo = False
        db.session.commit()
        # No se retorna contenido en un delete exitoso
        return None