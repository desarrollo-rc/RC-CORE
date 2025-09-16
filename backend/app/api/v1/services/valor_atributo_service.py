# backend/app/api/v1/services/valor_atributo_service.py
from app.extensions import db
from app.models.productos.caracteristicas import ValorAtributo, Atributo
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError
from werkzeug.exceptions import NotFound

class ValorAtributoService:
    @staticmethod
    def get_valores_by_atributo_id(atributo_id, include_inactive=False):
        if not Atributo.query.get(atributo_id):
            raise RelatedResourceNotFoundError(f"El atributo con ID {atributo_id} no existe.")
        
        query = ValorAtributo.query.filter_by(id_atributo=atributo_id)
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(ValorAtributo.valor).all()

    @staticmethod
    def create_valor(atributo_id, data):
        data['id_atributo'] = atributo_id
        if not Atributo.query.get(atributo_id):
            raise RelatedResourceNotFoundError(f"El atributo con ID {atributo_id} no existe.")
        
        codigo = data['codigo'].upper()
        if ValorAtributo.query.filter_by(id_atributo=atributo_id, codigo=codigo).first():
            raise ResourceConflictError(f"El código '{codigo}' ya existe para este atributo.")
            
        nuevo_valor = ValorAtributo(
            id_atributo=atributo_id,
            codigo=codigo,
            valor=data['valor']
        )
        db.session.add(nuevo_valor)
        db.session.commit()
        return nuevo_valor
    
    @staticmethod
    def update_valor(valor_id, data):
        valor = ValorAtributoService.get_valor_by_id(valor_id)
        if 'codigo' in data:
            nuevo_codigo = data['codigo'].upper()
            if nuevo_codigo != valor.codigo and ValorAtributo.query.filter_by(id_atributo=valor.id_atributo, codigo=nuevo_codigo).first():
                raise ResourceConflictError(f"El código '{nuevo_codigo}' ya existe para este atributo.")
            valor.codigo = nuevo_codigo
            
        if 'valor' in data:
            valor.valor = data['valor']
            
        db.session.commit()
        return valor
    
    @staticmethod
    def deactivate_valor(valor_id):
        valor = ValorAtributoService.get_valor_by_id(valor_id)
        if not valor.activo:
            raise ResourceConflictError(f"El valor con ID {valor_id} ya está desactivado.")
        valor.activo = False
        db.session.commit()
        return valor

    @staticmethod
    def activate_valor(valor_id):
        valor = ValorAtributoService.get_valor_by_id(valor_id)
        valor.activo = True
        db.session.commit()
        return valor

    @staticmethod
    def get_valor_by_id(valor_id):
        return ValorAtributo.query.get_or_404(valor_id)

    @staticmethod
    def get_valor_by_codigo(atributo_id, codigo): # <--- AJUSTE CLAVE
        valor = ValorAtributo.query.filter_by(id_atributo=atributo_id, codigo=codigo.upper()).first()
        if not valor:
            raise NotFound(f"No se encontró un valor con el código '{codigo}' para el atributo especificado.")
        return valor