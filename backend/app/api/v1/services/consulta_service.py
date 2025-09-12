from app.extensions import db
from app.models.analitica.consultas import Consulta


class ConsultaService:
    @staticmethod
    def list_consultas(categoria=None, activo=True):
        query = Consulta.query
        if categoria:
            query = query.filter_by(categoria=categoria)
        if activo is not None:
            query = query.filter_by(activo=activo)
        return query.order_by(Consulta.categoria.asc().nullsfirst(), Consulta.nombre.asc()).all()

    @staticmethod
    def get_consulta_by_id(consulta_id):
        return Consulta.query.get_or_404(consulta_id)


