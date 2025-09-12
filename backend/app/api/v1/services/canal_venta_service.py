# backend/app/api/v1/services/canal_venta_service.py
from app.models.negocio.canales import CanalVenta
from app.api.v1.utils.errors import ResourceConflictError
from app.extensions import db

class CanalVentaService:

    @staticmethod
    def get_all_canales_venta():
        return CanalVenta.query.filter_by(activo=True).all()

    @staticmethod
    def get_canal_venta_by_id(canal_id):
        return CanalVenta.query.get_or_404(canal_id)

    @staticmethod
    def create_canal_venta(data):
        codigo = data['codigo_canal'].upper()
        if CanalVenta.query.filter_by(codigo_canal=codigo).first():
            raise ResourceConflictError(f"El código de canal '{codigo}' ya existe.")
        
        nuevo_canal = CanalVenta(
            codigo_canal=codigo,
            nombre=data['nombre']
        )
        db.session.add(nuevo_canal)
        db.session.commit()
        return nuevo_canal

    @staticmethod
    def update_canal_venta(canal_id, data):
        canal = CanalVentaService.get_canal_venta_by_id(canal_id)

        if 'codigo_canal' in data:
            nuevo_codigo = data['codigo_canal'].upper()
            if nuevo_codigo != canal.codigo_canal and CanalVenta.query.filter_by(codigo_canal=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de canal '{nuevo_codigo}' ya está en uso.")
            canal.codigo_canal = nuevo_codigo
        
        if 'nombre' in data:
            canal.nombre = data['nombre']

        db.session.commit()
        return canal
    
    @staticmethod
    def deactivate_canal_venta(canal_id):
        canal = CanalVentaService.get_canal_venta_by_id(canal_id)
        canal.activo = False
        db.session.commit()
        return canal

    @staticmethod
    def activate_canal_venta(canal_id):
        canal = CanalVentaService.get_canal_venta_by_id(canal_id)
        canal.activo = True
        db.session.commit()
        return canal