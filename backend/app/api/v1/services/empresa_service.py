# backend/app/api/v1/services/empresa_service.py
from app.models.entidades import Empresa
from app.api.v1.utils.errors import ResourceConflictError
from app import db

class EmpresaService:

    @staticmethod
    def get_all_empresas():
        return Empresa.query.filter_by(activo=True).all()

    @staticmethod
    def get_empresa_by_id(empresa_id):
        return Empresa.query.get_or_404(empresa_id)

    @staticmethod
    def create_empresa(data):
        codigo = data['codigo_empresa'].upper()
        if Empresa.query.filter_by(codigo_empresa=codigo).first():
            raise ResourceConflictError(f"El código de empresa '{codigo}' ya existe.")
        
        rut = data['rut_empresa']
        if Empresa.query.filter_by(rut_empresa=rut).first():
            raise ResourceConflictError(f"El RUT de empresa '{rut}' ya está registrado.")
        
        nueva_empresa = Empresa(
            codigo_empresa=codigo,
            nombre_empresa=data['nombre_empresa'],
            rut_empresa=rut
        )
        db.session.add(nueva_empresa)
        db.session.commit()
        return nueva_empresa

    @staticmethod
    def update_empresa(empresa_id, data):
        empresa = EmpresaService.get_empresa_by_id(empresa_id)

        if 'codigo_empresa' in data:
            nuevo_codigo = data['codigo_empresa'].upper()
            if nuevo_codigo != empresa.codigo_empresa and Empresa.query.filter_by(codigo_empresa=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de empresa '{nuevo_codigo}' ya está en uso.")
            empresa.codigo_empresa = nuevo_codigo

        if 'rut_empresa' in data:
            nuevo_rut = data['rut_empresa']
            if nuevo_rut != empresa.rut_empresa and Empresa.query.filter_by(rut_empresa=nuevo_rut).first():
                raise ResourceConflictError(f"El RUT de empresa '{nuevo_rut}' ya está en uso.")
            empresa.rut_empresa = nuevo_rut

        if 'nombre_empresa' in data:
            empresa.nombre_empresa = data['nombre_empresa']
        
        db.session.commit()
        return empresa
    
    @staticmethod
    def deactivate_empresa(empresa_id):
        empresa = EmpresaService.get_empresa_by_id(empresa_id)
        if empresa.clientes:
            raise ResourceConflictError("No se puede desactivar una empresa que tiene clientes asignados.")
        
        empresa.activo = False
        db.session.commit()
        return empresa

    @staticmethod
    def activate_empresa(empresa_id):
        empresa = EmpresaService.get_empresa_by_id(empresa_id)
        empresa.activo = True
        db.session.commit()
        return empresa