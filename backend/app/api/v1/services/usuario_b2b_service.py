# backend/app/api/v1/services/usuario_b2b_service.py
import os
from app.models.entidades.usuarios_b2b import UsuarioB2B
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError
from app.extensions import db

class UsuarioB2BService:
    @staticmethod
    def get_all_usuarios_b2b(page=1, per_page=15, usuario=None, nombre_completo=None, id_cliente=None, activo=None):
        """
        Obtener una lista paginada de todos los usuarios B2B con filtros opcionales
        """
        query = UsuarioB2B.query
        
        # Aplicar filtros si se proporcionan
        if usuario:
            query = query.filter(UsuarioB2B.usuario.ilike(f'%{usuario}%'))
        if nombre_completo:
            query = query.filter(UsuarioB2B.nombre_completo.ilike(f'%{nombre_completo}%'))
        if id_cliente is not None:
            query = query.filter(UsuarioB2B.id_cliente == id_cliente)
        if activo is not None:
            query = query.filter(UsuarioB2B.activo == activo)
        
        paginated_result = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        return paginated_result

    @staticmethod
    def get_all_usuarios_b2b_active():
        return UsuarioB2B.query.filter_by(activo=True).all()
    
    @staticmethod
    def get_usuario_b2b_by_id(usuario_id):
        usuario = UsuarioB2B.query.get(usuario_id)
        if not usuario:
            raise RelatedResourceNotFoundError(f"Usuario B2B con ID {usuario_id} no encontrado.")
        return usuario

    @staticmethod
    def create_usuario_b2b(data):
        """
        Crea un nuevo usuario B2B y activa la automatización de Playwright
        para crear y configurar el usuario en Corp si no existe.
        """
        from flask import current_app
        
        # Extraer la contraseña del data antes de crear el usuario
        password = data.pop('password', None)
        if not password:
            raise BusinessRuleError("La contraseña es requerida para crear un usuario B2B")
        
        # Verificar que el cliente existe antes de continuar
        from app.models.entidades.maestro_clientes import MaestroClientes
        cliente = MaestroClientes.query.get(data.get('id_cliente'))
        if not cliente:
            raise RelatedResourceNotFoundError(f"El cliente con ID {data.get('id_cliente')} no existe.")
        
        nuevo_usuario = UsuarioB2B(**data)
        
        # Establecer la contraseña usando el método seguro
        nuevo_usuario.set_password(password)
        
        # Crear el usuario en la base de datos primero
        db.session.add(nuevo_usuario)
        db.session.flush()  # Usar flush para obtener el ID sin hacer commit
        
        # Logging de inicio de automatización
        print(f"[AUTOMATIZACION] Iniciando creación de usuario B2B: {nuevo_usuario.usuario}")
        try:
            current_app.logger.info(f"[AUTOMATIZACION] Iniciando creación de usuario B2B: {nuevo_usuario.usuario}")
        except:
            pass
        
        # Verificar si el usuario existe en Corp antes de crear
        existe_en_corp = False
        try:
            from automatizaciones.playwright.usuario_automation import verificar_usuario_existe_corp
            
            headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
            print(f"[AUTOMATIZACION] Verificando si usuario {nuevo_usuario.usuario} existe en Corp...")
            
            resultado_verificacion = verificar_usuario_existe_corp(
                codigo_usuario=nuevo_usuario.usuario,
                nombre_usuario=nuevo_usuario.nombre_completo,
                headless=headless_mode
            )
            
            existe_en_corp = resultado_verificacion.get("exists", False)
            print(f"[AUTOMATIZACION] Usuario {'existe' if existe_en_corp else 'no existe'} en Corp")
            
        except Exception as e:
            # Si falla la verificación, asumimos que no existe y continuamos
            print(f"[AUTOMATIZACION] Error al verificar usuario en Corp: {str(e)}. Continuando con creación...")
            existe_en_corp = False
        
        # Si no existe en Corp, llamar a la automatización de Playwright
        if not existe_en_corp:
            try:
                from automatizaciones.playwright.usuario_automation import crear_usuario_corp
                
                print(f"[AUTOMATIZACION] Creando usuario {nuevo_usuario.usuario} en Corp...")
                try:
                    current_app.logger.info(f"[AUTOMATIZACION] Creando usuario {nuevo_usuario.usuario} en Corp...")
                except:
                    pass
                
                # Determinar si ejecutar en modo headless
                headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
                
                # Llamar a la automatización
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
                    # Usuario creado y asociación completada exitosamente
                    if hasattr(nuevo_usuario, 'asociacion_empresa_pendiente'):
                        nuevo_usuario.asociacion_empresa_pendiente = False
                    print(f"[AUTOMATIZACION] Usuario {nuevo_usuario.usuario} creado exitosamente en Corp")
                    try:
                        current_app.logger.info(f"[AUTOMATIZACION] Usuario {nuevo_usuario.usuario} creado exitosamente en Corp: {resultado['message']}")
                    except:
                        pass
                else:
                    # Verificar si el usuario se creó pero falló la asociación
                    asociacion_pendiente = resultado.get("asociacion_pendiente", False)
                    usuario_creado = resultado.get("usuario_creado", False)
                    
                    if asociacion_pendiente and usuario_creado:
                        # Usuario creado en CORP pero falló la asociación empresa-usuario
                        if hasattr(nuevo_usuario, 'asociacion_empresa_pendiente'):
                            nuevo_usuario.asociacion_empresa_pendiente = True
                        error_msg = f"Usuario {nuevo_usuario.usuario} creado en Corp pero falló la asociación con la empresa. Error: {resultado.get('error', resultado.get('message', 'Error desconocido'))}"
                        print(f"[AUTOMATIZACION] ⚠️ {error_msg}")
                        try:
                            current_app.logger.warning(f"[AUTOMATIZACION] {error_msg}. El usuario quedó marcado como pendiente de asociación.")
                        except:
                            pass
                    else:
                        # Fallo completo en la creación
                        if hasattr(nuevo_usuario, 'asociacion_empresa_pendiente'):
                            nuevo_usuario.asociacion_empresa_pendiente = False
                        error_msg = f"Error al crear usuario en Corp: {resultado.get('error', resultado.get('message', 'Error desconocido'))}"
                        print(f"[AUTOMATIZACION] ⚠️ {error_msg}")
                        try:
                            current_app.logger.warning(f"[AUTOMATIZACION] {error_msg}")
                        except:
                            pass
                    
            except Exception as e:
                # Para cualquier error en la automatización, loguear pero no bloquear la creación del usuario
                import traceback
                error_trace = traceback.format_exc()
                error_msg = f"Error al crear usuario en Corp: {str(e)}"
                print(f"[AUTOMATIZACION] ⚠️ {error_msg}")
                print(f"[AUTOMATIZACION] Traceback: {error_trace}")
                try:
                    current_app.logger.error(f"[AUTOMATIZACION] {error_msg}")
                except:
                    pass
                # No bloqueamos la creación del usuario en BD, solo registramos el error
        else:
            print(f"[AUTOMATIZACION] Usuario {nuevo_usuario.usuario} ya existe en Corp, saltando automatización")
        
        # Hacer commit de la transacción
        db.session.commit()
        return nuevo_usuario
    
    @staticmethod
    def update_usuario_b2b(usuario_id, data):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        for field, value in data.items():
            setattr(usuario, field, value)
        db.session.commit()
        return usuario
    
    @staticmethod
    def deactivate_usuario_b2b(usuario_id):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        usuario.activo = False
        db.session.commit()
        return usuario
    
    @staticmethod
    def activate_usuario_b2b(usuario_id):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        usuario.activo = True
        db.session.commit()
        return usuario
    
    @staticmethod
    def get_usuarios_b2b_by_cliente(cliente_id):
        """Obtiene todos los usuarios B2B activos de un cliente específico"""
        return UsuarioB2B.query.filter_by(id_cliente=cliente_id, activo=True).all()
    
    @staticmethod
    def sugerir_nombre_usuario(cliente_id):
        """
        Sugiere un nombre de usuario basado en los usuarios existentes del cliente.
        Patrón: [prefijo][número_correlativo]
        """
        usuarios_existentes = UsuarioB2BService.get_usuarios_b2b_by_cliente(cliente_id)
        
        if not usuarios_existentes:
            # Si no hay usuarios, sugerir el primero
            return "usuario1"
        
        # Extraer patrones de nombres existentes
        patrones = {}
        for usuario in usuarios_existentes:
            usuario_nombre = usuario.usuario.lower()
            
            # Buscar patrones como "autorep1", "autorep2", etc.
            import re
            match = re.match(r'^([a-zA-Z]+)(\d+)$', usuario_nombre)
            if match:
                prefijo = match.group(1)
                numero = int(match.group(2))
                if prefijo not in patrones:
                    patrones[prefijo] = []
                patrones[prefijo].append(numero)
        
        # Encontrar el prefijo más común
        if patrones:
            prefijo_mas_comun = max(patrones.keys(), key=lambda k: len(patrones[k]))
            numeros_usados = sorted(patrones[prefijo_mas_comun])
            
            # Encontrar el siguiente número disponible
            siguiente_numero = 1
            for num in numeros_usados:
                if num == siguiente_numero:
                    siguiente_numero += 1
                else:
                    break
            
            return f"{prefijo_mas_comun}{siguiente_numero}"
        else:
            # Si no hay patrones claros, usar un patrón genérico
            return "usuario1"
    
    @staticmethod
    def reintentar_asociacion_empresa_usuario(usuario_id):
        """
        Reintenta la asociación empresa-usuario para un usuario que fue creado en Corp
        pero falló la asociación inicial.
        
        Args:
            usuario_id: ID del usuario B2B
            
        Returns:
            UsuarioB2B actualizado
        """
        from flask import current_app
        
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        
        # Verificar si el campo existe y si está marcado como pendiente
        if hasattr(usuario, 'asociacion_empresa_pendiente'):
            if not usuario.asociacion_empresa_pendiente:
                raise BusinessRuleError("El usuario no está marcado como pendiente de asociación")
        else:
            # Si el campo no existe, permitir el reintento de todas formas
            current_app.logger.info(f"[AUTOMATIZACION] Campo asociacion_empresa_pendiente no existe en BD, permitiendo reintento de todas formas")
        
        # Obtener datos del cliente
        from app.models.entidades.maestro_clientes import MaestroClientes
        cliente = MaestroClientes.query.get(usuario.id_cliente)
        if not cliente:
            raise RelatedResourceNotFoundError(f"El cliente con ID {usuario.id_cliente} no existe.")
        
        # Llamar a la función de reintento
        try:
            from automatizaciones.playwright.usuario_automation import reintentar_asociacion_empresa_usuario
            
            headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
            
            current_app.logger.info(f"[AUTOMATIZACION] Reintentando asociación empresa-usuario para: {usuario.usuario}")
            
            resultado = reintentar_asociacion_empresa_usuario(
                codigo=usuario.usuario,
                nombre=usuario.nombre_completo,
                rut_cliente=cliente.rut_cliente,
                email=usuario.email,
                headless=headless_mode
            )
            
            if resultado["success"]:
                # Marcar como completado si el campo existe
                if hasattr(usuario, 'asociacion_empresa_pendiente'):
                    usuario.asociacion_empresa_pendiente = False
                db.session.commit()
                current_app.logger.info(f"[AUTOMATIZACION] Asociación empresa-usuario completada exitosamente para: {usuario.usuario}")
                return usuario
            else:
                # Mantener como pendiente
                db.session.commit()
                error_msg = resultado.get("error", resultado.get("message", "Error desconocido"))
                current_app.logger.warning(f"[AUTOMATIZACION] Error al reintentar asociación para {usuario.usuario}: {error_msg}")
                raise BusinessRuleError(f"No se pudo completar la asociación: {error_msg}")
                
        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"[AUTOMATIZACION] Error al reintentar asociación: {str(e)}", exc_info=True)
            raise BusinessRuleError(f"Error al reintentar asociación: {str(e)}")
    