from app.models.entidades.entidades_auxiliares import SegmentoCliente
from app.api.v1.utils.errors import ResourceConflictError
from app import db

class SegmentoClienteService:

    @staticmethod
    def get_all_segmentos_cliente():
        return SegmentoCliente.query.filter_by(activo=True).all()

    @staticmethod
    def get_segmento_cliente_by_id(segmento_cliente_id):
        return SegmentoCliente.query.get_or_404(segmento_cliente_id)

    @staticmethod
    def create_segmento_cliente(data):
        codigo = data['codigo_segmento_cliente'].upper()
        if SegmentoCliente.query.filter_by(codigo_segmento_cliente=codigo).first():
            raise ResourceConflictError(f"El código de segmento '{codigo}' ya existe.")
        
        nuevo_segmento = SegmentoCliente(
            codigo_segmento_cliente=codigo,
            nombre_segmento_cliente=data['nombre_segmento_cliente'],
            descripcion_segmento_cliente=data.get('descripcion_segmento_cliente')
        )
        db.session.add(nuevo_segmento)
        db.session.commit()
        return nuevo_segmento

    @staticmethod
    def update_segmento_cliente(segmento_id, data):
        segmento = SegmentoClienteService.get_segmento_cliente_by_id(segmento_id)

        if 'codigo_segmento_cliente' in data:
            nuevo_codigo = data['codigo_segmento_cliente'].upper()
            if nuevo_codigo != segmento.codigo_segmento_cliente and SegmentoCliente.query.filter_by(codigo_segmento_cliente=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de segmento '{nuevo_codigo}' ya está en uso.")
            segmento.codigo_segmento_cliente = nuevo_codigo

        if 'nombre_segmento_cliente' in data:
            segmento.nombre_segmento_cliente = data['nombre_segmento_cliente']
        if 'descripcion_segmento_cliente' in data:
            segmento.descripcion_segmento_cliente = data['descripcion_segmento_cliente']

        db.session.commit()
        return segmento
    
    @staticmethod
    def deactivate_segmento_cliente(segmento_id):
        segmento = SegmentoClienteService.get_segmento_cliente_by_id(segmento_id)
        segmento.activo = False
        db.session.commit()
        return segmento

    @staticmethod
    def activate_segmento_cliente(segmento_id):
        segmento = SegmentoClienteService.get_segmento_cliente_by_id(segmento_id)
        segmento.activo = True
        db.session.commit()
        return segmento