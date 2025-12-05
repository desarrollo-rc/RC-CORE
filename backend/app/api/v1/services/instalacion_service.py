# backend/app/api/v1/services/instalacion_service.py
from app.models.soporte.instalaciones import Instalacion, EstadoInstalacion
from app.models.soporte.casos import Caso, EstadoCaso, PrioridadCaso
from app.models.soporte.tipos_caso import TipoCaso, CategoriaTipoCaso
from app.models.entidades.usuarios_b2b import UsuarioB2B
from app.api.v1.services.caso_service import CasoService  # Usamos el servicio
from app.api.v1.services.usuario_b2b_service import UsuarioB2BService # Usamos el servicio
from app.api.v1.services.tipo_caso_service import TipoCasoService
from app.extensions import db
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError
from flask_jwt_extended import get_jwt_identity
from datetime import datetime, timedelta
import pytz
import os

class InstalacionService:
    @staticmethod
    def _obtener_fecha_chile():
        """Obtiene la fecha y hora actual en zona horaria de Chile (UTC-3)"""
        chile_tz = pytz.timezone('America/Santiago')
        return datetime.now(chile_tz).replace(tzinfo=None)
    
    @staticmethod
    def _calcular_fecha_cambio_estado(instalacion, minutos_desplazamiento=0):
        """
        Calcula la fecha para un cambio de estado basándose en la fecha de solicitud.
        Si hay fecha_solicitud personalizada, la usa como base.
        Si no, usa la fecha actual.
        
        Args:
            instalacion: Objeto Instalacion
            minutos_desplazamiento: Minutos a agregar a la fecha base (para secuenciar eventos)
        
        Returns:
            datetime: Fecha calculada para el cambio de estado
        """
        if instalacion.fecha_solicitud:
            # Usar la fecha de solicitud como base
            fecha_base = instalacion.fecha_solicitud
            # Si es un string, convertir a datetime
            if isinstance(fecha_base, str):
                fecha_base = datetime.fromisoformat(fecha_base.replace('Z', '+00:00'))
            # Agregar el desplazamiento en minutos
            return fecha_base + timedelta(minutes=minutos_desplazamiento)
        else:
            # Si no hay fecha de solicitud personalizada, usar fecha actual
            return datetime.utcnow()

    @staticmethod
    def get_all_instalaciones():
        return Instalacion.query.all()
    
    @staticmethod
    def get_instalaciones_paginated(page=1, per_page=15, tipo_caso_id=None, usuario_b2b_id=None, 
                                   id_cliente=None, id_vendedor=None, fecha_desde=None, fecha_hasta=None, estado=None, 
                                   sort_by='fecha_solicitud', sort_order='desc'):
        """
        Obtiene instalaciones con filtros y paginación.
        """
        query = Instalacion.query
        
        # Aplicar filtros
        if tipo_caso_id:
            query = query.join(Caso).filter(Caso.id_tipo_caso == tipo_caso_id)
        
        if usuario_b2b_id:
            query = query.filter(Instalacion.id_usuario_b2b == usuario_b2b_id)
        
        if id_cliente:
            # Filtrar por cliente a través del caso
            query = query.join(Caso).filter(Caso.id_cliente == id_cliente)
        
        if id_vendedor:
            # Filtrar por vendedor a través del caso -> cliente -> vendedor
            from app.models.entidades.maestro_clientes import MaestroClientes
            query = query.join(Caso).join(MaestroClientes, Caso.id_cliente == MaestroClientes.id_cliente).filter(MaestroClientes.id_vendedor == id_vendedor)
        
        if fecha_desde:
            query = query.filter(Instalacion.fecha_solicitud >= fecha_desde)
        
        if fecha_hasta:
            query = query.filter(Instalacion.fecha_solicitud <= fecha_hasta)
        
        if estado:
            # Convertir el string del estado al enum correspondiente
            from app.models.soporte.instalaciones import EstadoInstalacion
            try:
                estado_enum = EstadoInstalacion(estado)
                query = query.filter(Instalacion.estado == estado_enum)
            except ValueError:
                # Si el estado no es válido, ignorar el filtro
                pass
        
        # Aplicar ordenamiento
        if sort_by == 'fecha_solicitud':
            if sort_order == 'desc':
                query = query.order_by(Instalacion.fecha_solicitud.desc())
            else:
                query = query.order_by(Instalacion.fecha_solicitud.asc())
        else:
            # Ordenamiento por defecto
            query = query.order_by(Instalacion.fecha_solicitud.desc())
        
        return query.paginate(page=page, per_page=per_page, error_out=False)

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
    def aprobar_instalacion(instalacion_id, fecha_aprobacion_personalizada=None):
        """
        Aprueba una instalación pendiente.
        Si fecha_aprobacion_personalizada es proporcionada, la usa.
        Si no, calcula la fecha basándose en fecha_solicitud + 5 minutos.
        """
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_ser_aprobada():
            raise BusinessRuleError("La instalación no puede ser aprobada en su estado actual")
        
        instalacion.estado = EstadoInstalacion.PENDIENTE_INSTALACION
        
        # Determinar la fecha de aprobación
        if fecha_aprobacion_personalizada:
            # Usar la fecha proporcionada
            if isinstance(fecha_aprobacion_personalizada, str):
                instalacion.fecha_aprobacion = datetime.fromisoformat(fecha_aprobacion_personalizada.replace('Z', '+00:00'))
            else:
                instalacion.fecha_aprobacion = fecha_aprobacion_personalizada
        else:
            # Usar fecha y hora actual para seguimiento real
            instalacion.fecha_aprobacion = InstalacionService._obtener_fecha_chile()
        
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
            'existe_en_corp': bool,
            'fecha_creacion_personalizada': str (opcional, fecha ISO para creación de usuario)
        }
        """
        print(f"[AUTOMATIZACION] ===== INICIO crear_usuario_instalacion para instalacion_id={instalacion_id} =====")
        print(f"[AUTOMATIZACION] Data completa recibida: {data}")
        
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_crear_usuario():
            raise BusinessRuleError("La instalación no está en estado para crear usuario")
        
        existe_en_sistema = data.get('existe_en_sistema', False)
        existe_en_corp = data.get('existe_en_corp', False)
        
        # Logging usando print (visible en consola) y también logger si está disponible
        from flask import current_app
        try:
            current_app.logger.info(f"[AUTOMATIZACION] Valores recibidos - existe_en_sistema: {existe_en_sistema}, existe_en_corp: {existe_en_corp}")
        except:
            pass
        print(f"[AUTOMATIZACION] Valores recibidos - existe_en_sistema: {existe_en_sistema}, existe_en_corp: {existe_en_corp}")
        
        # Calcular fecha de creación de usuario
        if data.get('fecha_creacion_personalizada'):
            # Usar la fecha proporcionada por el usuario
            fecha_creacion = data['fecha_creacion_personalizada']
            if isinstance(fecha_creacion, str):
                fecha_creacion = datetime.fromisoformat(fecha_creacion.replace('Z', '+00:00'))
        else:
            # Usar fecha y hora actual para seguimiento real (usuario creado después de la solicitud)
            fecha_creacion = InstalacionService._obtener_fecha_chile()
        
        # Escenario 1: Usuario existe en sistema
        if existe_en_sistema:
            # Solo vincular
            usuario_existente = UsuarioB2BService.get_usuario_b2b_by_id(data['id_usuario_b2b'])
            if usuario_existente.id_cliente != instalacion.caso.id_cliente:
                raise BusinessRuleError("El usuario no pertenece al cliente de la instalación")
            
            instalacion.id_usuario_b2b = usuario_existente.id_usuario_b2b
            instalacion.estado = EstadoInstalacion.USUARIO_CREADO
            instalacion.fecha_creacion_usuario = fecha_creacion
        else:
            # Crear nuevo usuario
            from app.models.entidades.usuarios_b2b import UsuarioB2B
            
            nuevo_usuario = UsuarioB2B(
                nombre_completo=data['nombre_completo'],
                usuario=data['usuario'],
                email=data['email'],
                id_cliente=instalacion.caso.id_cliente
            )
            
            # Establecer fecha de creación personalizada si se especifica
            if data.get('fecha_creacion_personalizada'):
                nuevo_usuario.fecha_creacion = fecha_creacion
            
            # Generar password si no viene
            password = data.get('password') or f"{data['usuario']}.,{fecha_creacion.year}.*"
            nuevo_usuario.set_password(password)
            
            db.session.add(nuevo_usuario)
            db.session.flush()
            
            instalacion.id_usuario_b2b = nuevo_usuario.id_usuario_b2b
            instalacion.fecha_creacion_usuario = fecha_creacion
            
            # Escenario 2 y 3: Llamar automatización si NO existe en Corp
            print(f"[AUTOMATIZACION] Evaluando automatización - existe_en_corp={existe_en_corp}, not existe_en_corp={not existe_en_corp}")
            try:
                current_app.logger.info(f"[AUTOMATIZACION] Evaluando automatización - existe_en_corp={existe_en_corp}")
            except:
                pass
            
            if not existe_en_corp:
                # Llamar automatización de Playwright para crear usuario en Corp
                print(f"[AUTOMATIZACION] ✓ Entrando al bloque de automatización para: {nuevo_usuario.usuario}")
                try:
                    current_app.logger.info(f"[AUTOMATIZACION] ✓ Entrando al bloque de automatización para: {nuevo_usuario.usuario}")
                except:
                    pass
                try:
                    from automatizaciones.playwright.usuario_automation import crear_usuario_corp
                    from app.models.entidades.maestro_clientes import MaestroClientes
                    
                    print(f"[AUTOMATIZACION] Módulo importado correctamente")
                    
                    # Obtener el cliente para obtener el RUT
                    cliente = MaestroClientes.query.get(instalacion.caso.id_cliente)
                    if not cliente:
                        raise BusinessRuleError("No se encontró el cliente asociado a la instalación")
                    
                    print(f"[AUTOMATIZACION] Cliente encontrado: {cliente.nombre_cliente}, RUT: {cliente.rut_cliente}")
                    
                    # Determinar si ejecutar en modo headless (por defecto True en producción)
                    headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
                    print(f"[AUTOMATIZACION] Modo headless: {headless_mode}")
                    
                    # Llamar a la automatización
                    print(f"[AUTOMATIZACION] Llamando a crear_usuario_corp con: codigo={nuevo_usuario.usuario}, nombre={nuevo_usuario.nombre_completo}, rut={cliente.rut_cliente}, email={nuevo_usuario.email}")
                    resultado = crear_usuario_corp(
                        codigo=nuevo_usuario.usuario,
                        nombre=nuevo_usuario.nombre_completo,
                        contrasena=password,
                        rut_cliente=cliente.rut_cliente,
                        email=nuevo_usuario.email,
                        nombre_cliente=cliente.nombre_cliente,
                        headless=headless_mode
                    )
                    
                    print(f"[AUTOMATIZACION] Resultado de automatización: {resultado}")
                    
                    if resultado["success"]:
                        instalacion.estado = EstadoInstalacion.USUARIO_CREADO
                        # Agregar observación sobre la creación automática
                        observacion = f"Usuario creado automáticamente en Corp: {resultado['message']}"
                        if instalacion.observaciones:
                            instalacion.observaciones += f"\n{observacion}"
                        else:
                            instalacion.observaciones = observacion
                        print(f"[AUTOMATIZACION] Usuario creado exitosamente en Corp")
                    else:
                        # Si falla la automatización, cambiar a CONFIGURACION_PENDIENTE
                        instalacion.estado = EstadoInstalacion.CONFIGURACION_PENDIENTE
                        error_msg = f"Error al crear usuario en Corp: {resultado.get('error', resultado.get('message', 'Error desconocido'))}"
                        if instalacion.observaciones:
                            instalacion.observaciones += f"\n{error_msg}"
                        else:
                            instalacion.observaciones = error_msg
                        print(f"[AUTOMATIZACION] Error en automatización: {error_msg}")
                        # Re-lanzar el error para que el endpoint pueda informarlo
                        raise BusinessRuleError(error_msg)
                        
                except BusinessRuleError as e:
                    # Re-lanzar errores de negocio
                    print(f"[AUTOMATIZACION] BusinessRuleError: {str(e)}")
                    raise
                except Exception as e:
                    # Para otros errores, cambiar estado y continuar
                    import traceback
                    error_trace = traceback.format_exc()
                    print(f"[AUTOMATIZACION] Excepción inesperada: {str(e)}")
                    print(f"[AUTOMATIZACION] Traceback: {error_trace}")
                    instalacion.estado = EstadoInstalacion.CONFIGURACION_PENDIENTE
                    error_msg = f"Error inesperado al crear usuario en Corp: {str(e)}"
                    if instalacion.observaciones:
                        instalacion.observaciones += f"\n{error_msg}"
                    else:
                        instalacion.observaciones = error_msg
                    # Re-lanzar el error para que se vea en la respuesta
                    raise BusinessRuleError(error_msg)
            else:
                print(f"[AUTOMATIZACION] Usuario ya existe en Corp, saltando automatización")
                instalacion.estado = EstadoInstalacion.USUARIO_CREADO
        
        db.session.commit()
        return instalacion
    
    @staticmethod
    def continuar_sin_usuario(instalacion_id):
        """
        Permite continuar con la instalación sin crear usuario B2B.
        Cambia el estado a CONFIGURACION_PENDIENTE para permitir continuar con el flujo.
        """
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_crear_usuario():
            raise BusinessRuleError("La instalación no está en estado para continuar sin usuario")
        
        # Cambiar estado a CONFIGURACION_PENDIENTE para permitir continuar
        instalacion.estado = EstadoInstalacion.CONFIGURACION_PENDIENTE
        
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
    def agendar_instalacion(instalacion_id, fecha_visita, fecha_agendamiento_personalizada=None):
        """
        Agenda una fecha para la instalación.
        Si fecha_agendamiento_personalizada es proporcionada, la usa.
        Si no, calcula la fecha basándose en fecha_solicitud + 15 minutos.
        """
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_agendar():
            raise BusinessRuleError("La instalación no puede ser agendada en su estado actual")
        
        instalacion.estado = EstadoInstalacion.AGENDADA
        
        # Determinar la fecha de agendamiento
        if fecha_agendamiento_personalizada:
            # Usar la fecha proporcionada
            if isinstance(fecha_agendamiento_personalizada, str):
                fecha_agendamiento = datetime.fromisoformat(fecha_agendamiento_personalizada.replace('Z', '+00:00'))
            else:
                fecha_agendamiento = fecha_agendamiento_personalizada
        else:
            # Usar fecha y hora actual para seguimiento real
            fecha_agendamiento = InstalacionService._obtener_fecha_chile()
        
        # Guardar fecha_visita si se desea (falta agregar campo al modelo)
        instalacion.fecha_agendamiento = fecha_agendamiento
        
        db.session.commit()
        return instalacion
    
    @staticmethod
    def instalar_equipo(instalacion_id, equipo_id, fecha_instalacion_personalizada=None):
        """
        Asocia el equipo activado a la instalación y marca como instalada.
        Si fecha_instalacion_personalizada es proporcionada, la usa.
        Si no, calcula la fecha basándose en fecha_solicitud + 20 minutos.
        """
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
        
        # Determinar la fecha de instalación
        if fecha_instalacion_personalizada:
            # Usar la fecha proporcionada
            if isinstance(fecha_instalacion_personalizada, str):
                instalacion.fecha_instalacion = datetime.fromisoformat(fecha_instalacion_personalizada.replace('Z', '+00:00'))
            else:
                instalacion.fecha_instalacion = fecha_instalacion_personalizada
        else:
            # Usar fecha y hora actual para seguimiento real
            instalacion.fecha_instalacion = InstalacionService._obtener_fecha_chile()
        
        # Para instalaciones de cambio de equipo, mantener en USUARIO_CREADO para permitir finalizar
        # Para otros tipos, mantener el estado actual
        
        db.session.commit()
        return instalacion
    
    @staticmethod
    def finalizar_instalacion(instalacion_id, capacitacion_realizada=True, fecha_finalizacion_personalizada=None):
        """
        Finaliza la instalación.
        Si fecha_finalizacion_personalizada es proporcionada, la usa.
        Si no, calcula la fecha basándose en fecha_solicitud + 25 minutos.
        """
        instalacion = InstalacionService.get_instalacion_by_id(instalacion_id)
        
        if not instalacion.puede_ser_finalizada():
            raise BusinessRuleError("La instalación no puede ser finalizada en su estado actual")
        
        # Determinar la fecha de finalización
        if fecha_finalizacion_personalizada:
            # Usar la fecha proporcionada
            if isinstance(fecha_finalizacion_personalizada, str):
                fecha_finalizacion = datetime.fromisoformat(fecha_finalizacion_personalizada.replace('Z', '+00:00'))
            else:
                fecha_finalizacion = fecha_finalizacion_personalizada
        else:
            # Usar fecha y hora actual para seguimiento real
            fecha_finalizacion = InstalacionService._obtener_fecha_chile()
        
        if capacitacion_realizada:
            instalacion.fecha_capacitacion = fecha_finalizacion
            observacion = "Instalación finalizada. Capacitación realizada."
        else:
            observacion = "Instalación finalizada. La capacitación no fue requerida."
        
        if instalacion.observaciones:
            instalacion.observaciones += f"\n{observacion}"
        else:
            instalacion.observaciones = observacion
        
        instalacion.estado = EstadoInstalacion.COMPLETADA
        instalacion.fecha_finalizacion = fecha_finalizacion
        
        # Activar equipo definitivamente
        if instalacion.equipo:
            instalacion.equipo.estado = True
        
        # Cerrar automáticamente el caso asociado si existe
        if instalacion.caso:
            from app.models.soporte.casos import EstadoCaso
            instalacion.caso.estado = EstadoCaso.CERRADO
            instalacion.caso.fecha_cierre = fecha_finalizacion
        
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
        - numero_usuarios: int opcional - Cantidad de usuarios a crear para cliente nuevo
        - observaciones: str opcional
        """
        id_cliente = data.get('id_cliente')
        id_usuario_b2b = data.get('id_usuario_b2b')
        es_cliente_nuevo = data.get('es_cliente_nuevo', False)
        es_primer_usuario = data.get('es_primer_usuario', True)
        es_cambio_equipo = data.get('es_cambio_equipo', False)
        es_usuario_adicional = data.get('es_usuario_adicional', False)
        numero_usuarios = data.get('numero_usuarios', 1)
        observaciones = data.get('observaciones', '')
        datos_usuario_adicional = data.get('datos_usuario_adicional')
        
        # Validar usuario B2B si se proporciona
        if id_usuario_b2b:
            usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(id_usuario_b2b)
            if usuario_b2b.id_cliente != id_cliente:
                raise BusinessRuleError("El usuario B2B no pertenece al cliente seleccionado.")
        
        # Crear usuario B2B automáticamente si es usuario adicional
        if es_usuario_adicional and datos_usuario_adicional:
            from app.api.v1.services.instalacion_service_helper import crear_usuario_b2b_con_automatizacion
            nuevo_usuario, id_usuario_b2b = crear_usuario_b2b_con_automatizacion(datos_usuario_adicional, id_cliente)
        
        # Determinar la categoría y nombre del caso según la configuración
        if es_cambio_equipo:
            categoria = CategoriaTipoCaso.INSTALACION_CAMBIO_EQUIPO
            nombre_caso = "Instalación por cambio de equipo"
        elif es_cliente_nuevo:
            categoria = CategoriaTipoCaso.INSTALACION_CLIENTE_NUEVO
            if numero_usuarios > 1:
                nombre_caso = f"Instalación nuevo cliente B2B - {numero_usuarios} usuarios"
            else:
                nombre_caso = "Instalación nuevo cliente B2B"
        elif es_usuario_adicional:
            categoria = CategoriaTipoCaso.INSTALACION_USUARIO_ADICIONAL
            nombre_caso = "Instalación usuario adicional B2B"
        else:
            # Fallback para compatibilidad
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
        
        # Crear la descripción del caso
        descripcion_caso = nombre_caso
        if es_cliente_nuevo and numero_usuarios > 1:
            descripcion_caso += f" - Se crearán {numero_usuarios} usuarios B2B para el cliente"
        if observaciones:
            descripcion_caso += f". {observaciones}"
        
        # Crear el caso automáticamente
        nuevo_caso = Caso(
            titulo=nombre_caso,
            descripcion=descripcion_caso,
            estado=EstadoCaso.ABIERTO,
            prioridad=PrioridadCaso.MEDIA,
            id_cliente=id_cliente,
            id_usuario_creacion=current_user_id,
            id_tipo_caso=tipo_caso.id_tipo_caso
        )
        db.session.add(nuevo_caso)
        db.session.flush()  # Para obtener el ID del caso
        
        # Determinar el estado inicial según el tipo de instalación
        if es_cliente_nuevo:
            # Cliente nuevo requiere aprobación de gerencia
            estado_inicial = EstadoInstalacion.PENDIENTE_APROBACION
        elif es_usuario_adicional:
            # Usuario adicional: se crea automáticamente y se aprueba
            estado_inicial = EstadoInstalacion.USUARIO_CREADO
        elif es_cambio_equipo:
            # Cambio de equipo: usuario ya existe y está asignado, va directo a Usuario Creado
            estado_inicial = EstadoInstalacion.USUARIO_CREADO
        else:
            # Otros casos van a instalación pendiente
            estado_inicial = EstadoInstalacion.PENDIENTE_INSTALACION
        
        # Crear las instalaciones
        fecha_solicitud = data.get('fecha_solicitud')
        instalaciones_creadas = []
        
        if es_cliente_nuevo and numero_usuarios > 1:
            # Para cliente nuevo con múltiples usuarios, crear una instalación por usuario
            for i in range(numero_usuarios):
                observaciones_usuario = observaciones
                if numero_usuarios > 1:
                    observaciones_usuario = f"Usuario {i + 1} de {numero_usuarios}. {observaciones}".strip()
                
                nueva_instalacion = Instalacion(
                    id_caso=nuevo_caso.id_caso,
                    id_usuario_b2b=None,  # Se asignará cuando se cree el usuario
                    observaciones=observaciones_usuario,
                    estado=estado_inicial,
                    fecha_solicitud=fecha_solicitud if fecha_solicitud else None
                )
                db.session.add(nueva_instalacion)
                instalaciones_creadas.append(nueva_instalacion)
        else:
            # Para otros casos, crear una sola instalación
            nueva_instalacion = Instalacion(
                id_caso=nuevo_caso.id_caso,
                id_usuario_b2b=id_usuario_b2b,
                observaciones=observaciones,
                estado=estado_inicial,
                fecha_solicitud=fecha_solicitud if fecha_solicitud else None
            )
            db.session.add(nueva_instalacion)
            instalaciones_creadas.append(nueva_instalacion)
        
        # Para usuario adicional, establecer fecha de creación de usuario igual a la fecha de solicitud
        if es_usuario_adicional:
            for instalacion in instalaciones_creadas:
                # La aprobación no es requerida para usuario adicional
                # El usuario se crea automáticamente cuando se crea la solicitud
                instalacion.fecha_creacion_usuario = instalacion.fecha_solicitud
        
        db.session.commit()
        
        # Retornar la primera instalación para compatibilidad, pero se crearon múltiples
        return instalaciones_creadas[0] if instalaciones_creadas else None
    
    @staticmethod
    def create_instalacion_completa_multiple(data):
        """
        Versión mejorada que retorna todas las instalaciones creadas.
        Útil para mostrar al usuario cuántas solicitudes se crearon.
        """
        id_cliente = data.get('id_cliente')
        id_usuario_b2b = data.get('id_usuario_b2b')
        es_cliente_nuevo = data.get('es_cliente_nuevo', False)
        es_primer_usuario = data.get('es_primer_usuario', True)
        es_cambio_equipo = data.get('es_cambio_equipo', False)
        es_usuario_adicional = data.get('es_usuario_adicional', False)
        numero_usuarios = data.get('numero_usuarios', 1)
        observaciones = data.get('observaciones', '')
        datos_usuario_adicional = data.get('datos_usuario_adicional')
        
        # Validar usuario B2B si se proporciona
        if id_usuario_b2b:
            usuario_b2b = UsuarioB2BService.get_usuario_b2b_by_id(id_usuario_b2b)
            if usuario_b2b.id_cliente != id_cliente:
                raise BusinessRuleError("El usuario B2B no pertenece al cliente seleccionado.")
        
        # Crear usuario B2B automáticamente si es usuario adicional
        if es_usuario_adicional and datos_usuario_adicional:
            from app.api.v1.services.instalacion_service_helper import crear_usuario_b2b_con_automatizacion
            nuevo_usuario, id_usuario_b2b = crear_usuario_b2b_con_automatizacion(datos_usuario_adicional, id_cliente)
        
        # Determinar la categoría y nombre del caso según la configuración
        if es_cambio_equipo:
            categoria = CategoriaTipoCaso.INSTALACION_CAMBIO_EQUIPO
            nombre_caso = "Instalación por cambio de equipo"
        elif es_cliente_nuevo:
            categoria = CategoriaTipoCaso.INSTALACION_CLIENTE_NUEVO
            if numero_usuarios > 1:
                nombre_caso = f"Instalación nuevo cliente B2B - {numero_usuarios} usuarios"
            else:
                nombre_caso = "Instalación nuevo cliente B2B"
        elif es_usuario_adicional:
            categoria = CategoriaTipoCaso.INSTALACION_USUARIO_ADICIONAL
            nombre_caso = "Instalación usuario adicional B2B"
        else:
            # Fallback para compatibilidad
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
        
        # Crear la descripción del caso
        descripcion_caso = nombre_caso
        if es_cliente_nuevo and numero_usuarios > 1:
            descripcion_caso += f" - Se crearán {numero_usuarios} usuarios B2B para el cliente"
        if observaciones:
            descripcion_caso += f". {observaciones}"
        
        # Crear el caso automáticamente
        nuevo_caso = Caso(
            titulo=nombre_caso,
            descripcion=descripcion_caso,
            estado=EstadoCaso.ABIERTO,
            prioridad=PrioridadCaso.MEDIA,
            id_cliente=id_cliente,
            id_usuario_creacion=current_user_id,
            id_tipo_caso=tipo_caso.id_tipo_caso
        )
        db.session.add(nuevo_caso)
        db.session.flush()  # Para obtener el ID del caso
        
        # Determinar el estado inicial según el tipo de instalación
        if es_cliente_nuevo:
            # Cliente nuevo requiere aprobación de gerencia
            estado_inicial = EstadoInstalacion.PENDIENTE_APROBACION
        elif es_usuario_adicional:
            # Usuario adicional: se crea automáticamente y se aprueba
            estado_inicial = EstadoInstalacion.USUARIO_CREADO
        elif es_cambio_equipo:
            # Cambio de equipo: usuario ya existe y está asignado, va directo a Usuario Creado
            estado_inicial = EstadoInstalacion.USUARIO_CREADO
        else:
            # Otros casos van a instalación pendiente
            estado_inicial = EstadoInstalacion.PENDIENTE_INSTALACION
        
        # Crear las instalaciones
        fecha_solicitud = data.get('fecha_solicitud')
        instalaciones_creadas = []
        casos_creados = []
        
        if es_cliente_nuevo and numero_usuarios > 1:
            # Para cliente nuevo con múltiples usuarios, crear un caso e instalación por usuario
            for i in range(numero_usuarios):
                observaciones_usuario = observaciones
                if numero_usuarios > 1:
                    observaciones_usuario = f"Usuario {i + 1} de {numero_usuarios}. {observaciones}".strip()
                
                # Crear un caso individual para cada usuario
                caso_individual = Caso(
                    titulo=f"Instalación nuevo cliente B2B - Usuario {i + 1}",
                    descripcion=f"Instalación para usuario {i + 1} de {numero_usuarios} del nuevo cliente B2B. {observaciones_usuario}",
                    estado=EstadoCaso.ABIERTO,
                    prioridad=PrioridadCaso.MEDIA,
                    id_cliente=id_cliente,
                    id_usuario_creacion=current_user_id,
                    id_tipo_caso=tipo_caso.id_tipo_caso
                )
                db.session.add(caso_individual)
                db.session.flush()  # Para obtener el ID del caso
                casos_creados.append(caso_individual)
                
                nueva_instalacion = Instalacion(
                    id_caso=caso_individual.id_caso,
                    id_usuario_b2b=None,  # Se asignará cuando se cree el usuario
                    observaciones=observaciones_usuario,
                    estado=estado_inicial,
                    fecha_solicitud=fecha_solicitud if fecha_solicitud else None
                )
                db.session.add(nueva_instalacion)
                instalaciones_creadas.append(nueva_instalacion)
        else:
            # Para otros casos, crear una sola instalación
            casos_creados.append(nuevo_caso)
            nueva_instalacion = Instalacion(
                id_caso=nuevo_caso.id_caso,
                id_usuario_b2b=id_usuario_b2b,
                observaciones=observaciones,
                estado=estado_inicial,
                fecha_solicitud=fecha_solicitud if fecha_solicitud else None
            )
            db.session.add(nueva_instalacion)
            instalaciones_creadas.append(nueva_instalacion)
        
        # Para usuario adicional, establecer fecha de creación de usuario igual a la fecha de solicitud
        if es_usuario_adicional:
            for instalacion in instalaciones_creadas:
                # La aprobación no es requerida para usuario adicional
                # El usuario se crea automáticamente cuando se crea la solicitud
                instalacion.fecha_creacion_usuario = instalacion.fecha_solicitud
        
        db.session.commit()
        
        # Retornar información completa sobre lo que se creó
        return {
            'casos': casos_creados,  # Cambiado de 'caso' a 'casos' para múltiples
            'instalaciones': instalaciones_creadas,
            'total_instalaciones': len(instalaciones_creadas)
        }