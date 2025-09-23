# backend/app/api/v1/services/codigo_referencia_service.py
from app.extensions import db
from app.models.productos.codigos import CodigoReferencia, CodigoTecnico
from app.models.productos.categorias import SubCategoria
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError
from sqlalchemy.orm import joinedload

class CodigoReferenciaService:
    # --- Métodos para CodigoReferencia (Padre) ---

    @staticmethod
    def create_codigo_referencia(data):
        codigo = data['codigo']
        if CodigoReferencia.query.filter_by(codigo=codigo).first():
            raise ResourceConflictError(f"El código de referencia '{codigo}' ya existe.")
        
        if not SubCategoria.query.get(data['id_sub_categoria']):
            raise RelatedResourceNotFoundError(f"La subcategoría con ID {data['id_sub_categoria']} no existe.")

        nuevo_codigo = CodigoReferencia(**data)
        db.session.add(nuevo_codigo)
        db.session.commit()
        return nuevo_codigo

    @staticmethod
    def get_codigo_referencia_by_id(ref_id):
        return CodigoReferencia.query.options(
            joinedload(CodigoReferencia.codigos_tecnicos)
        ).get_or_404(ref_id)

    @staticmethod
    def get_all_codigos_referencia(include_inactive: bool = False):
        query = CodigoReferencia.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(CodigoReferencia.codigo).all()

    @staticmethod
    def update_codigo_referencia(ref_id, data):
        codigo_ref = CodigoReferenciaService.get_codigo_referencia_by_id(ref_id)

        if 'codigo' in data and data['codigo'] != codigo_ref.codigo:
            if CodigoReferencia.query.filter_by(codigo=data['codigo']).first():
                raise ResourceConflictError(f"El código de referencia '{data['codigo']}' ya está en uso.")

        for key, value in data.items():
            setattr(codigo_ref, key, value)
        
        db.session.commit()
        return codigo_ref

    @staticmethod
    def activate_codigo_referencia(ref_id):
        codigo_ref = CodigoReferenciaService.get_codigo_referencia_by_id(ref_id)
        codigo_ref.activo = True
        db.session.commit()
        return codigo_ref

    @staticmethod
    def deactivate_codigo_referencia(ref_id):
        codigo_ref = CodigoReferenciaService.get_codigo_referencia_by_id(ref_id)
        if codigo_ref.productos_sku:
            raise ResourceConflictError("No se puede desactivar un código de referencia con SKUs asociados.")
        codigo_ref.activo = False
        db.session.commit()
        return codigo_ref

    # --- Métodos para CodigoTecnico (Hijo) ---

    @staticmethod
    def create_codigo_tecnico(data):
        ref_id = data['id_codigo_referencia']
        # Validar que el padre exista
        CodigoReferenciaService.get_codigo_referencia_by_id(ref_id)

        codigo = data['codigo']
        if CodigoTecnico.query.filter_by(codigo=codigo).first():
             raise ResourceConflictError(f"El código técnico '{codigo}' ya existe.")

        nuevo_codigo_tec = CodigoTecnico(**data)
        db.session.add(nuevo_codigo_tec)
        db.session.commit()
        return nuevo_codigo_tec
    
    @staticmethod
    def get_codigo_tecnico_by_id(tec_id):
        return CodigoTecnico.query.get_or_404(tec_id)

    @staticmethod
    def update_codigo_tecnico(tec_id, data):
        codigo_tec = CodigoReferenciaService.get_codigo_tecnico_by_id(tec_id)

        if 'codigo' in data and data['codigo'] != codigo_tec.codigo:
            if CodigoTecnico.query.filter_by(codigo=data['codigo']).first():
                raise ResourceConflictError(f"El código técnico '{data['codigo']}' ya está en uso.")
        
        for key, value in data.items():
            setattr(codigo_tec, key, value)
        
        db.session.commit()
        return codigo_tec
        
    @staticmethod
    def delete_codigo_tecnico(tec_id):
        codigo_tec = CodigoReferenciaService.get_codigo_tecnico_by_id(tec_id)
        db.session.delete(codigo_tec)
        db.session.commit()
        return None