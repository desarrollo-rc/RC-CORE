from app.extensions import db
from app.models.productos import Categoria, Division
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class CategoriaService:
    @staticmethod
    def get_categoria_by_id(categoria_id):
        return Categoria.query.get_or_404(categoria_id)

    @staticmethod
    def get_categorias_by_division_id(division_id):
        if not Division.query.get(division_id):
            raise RelatedResourceNotFoundError(f"La División con ID {division_id} no existe.")
        return Categoria.query.filter_by(id_division=division_id, activo=True).all()

    @staticmethod
    def get_all_categorias(include_inactive: bool = False):
        query = Categoria.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(Categoria.nombre_categoria).all()

    @staticmethod   
    def create_categoria(data):
        codigo = data['codigo_categoria'].upper()
        if Categoria.query.filter_by(codigo_categoria=codigo).first():
            raise ResourceConflictError(f"El código de categoría '{codigo}' ya existe.")
        if not Division.query.get(data['id_division']):
            raise RelatedResourceNotFoundError(f"La División con ID {data['id_division']} no existe.")
        
        nueva_categoria = Categoria(**data)
        db.session.add(nueva_categoria)
        db.session.commit()
        return nueva_categoria

    @staticmethod
    def update_categoria(categoria_id, data):
        categoria = CategoriaService.get_categoria_by_id(categoria_id)
        if 'codigo_categoria' in data:
            nuevo_codigo = data['codigo_categoria'].upper()
            if nuevo_codigo != categoria.codigo_categoria and Categoria.query.filter_by(codigo_categoria=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de categoría '{nuevo_codigo}' ya está en uso.")
            categoria.codigo_categoria = nuevo_codigo
            
        if 'nombre_categoria' in data:
            categoria.nombre_categoria = data['nombre_categoria']
        
        db.session.commit()
        return categoria
    
    @staticmethod
    def deactivate_categoria(categoria_id):
        categoria = CategoriaService.get_categoria_by_id(categoria_id)
        if categoria.sub_categorias:
            raise ResourceConflictError("No se puede desactivar una categoría que tiene subcategorías asignadas.")
        categoria.activo = False
        db.session.commit()
        return categoria
    
    @staticmethod
    def activate_categoria(categoria_id):
        categoria = CategoriaService.get_categoria_by_id(categoria_id)
        categoria.activo = True
        db.session.commit()
        return categoria