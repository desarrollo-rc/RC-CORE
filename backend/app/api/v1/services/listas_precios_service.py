# backend/app/api/v1/services/listas_precios_service.py
from app.models.entidades.entidades_auxiliares import ListaPrecios
from app.api.v1.utils.errors import ResourceConflictError
from app import db

class ListaPreciosService:

    @staticmethod
    def get_all_listas_precios():
        return ListaPrecios.query.filter_by(activo=True).all()

    @staticmethod
    def get_lista_precios_by_id(lista_id):
        return ListaPrecios.query.get_or_404(lista_id)

    @staticmethod
    def create_lista_precios(data):
        codigo = data['codigo_lista_precios'].upper()
        if ListaPrecios.query.filter_by(codigo_lista_precios=codigo).first():
            raise ResourceConflictError(f"El código de lista de precios '{codigo}' ya existe.")
        
        nueva_lista = ListaPrecios(
            codigo_lista_precios=codigo,
            nombre_lista_precios=data['nombre_lista_precios'],
            descripcion_lista_precios=data.get('descripcion_lista_precios'),
            moneda=data['moneda'].upper()
        )
        db.session.add(nueva_lista)
        db.session.commit()
        return nueva_lista

    @staticmethod
    def update_lista_precios(lista_id, data):
        lista = ListaPreciosService.get_lista_precios_by_id(lista_id)

        if 'codigo_lista_precios' in data:
            nuevo_codigo = data['codigo_lista_precios'].upper()
            if nuevo_codigo != lista.codigo_lista_precios and ListaPrecios.query.filter_by(codigo_lista_precios=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de lista de precios '{nuevo_codigo}' ya está en uso.")
            lista.codigo_lista_precios = nuevo_codigo
        
        for field in ['nombre_lista_precios', 'descripcion_lista_precios', 'moneda']:
            if field in data:
                setattr(lista, field, data[field].upper() if field == 'moneda' else data[field])

        db.session.commit()
        return lista
    
    @staticmethod
    def deactivate_lista_precios(lista_id):
        lista = ListaPreciosService.get_lista_precios_by_id(lista_id)
        lista.activo = False
        db.session.commit()
        return lista

    @staticmethod
    def activate_lista_precios(lista_id):
        lista = ListaPreciosService.get_lista_precios_by_id(lista_id)
        lista.activo = True
        db.session.commit()
        return lista