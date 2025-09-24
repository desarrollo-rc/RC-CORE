# backend/app/api/v1/services/marca_service.py
from app.extensions import db
from app.models.productos.marcas import Marca, AmbitoMarca
from app.api.v1.utils.errors import ResourceConflictError

class MarcaService:
    @staticmethod
    def get_all_marcas(include_inactive: bool = False, ambito: str = None):
        """Obtiene todas las marcas, opcionalmente incluyendo las inactivas y filtrando por ámbito."""
        query = Marca.query
        if not include_inactive:
            query = query.filter(Marca.activo==True)
        
        if ambito:
            if ambito.lower() == 'vehiculo':
                query = query.filter(Marca.ambito_marca.in_([AmbitoMarca.VEHICULO, AmbitoMarca.MIXTO]))
            elif ambito.lower() == 'repuesto':
                query = query.filter(Marca.ambito_marca.in_([AmbitoMarca.REPUESTO, AmbitoMarca.MIXTO]))

        return query.order_by(Marca.nombre_marca).all()

    @staticmethod
    def get_marca_by_id(marca_id):
        """Busca una marca por su ID primario."""
        return Marca.query.get_or_404(marca_id)

    @staticmethod
    def create_marca(data):
        """Crea una nueva marca validando la unicidad del código."""
        codigo = data['codigo_marca']
        if Marca.query.filter_by(codigo_marca=codigo).first():
            raise ResourceConflictError(f"El código de marca '{codigo}' ya existe.")

        nueva_marca = Marca(**data)
        db.session.add(nueva_marca)
        db.session.commit()
        return nueva_marca

    @staticmethod
    def update_marca(marca_id, data):
        """Actualiza una marca existente."""
        marca = MarcaService.get_marca_by_id(marca_id)

        if 'codigo_marca' in data:
            nuevo_codigo = data['codigo_marca']
            if nuevo_codigo != marca.codigo_marca and Marca.query.filter_by(codigo_marca=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de marca '{nuevo_codigo}' ya está en uso.")
        
        for key, value in data.items():
            setattr(marca, key, value)
        
        db.session.commit()
        return marca

    @staticmethod
    def deactivate_marca(marca_id):
        """Desactiva una marca si no tiene dependencias."""
        marca = MarcaService.get_marca_by_id(marca_id)
        if marca.productos or marca.modelos:
            raise ResourceConflictError("No se puede desactivar una marca que tiene productos o modelos asociados.")
        
        marca.activo = False
        db.session.commit()
        return marca

    @staticmethod
    def activate_marca(marca_id):
        """Activa una marca."""
        marca = MarcaService.get_marca_by_id(marca_id)
        marca.activo = True
        db.session.commit()
        return marca