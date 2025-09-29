# backend/app/api/v1/services/geografia_service.py
from app.models.entidades import Region, Ciudad, Comuna, Pais

class GeografiaService:
    @staticmethod
    def get_paises():
        return Pais.query.order_by(Pais.nombre_pais).all()

    @staticmethod
    def get_regiones_by_pais(pais_id):
        return Region.query.filter_by(id_pais=pais_id).order_by(Region.nombre_region).all()

    @staticmethod
    def get_ciudades_by_region(region_id):
        return Ciudad.query.filter_by(id_region=region_id).order_by(Ciudad.nombre_ciudad).all()

    @staticmethod
    def get_comunas_by_ciudad(ciudad_id):
        return Comuna.query.filter_by(id_ciudad=ciudad_id).order_by(Comuna.nombre_comuna).all()