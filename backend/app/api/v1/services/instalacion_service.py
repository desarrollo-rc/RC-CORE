# backend/app/api/v1/services/instalacion_service.py
from app.models.soporte.instalaciones import Instalacion, EstadoInstalacion
from app.models.soporte.casos import Caso, EstadoCaso, PrioridadCaso
from app.models.soporte.tipos_caso import TipoCaso, CategoriaTipoCaso
from app.api.v1.services.caso_service import CasoService  # Usamos el servicio
from app.api.v1.services.usuario_b2b_service import UsuarioB2BService # Usamos el servicio
from app.api.v1.services.tipo_caso_service import TipoCasoService
from app.extensions import db
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError
from flask_jwt_extended import get_jwt_identity

class InstalacionService:
    @staticmethod
    def get_all_instalaciones():
        return Instalacion.query.all()

    @staticmethod
    def get_instalacion_by_id(instalacion_id):
        instalacion = Instalacion.query.get(instalacion_id)
        if not instalacion:
            raise RelatedResourceNotFoundError(f"Instalación con ID {instalacion_id} no encontrada.")
        return instalacion

    @staticmethod
    def create_instalacion(data):
        # Validar que el caso y el usuario B2B existan
        caso = CasoService.get_caso_by_id(data['id_caso'])
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(data['id_usuario_b2b'])
        
        # Validar que el usuario B2B pertenezca al cliente del caso
        if caso.id_cliente != usuario_b2b.id_cliente:
            raise BusinessRuleError("El usuario B2B debe pertenecer al mismo cliente del caso.")
            
        nueva_instalacion = Instalacion(
            id_caso=data['id_caso'],
            id_usuario_b2b=data['id_usuario_b2b'],
            fecha_visita=data.get('fecha_visita'),
            observaciones=data.get('observaciones'),
            estado='Pendiente Aprobación'
        )
        db.session.add(nueva_instalacion)
        db.session.commit()
        return nueva_instalacion

    @staticmethod
    def update_instalacion(instalacion_id, data):
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        for key, value in data.items():
            if hasattr(instalacion, key):
                setattr(instalacion, key, value)
        
        db.session.commit()
        return instalacion

    @staticmethod
    def update_instalacion_estado(instalacion_id, nuevo_estado):
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        instalacion.estado = nuevo_estado
        db.session.commit()
        return instalacion
    
    @staticmethod
    def aprobar_instalacion(instalacion_id):
        """Aprueba una instalación pendiente"""
        from datetime import datetime
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_ser_aprobada():
            raise BusinessRuleError("La instalación no puede ser aprobada en su estado actual")
        
        instalacion.estado = EstadoInstalacion.PENDIENTE_INSTALACION
        instalacion.fecha_aprobacion = datetime.utcnow()
        db.session.commit()
        return instalacion
    
    @staticmethod
    def crear_usuario_instalacion(instalacion_id, data):
        """
        Crea un nuevo usuario B2B para la instalación.
        data: {
            'nombre_completo': str,
            'usuario': str,
            'email': str,
            'password': str (opcional, se genera si no viene),
            'existe_en_sistema': bool,
            'existe_en_corp': bool
        }
        """
        from datetime import datetime
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_crear_usuario():
            raise BusinessRuleError("La instalación no está en estado para crear usuario")
        
        existe_en_sistema = data.get('existe_en_sistema', False)
        existe_en_corp = data.get('existe_en_corp', False)
        
        # Escenario 1: Usuario existe en sistema
        if existe_en_sistema:
            # Solo vincular
            usuario_existente = UsuarioB2BService.get_usuario_b2b_by_id(data['id_usuario_b2b'])
            if usuario_existente.id_cliente != instalacion.caso.id_cliente:
                raise BusinessRuleError("El usuario no pertenece al cliente de la instalación")
            
            instalacion.id_usuario_b2b = usuario_existente.id_usuario_b2b
            instalacion.estado = EstadoInstalacion.USUARIO_CREADO
            instalacion.fecha_creacion_usuario = datetime.utcnow()
        else:
            # Crear nuevo usuario
            from app.models.entidades.usuarios_b2b import UsuarioB2B
            
            nuevo_usuario = UsuarioB2B(
                nombre_completo=data['nombre_completo'],
                usuario=data['usuario'],
                email=data['email'],
                id_cliente=instalacion.caso.id_cliente
            )
            
            # Generar password si no viene
            password = data.get('password') or f"{data['usuario']}.,{datetime.utcnow().year}.*"
            nuevo_usuario.set_password(password)
            
            db.session.add(nuevo_usuario)
            db.session.flush()
            
            instalacion.id_usuario_b2b = nuevo_usuario.id_usuario_b2b
            instalacion.fecha_creacion_usuario = datetime.utcnow()
            
            # Escenario 2 y 3: Llamar automatización si NO existe en Corp
            if not existe_en_corp:
                # Aquí iría la llamada a automatización
                # Por ahora dejamos el estado como USUARIO_CREADO
                # Si falla la automatización, se cambia a CONFIGURACION_PENDIENTE
                instalacion.estado = EstadoInstalacion.USUARIO_CREADO
            else:
                instalacion.estado = EstadoInstalacion.USUARIO_CREADO
        
        db.session.commit()
        return instalacion
    
    @staticmethod
    def sincronizar_equipos(instalacion_id):
        """
        Sincroniza los equipos del usuario desde Corp (o sistema local).
        Por ahora retorna los equipos existentes del usuario.
        """
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.id_usuario_b2b:
            raise BusinessRuleError("La instalación no tiene un usuario B2B asignado")
        
        usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(instalacion.id_usuario_b2b)
        
        # Aquí iría la sincronización con Corp
        # Por ahora retornamos los equipos del usuario
        from app.models.entidades.equipos import Equipo
        equipos = Equipo.query.filter_by(id_usuario_b2b=usuario_b2b.id_usuario_b2b).all()
        
        return {
            'ok': True,
            'equipos': [{
                'id_equipo': e.id_equipo,
                'id_usuario_b2b': e.id_usuario_b2b,
                'usuario': usuario_b2b.usuario,
                'equipo': e.nombre_equipo,
                'mac': e.mac_address,
                'procesador': e.procesador,
                'placa': e.placa_madre,
                'disco': e.disco_duro,
                'estado': e.estado,
                'alta': e.estado_alta.value,
                'alta_str': e.estado_alta.value
            } for e in equipos]
        }
    
    @staticmethod
    def activar_equipo(instalacion_id, equipo_id):
        """
        Activa un equipo y desactiva todos los demás del mismo usuario.
        """
        from app.models.entidades.equipos import Equipo, EstadoAltaEquipo
        
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.id_usuario_b2b:
            raise BusinessRuleError("La instalación no tiene un usuario B2B asignado")
        
        # Obtener el equipo a activar
        equipo = Equipo.query.get(equipo_id)
        if not equipo:
            raise RelatedResourceNotFoundError(f"Equipo con ID {equipo_id} no encontrado")
        
        if equipo.id_usuario_b2b != instalacion.id_usuario_b2b:
            raise BusinessRuleError("El equipo no pertenece al usuario de la instalación")
        
        # Obtener todos los equipos del usuario
        todos_equipos = Equipo.query.filter_by(id_usuario_b2b=instalacion.id_usuario_b2b).all()
        
        equipos_desactivados = 0
        for e in todos_equipos:
            if e.id_equipo == equipo_id:
                # Activar este equipo
                e.estado = True
                e.estado_alta = EstadoAltaEquipo.APROBADO
            else:
                # Desactivar otros (excepto los ya rechazados e inactivos)
                if not (e.estado_alta == EstadoAltaEquipo.RECHAZADO and e.estado == False):
                    e.estado = False
                    e.estado_alta = EstadoAltaEquipo.RECHAZADO
                    equipos_desactivados += 1
        
        db.session.commit()
        
        return {
            'success': True,
            'message': f'Equipo {equipo.nombre_equipo} activado exitosamente y {equipos_desactivados} equipos desactivados',
            'equipos_desactivados': equipos_desactivados
        }
    
    @staticmethod
    def agendar_instalacion(instalacion_id, fecha_visita):
        """Agenda una fecha para la instalación (opcional)"""
        from datetime import datetime
        
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_agendar():
            raise BusinessRuleError("La instalación no puede ser agendada en su estado actual")
        
        instalacion.estado = EstadoInstalacion.AGENDADA
        # Guardar fecha_visita si se desea (falta agregar campo al modelo)
        
        db.session.commit()
        return instalacion
    
    @staticmethod
    def instalar_equipo(instalacion_id, equipo_id):
        """Asocia el equipo activado a la instalación y marca como instalada"""
        from datetime import datetime
        from app.models.entidades.equipos import Equipo
        
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_ser_instalada():
            raise BusinessRuleError("La instalación no está en estado para ser instalada")
        
        equipo = Equipo.query.get(equipo_id)
        if not equipo:
            raise RelatedResourceNotFoundError(f"Equipo con ID {equipo_id} no encontrado")
        
        if equipo.id_usuario_b2b != instalacion.id_usuario_b2b:
            raise BusinessRuleError("El equipo no pertenece al usuario de la instalación")
        
        instalacion.id_equipo = equipo_id
        instalacion.fecha_instalacion = datetime.utcnow()
        # NO cambiar estado aquí, se mantiene en USUARIO_CREADO o AGENDADA
        
        db.session.commit()
        return instalacion
    
    @staticmethod
    def finalizar_instalacion(instalacion_id, capacitacion_realizada=True):
        """Finaliza la instalación"""
        from datetime import datetime
        
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_ser_finalizada():
            raise BusinessRuleError("La instalación no puede ser finalizada en su estado actual")
        
        if capacitacion_realizada:
            instalacion.fecha_capacitacion = datetime.utcnow()
            observacion = "Instalación finalizada. Capacitación realizada."
        else:
            observacion = "Instalación finalizada. La capacitación no fue requerida."
        
        if instalacion.observaciones:
            instalacion.observaciones += f"\n{observacion}"
        else:
            instalacion.observaciones = observacion
        
        instalacion.estado = EstadoInstalacion.COMPLETADA
        instalacion.fecha_finalizacion = datetime.utcnow()
        
        # Activar equipo definitivamente
        if instalacion.equipo:
            instalacion.equipo.estado = True
        
        db.session.commit()
        return instalacion

    @staticmethod
    def create_instalacion_completa(data):
        """
        Crea una instalación completa con caso automático.
        
        Parámetros esperados:
        - id_cliente: ID del cliente
        - id_usuario_b2b: ID del usuario B2B (puede ser None si es nuevo)
        - es_cliente_nuevo: bool - Si es primera instalación del cliente
        - es_primer_usuario: bool - Si es el primer usuario B2B del cliente
        - es_cambio_equipo: bool - Si es una reinstalación por cambio de equipo
        - observaciones: str opcional
        """
        id_cliente = data.get('id_cliente')
        id_usuario_b2b = data.get('id_usuario_b2b')
        es_cliente_nuevo = data.get('es_cliente_nuevo', False)
        es_primer_usuario = data.get('es_primer_usuario', True)
        es_cambio_equipo = data.get('es_cambio_equipo', False)
        observaciones = data.get('observaciones', '')
        
        # Validar usuario B2B si se proporciona
        if id_usuario_b2b:
            usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(id_usuario_b2b)
            if usuario_b2b.id_cliente != id_cliente:
                raise BusinessRuleError("El usuario B2B no pertenece al cliente seleccionado.")
        
        # Determinar la categoría y nombre del caso según la configuración
        if es_cambio_equipo:
            categoria = CategoriaTipoCaso.INSTALACION_CAMBIO_EQUIPO
            nombre_caso = "Instalación por cambio de equipo"
        elif es_cliente_nuevo:
            categoria = CategoriaTipoCaso.INSTALACION_CLIENTE_NUEVO
            nombre_caso = "Instalación nuevo cliente B2B"
        else:
            # Si no es cliente nuevo ni cambio de equipo, siempre es usuario adicional
            categoria = CategoriaTipoCaso.INSTALACION_USUARIO_ADICIONAL
            nombre_caso = "Instalación usuario adicional B2B"
        
        # Buscar el tipo de caso por categoría
        tipo_caso = TipoCaso.get_by_categoria(categoria)
        if not tipo_caso:
            raise BusinessRuleError(
                f"No existe un tipo de caso configurado con la categoría '{categoria.value}'. "
                "Por favor, cree un tipo de caso en 'Soporte → Tipos de Caso' y asígnele esta categoría."
            )
        
        # Obtener el usuario actual (quien crea)
        current_user_id = get_jwt_identity()
        
        # Crear el caso automáticamente
        nuevo_caso = Caso(
            titulo=nombre_caso,
            descripcion=f"{nombre_caso}. {observaciones if observaciones else ''}".strip(),
            estado=EstadoCaso.ABIERTO,
            prioridad=PrioridadCaso.MEDIA,
            id_cliente=id_cliente,
            id_usuario_creacion=current_user_id,
            id_tipo_caso=tipo_caso.id_tipo_caso
        )
        db.session.add(nuevo_caso)
        db.session.flush()  # Para obtener el ID del caso
        
        # Determinar el estado inicial según si es cliente nuevo
        if es_cliente_nuevo:
            # Cliente nuevo requiere aprobación de gerencia
            estado_inicial = EstadoInstalacion.PENDIENTE_APROBACION
        else:
            # Cliente existente (usuario adicional o cambio equipo) va directo a instalación
            estado_inicial = EstadoInstalacion.PENDIENTE_INSTALACION
        
        # Crear la instalación
        fecha_solicitud = data.get('fecha_solicitud')
        nueva_instalacion = Instalacion(
            id_caso=nuevo_caso.id_caso,
            id_usuario_b2b=id_usuario_b2b,
            observaciones=observaciones,
            estado=estado_inicial,
            fecha_solicitud=fecha_solicitud if fecha_solicitud else None
        )
        db.session.add(nueva_instalacion)
        db.session.commit()
        
        return nueva_instalacion