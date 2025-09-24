# backend/app/api/v1/services/atributo_asignado_service.py
from app.extensions import db
from app.models.productos.caracteristicas import AtributoAsignado, Atributo, ValorAtributo
from app.models.productos.codigos import CodigoReferencia
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class AtributoAsignadoService:
    @staticmethod
    def get_atributos_by_codigo_referencia(ref_id):
        if not CodigoReferencia.query.get(ref_id):
            raise RelatedResourceNotFoundError(f"El Código de Referencia con ID {ref_id} no existe.")
        return AtributoAsignado.query.filter_by(id_codigo_referencia=ref_id).all()

    @staticmethod
    def add_atributo_a_codigo_referencia(ref_id, data):
        id_atributo = data['id_atributo']
        id_valor = data['id_valor']

        if not CodigoReferencia.query.get(ref_id):
            raise RelatedResourceNotFoundError(f"El Código de Referencia con ID {ref_id} no existe.")
        if not Atributo.query.get(id_atributo):
            raise RelatedResourceNotFoundError(f"El Atributo con ID {id_atributo} no existe.")
        valor_obj = ValorAtributo.query.filter_by(id_valor=id_valor, id_atributo=id_atributo).first()
        if not valor_obj:
            raise RelatedResourceNotFoundError(f"El Valor con ID {id_valor} no pertenece al Atributo con ID {id_atributo}.")

        existente = AtributoAsignado.query.filter_by(id_codigo_referencia=ref_id, id_atributo=id_atributo).first()
        if existente:
            raise ResourceConflictError("Este atributo ya está asignado. Edite el valor existente en su lugar.")

        nueva_asignacion = AtributoAsignado(
            id_codigo_referencia=ref_id,
            id_atributo=id_atributo,
            id_valor=id_valor
        )
        db.session.add(nueva_asignacion)
        db.session.commit()
        db.session.refresh(nueva_asignacion)
        return nueva_asignacion

    @staticmethod
    def update_atributo_asignado(ref_id, atributo_id, data):
        asignacion = AtributoAsignado.query.get_or_404((ref_id, atributo_id))
        
        if 'id_valor' in data:
            nuevo_valor_id = data['id_valor']
            valor_obj = ValorAtributo.query.filter_by(id_valor=nuevo_valor_id, id_atributo=atributo_id).first()
            if not valor_obj:
                 raise RelatedResourceNotFoundError(f"El nuevo Valor con ID {nuevo_valor_id} no es válido para este Atributo.")
            asignacion.id_valor = nuevo_valor_id
        
        db.session.commit()
        db.session.refresh(asignacion)
        return asignacion

    @staticmethod
    def remove_atributo_from_codigo_referencia(ref_id, atributo_id):
        asignacion = AtributoAsignado.query.get_or_404((ref_id, atributo_id))
        db.session.delete(asignacion)
        db.session.commit()
        return None