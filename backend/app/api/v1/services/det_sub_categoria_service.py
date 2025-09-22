from app.extensions import db
from app.models.productos import DetSubCategoria, SubCategoria
from app.api.v1.utils.errors import RelatedResourceNotFoundError, ResourceConflictError

class DetSubCategoriaService:
    @staticmethod
    def get_all():
        return DetSubCategoria.query.all()
        
    @staticmethod
    def get_det_sub_categoria_by_id(detalle_id):
        return DetSubCategoria.query.get_or_404(detalle_id)
        
    @staticmethod
    def get_by_sub_categoria_id(sub_categoria_id):
        if not SubCategoria.query.get(sub_categoria_id):
            raise RelatedResourceNotFoundError(f"La Subcategoría con ID {sub_categoria_id} no existe.")
        return DetSubCategoria.query.filter_by(id_sub_categoria=sub_categoria_id, activo=True).all()

    @staticmethod
    def create_det_sub_categoria(data):
        codigo = data['codigo_det_sub_categoria'].upper()
        if DetSubCategoria.query.filter_by(codigo_det_sub_categoria=codigo).first():
            raise ResourceConflictError(f"El código de detalle '{codigo}' ya existe.")
        if not SubCategoria.query.get(data['id_sub_categoria']):
            raise RelatedResourceNotFoundError(f"La Subcategoría con ID {data['id_sub_categoria']} no existe.")
        
        nuevo_detalle = DetSubCategoria(
            codigo_det_sub_categoria=codigo,
            nombre_det_sub_categoria=data['nombre_det_sub_categoria'],
            id_sub_categoria=data['id_sub_categoria']
        )
        db.session.add(nuevo_detalle)
        db.session.commit()
        return nuevo_detalle
    
    @staticmethod
    def update_det_sub_categoria(detalle_id, data):
        detalle = DetSubCategoriaService.get_det_sub_categoria_by_id(detalle_id)
        if 'codigo_det_sub_categoria' in data:
            nuevo_codigo = data['codigo_det_sub_categoria'].upper()
            if nuevo_codigo != detalle.codigo_det_sub_categoria and DetSubCategoria.query.filter_by(codigo_det_sub_categoria=nuevo_codigo).first():
                raise ResourceConflictError(f"El código de detalle '{nuevo_codigo}' ya está en uso.")
            detalle.codigo_det_sub_categoria = nuevo_codigo
        if 'nombre_det_sub_categoria' in data:
            detalle.nombre_det_sub_categoria = data['nombre_det_sub_categoria']
        db.session.commit()
        return detalle


    @staticmethod
    def deactivate_det_sub_categoria(detalle_id):
        detalle = DetSubCategoriaService.get_det_sub_categoria_by_id(detalle_id)
        if not detalle.activo:
            raise ResourceConflictError(f"El detalle con ID {detalle_id} ya está desactivado.")
        detalle.activo = False
        db.session.commit()
        return detalle

    @staticmethod
    def activate_det_sub_categoria(detalle_id):
        detalle = DetSubCategoriaService.get_det_sub_categoria_by_id(detalle_id)
        if detalle.activo:
            raise ResourceConflictError(f"El detalle con ID {detalle_id} ya está activado.")
        detalle.activo = True
        db.session.commit()
        return detalle