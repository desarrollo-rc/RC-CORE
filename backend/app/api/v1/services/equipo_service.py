# backend/app/api/v1/services/equipo_service.py
from app.models.entidades.equipos import Equipo
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError
from app.extensions import db

class EquipoService:
    @staticmethod
    def get_all_equipos():
        return Equipo.query.options(db.joinedload(Equipo.usuario_b2b)).all()

    @staticmethod
    def get_equipo_by_id(equipo_id):
        equipo = Equipo.query.options(db.joinedload(Equipo.usuario_b2b)).get(equipo_id)
        if not equipo:
            raise RelatedResourceNotFoundError(f"Equipo con ID {equipo_id} no encontrado.")
        return equipo

    @staticmethod
    def create_equipo(data):
        # Validar que el usuario B2B exista
        from app.api.v1.services.usuario_b2b_service import UsuarioB2BService
        from app.models.entidades.equipos import EstadoAltaEquipo
        from datetime import datetime
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(data['id_usuario_b2b'])
        
        # Verificar si el equipo ya existe
        equipo_existente = Equipo.query.filter_by(
            id_usuario_b2b=data['id_usuario_b2b'],
            nombre_equipo=data['nombre_equipo']
        ).first()
        
        if equipo_existente:
            # Si se proporcionan estado y estado_alta, actualizar el equipo existente
            if 'estado' in data and data['estado'] is not None:
                equipo_existente.estado = data['estado']
            if 'estado_alta' in data and data['estado_alta']:
                estado_alta_str = data['estado_alta']
                equipo_existente.estado_alta = EstadoAltaEquipo[estado_alta_str]
            db.session.commit()
            return equipo_existente
        
        # Determinar estado y estado_alta
        estado = data.get('estado', False)
        estado_alta_str = data.get('estado_alta')
        
        if estado_alta_str:
            estado_alta = EstadoAltaEquipo[estado_alta_str]
        else:
            estado_alta = EstadoAltaEquipo.PENDIENTE
        
        nuevo_equipo = Equipo(
            id_usuario_b2b=data['id_usuario_b2b'],
            nombre_equipo=data['nombre_equipo'],
            mac_address=data['mac_address'],
            procesador=data['procesador'],
            placa_madre=data['placa_madre'],
            disco_duro=data['disco_duro'],
            estado_alta=estado_alta,
            estado=estado
        )
        
        # Establecer fecha de creación personalizada si se proporciona
        if data.get('fecha_creacion_personalizada'):
            fecha_creacion = data['fecha_creacion_personalizada']
            if isinstance(fecha_creacion, str):
                try:
                    # Manejar diferentes formatos de fecha
                    if 'T' in fecha_creacion:
                        # Formato ISO con T
                        nuevo_equipo.fecha_creacion = datetime.fromisoformat(fecha_creacion.replace('Z', '+00:00'))
                    else:
                        # Formato de fecha simple
                        nuevo_equipo.fecha_creacion = datetime.fromisoformat(fecha_creacion)
                except Exception as e:
                    # Si hay error, usar fecha actual
                    nuevo_equipo.fecha_creacion = datetime.now()
            else:
                nuevo_equipo.fecha_creacion = fecha_creacion
        
        db.session.add(nuevo_equipo)
        db.session.commit()
        return nuevo_equipo

    @staticmethod
    def update_equipo(equipo_id, data):
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        for field, value in data.items():
            setattr(equipo, field, value)
        db.session.commit()
        return equipo
    
    @staticmethod
    def deactivate_equipo(equipo_id):
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        equipo.activo = False
        db.session.commit()
        return equipo

    @staticmethod
    def activate_equipo(equipo_id):
        equipo = EquipoService.get_equipo_by_id(equipo_id)
        equipo.activo = True
        db.session.commit()
        return equipo

    @staticmethod
    def get_equipo_by_usuario_b2b_id(usuario_b2b_id):
        return Equipo.query.filter_by(id_usuario_b2b=usuario_b2b_id).all()
    
    