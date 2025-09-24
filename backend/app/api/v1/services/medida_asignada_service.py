# backend/app/api/v1/services/medida_asignada_service.py

from app.extensions import db
from app.models.productos.caracteristicas import MedidaAsignada, Medida
from app.models.productos.codigos import CodigoReferencia
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class MedidaAsignadaService:
    @staticmethod
    def get_medidas_by_codigo_referencia(ref_id):
        if not CodigoReferencia.query.get(ref_id):
            raise RelatedResourceNotFoundError(f"El Código de Referencia con ID {ref_id} no existe.")
        return MedidaAsignada.query.filter_by(id_codigo_referencia=ref_id).all()

    @staticmethod
    def add_medida_a_codigo_referencia(ref_id, data):
        id_medida = data['id_medida']
        valor = data['valor']

        if not CodigoReferencia.query.get(ref_id):
            raise RelatedResourceNotFoundError(f"El Código de Referencia con ID {ref_id} no existe.")
        if not Medida.query.get(id_medida):
            raise RelatedResourceNotFoundError(f"La Medida con ID {id_medida} no existe.")
        
        existente = MedidaAsignada.query.filter_by(id_codigo_referencia=ref_id, id_medida=id_medida).first()
        if existente:
            raise ResourceConflictError("Esta medida ya está asignada a este código de referencia.")

        nueva_asignacion = MedidaAsignada(
            id_codigo_referencia=ref_id,
            id_medida=id_medida,
            valor=valor
        )
        db.session.add(nueva_asignacion)
        db.session.commit()
        db.session.refresh(nueva_asignacion)
        return nueva_asignacion

    @staticmethod
    def update_medida_asignada(ref_id, medida_id, data):
        asignacion = MedidaAsignada.query.get_or_404((ref_id, medida_id))
        
        if 'valor' in data:
            asignacion.valor = data['valor']
        
        db.session.commit()
        db.session.refresh(asignacion)
        return asignacion

    @staticmethod
    def remove_medida_from_codigo_referencia(ref_id, medida_id):
        asignacion = MedidaAsignada.query.get_or_404((ref_id, medida_id))
        db.session.delete(asignacion)
        db.session.commit()
        return None