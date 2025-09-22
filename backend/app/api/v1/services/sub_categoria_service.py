from app.extensions import db
from app.models.productos import SubCategoria, Categoria
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError

class SubCategoriaService:
    @staticmethod
    def get_sub_categoria_by_id(sub_categoria_id):
        return SubCategoria.query.get_or_404(sub_categoria_id)
        
    @staticmethod
    def get_all_sub_categorias(include_inactive: bool = False):
        query = SubCategoria.query
        if not include_inactive:
            query = query.filter_by(activo=True)
        return query.order_by(SubCategoria.nombre_sub_categoria).all()

    @staticmethod
    def get_sub_categorias_by_categoria_id(categoria_id):
        if not Categoria.query.get(categoria_id):
            raise RelatedResourceNotFoundError(f"La Categoría con ID {categoria_id} no existe.")
        return SubCategoria.query.filter_by(id_categoria=categoria_id, activo=True).all()

    @staticmethod
    def create_sub_categoria(data):
        codigo = data['codigo_sub_categoria'].upper()
        if SubCategoria.query.filter_by(codigo_sub_categoria=codigo).first():
            raise ResourceConflictError(f"El código de subcategoría '{codigo}' ya existe.")
        if not Categoria.query.get(data['id_categoria']):
            raise RelatedResourceNotFoundError(f"La Categoría con ID {data['id_categoria']} no existe.")

        nueva_sub_categoria = SubCategoria(**data)
        db.session.add(nueva_sub_categoria)
        db.session.commit()
        return nueva_sub_categoria

    @staticmethod
    def update_sub_categoria(sub_categoria_id, data):
        sub_categoria = SubCategoriaService.get_sub_categoria_by_id(sub_categoria_id)
        if 'codigo_sub_categoria' in data:
            nuevo_codigo = data['codigo_sub_categoria'].upper()
            if nuevo_codigo != sub_categoria.codigo_sub_categoria and SubCategoria.query.filter_by(codigo_sub_categoria=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de subcategoría '{nuevo_codigo}' ya está en uso.")
            sub_categoria.codigo_sub_categoria = nuevo_codigo
        if 'nombre_sub_categoria' in data:
            sub_categoria.nombre_sub_categoria = data['nombre_sub_categoria']
        db.session.commit()
        return sub_categoria

    @staticmethod
    def deactivate_sub_categoria(sub_categoria_id):
        sub_categoria = SubCategoriaService.get_sub_categoria_by_id(sub_categoria_id)
        if sub_categoria.detalles_sub_categoria:
            raise ResourceConflictError("No se puede desactivar una subcategoría con detalles asignados.")
        sub_categoria.activo = False
        db.session.commit()
        return sub_categoria

    @staticmethod
    def activate_sub_categoria(sub_categoria_id):
        sub_categoria = SubCategoriaService.get_sub_categoria_by_id(sub_categoria_id)
        sub_categoria.activo = True
        db.session.commit()
        return sub_categoria