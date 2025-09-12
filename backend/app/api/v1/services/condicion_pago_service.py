# backend/app/api/v1/services/condicion_pago_service.py
from app.models.entidades.entidades_auxiliares import CondicionPago
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class CondicionPagoService:

    @staticmethod
    def get_all_condiciones_pago():
        return CondicionPago.query.filter_by(activo=True).all()

    @staticmethod
    def get_condicion_pago_by_id(condicion_id):
        return CondicionPago.query.get_or_404(condicion_id)

    @staticmethod
    def create_condicion_pago(data):
        codigo = data['codigo_condicion_pago'].upper()
        if CondicionPago.query.filter_by(codigo_condicion_pago=codigo).first():
            raise ResourceConflictError(f"El código de condición de pago '{codigo}' ya existe.")
        
        nueva_condicion = CondicionPago(
            codigo_condicion_pago=codigo,
            nombre_condicion_pago=data['nombre_condicion_pago'],
            descripcion_condicion_pago=data.get('descripcion_condicion_pago'),
            dias_credito=data['dias_credito'],
            ambito=data.get('ambito', 'VENTA').upper()
        )
        db.session.add(nueva_condicion)
        db.session.commit()
        return nueva_condicion

    @staticmethod
    def update_condicion_pago(condicion_id, data):
        condicion = CondicionPagoService.get_condicion_pago_by_id(condicion_id)

        if 'codigo_condicion_pago' in data:
            nuevo_codigo = data['codigo_condicion_pago'].upper()
            if nuevo_codigo != condicion.codigo_condicion_pago and CondicionPago.query.filter_by(codigo_condicion_pago=nuevo_codigo).first():
                raise ResourceConflictError(f"El código '{nuevo_codigo}' ya está en uso.")
            condicion.codigo_condicion_pago = nuevo_codigo
        
        for field in ['nombre_condicion_pago', 'descripcion_condicion_pago', 'dias_credito', 'ambito']:
            if field in data:
                value = data[field]
                setattr(condicion, field, value.upper() if field == 'ambito' else value)

        db.session.commit()
        return condicion
    
    @staticmethod
    def deactivate_condicion_pago(condicion_id):
        condicion = CondicionPagoService.get_condicion_pago_by_id(condicion_id)
        condicion.activo = False
        db.session.commit()
        return condicion

    @staticmethod
    def activate_condicion_pago(condicion_id):
        condicion = CondicionPagoService.get_condicion_pago_by_id(condicion_id)
        condicion.activo = True
        db.session.commit()
        return condicion