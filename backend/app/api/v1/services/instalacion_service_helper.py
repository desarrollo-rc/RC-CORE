# backend/app/api/v1/services/instalacion_service_helper.py
"""
Funciones auxiliares para el servicio de instalaciones.
"""
from flask import current_app
import os


def crear_usuario_b2b_con_automatizacion(datos_usuario_adicional, id_cliente):
    """
    Crea un usuario B2B y ejecuta la automatización de Playwright para crearlo en Corp.
    
    Returns:
        tuple: (nuevo_usuario, id_usuario_b2b)
    """
    from app.models.entidades.usuarios_b2b import UsuarioB2B
    from app.models.entidades.maestro_clientes import MaestroClientes
    from app.extensions import db
    from automatizaciones.playwright.usuario_automation import verificar_usuario_existe_corp, crear_usuario_corp
    
    # Obtener datos del cliente para la automatización
    cliente = MaestroClientes.query.get(id_cliente)
    if not cliente:
        raise ValueError(f"El cliente con ID {id_cliente} no existe.")
    
    nuevo_usuario = UsuarioB2B(
        nombre_completo=datos_usuario_adicional['nombre_completo'],
        usuario=datos_usuario_adicional['usuario'],
        email=datos_usuario_adicional['email'],
        id_cliente=id_cliente
    )
    password = datos_usuario_adicional['password']
    nuevo_usuario.set_password(password)
    db.session.add(nuevo_usuario)
    db.session.flush()  # Para obtener el ID del usuario
    id_usuario_b2b = nuevo_usuario.id_usuario_b2b
    
    # Llamar a la automatización de Playwright para crear el usuario en Corp
    try:
        current_app.logger.info(f"[AUTOMATIZACION] Iniciando creación de usuario B2B en Corp: {nuevo_usuario.usuario}")
        
        # Verificar si el usuario ya existe en Corp
        existe_en_corp = False
        try:
            headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
            
            resultado_verificacion = verificar_usuario_existe_corp(
                codigo_usuario=nuevo_usuario.usuario,
                nombre_usuario=nuevo_usuario.nombre_completo,
                headless=headless_mode
            )
            
            existe_en_corp = resultado_verificacion.get("exists", False)
            current_app.logger.info(f"[AUTOMATIZACION] Usuario {'existe' if existe_en_corp else 'no existe'} en Corp")
            
        except Exception as e:
            current_app.logger.warning(f"[AUTOMATIZACION] Error al verificar usuario en Corp: {str(e)}. Continuando con creación...")
            existe_en_corp = False
        
        # Si no existe en Corp, crear usando Playwright
        if not existe_en_corp:
            headless_mode = os.environ.get("PLAYWRIGHT_HEADLESS", "true").lower() in ("true", "1", "yes")
            
            resultado = crear_usuario_corp(
                codigo=nuevo_usuario.usuario,
                nombre=nuevo_usuario.nombre_completo,
                contrasena=password,
                rut_cliente=cliente.rut_cliente,
                email=nuevo_usuario.email,
                nombre_cliente=cliente.nombre_cliente,
                headless=headless_mode
            )
            
            if resultado["success"]:
                # Usuario creado y asociación completada exitosamente
                if hasattr(nuevo_usuario, 'asociacion_empresa_pendiente'):
                    nuevo_usuario.asociacion_empresa_pendiente = False
                db.session.commit()
                current_app.logger.info(f"[AUTOMATIZACION] Usuario {nuevo_usuario.usuario} creado exitosamente en Corp: {resultado['message']}")
            else:
                # Verificar si el usuario se creó pero falló la asociación
                asociacion_pendiente = resultado.get("asociacion_pendiente", False)
                usuario_creado = resultado.get("usuario_creado", False)
                
                if asociacion_pendiente and usuario_creado:
                    # Usuario creado en CORP pero falló la asociación empresa-usuario
                    if hasattr(nuevo_usuario, 'asociacion_empresa_pendiente'):
                        nuevo_usuario.asociacion_empresa_pendiente = True
                    db.session.commit()
                    current_app.logger.warning(
                        f"[AUTOMATIZACION] Usuario {nuevo_usuario.usuario} creado en Corp pero falló la asociación con la empresa. "
                        f"Error: {resultado.get('error')}. El usuario quedó marcado como pendiente de asociación."
                    )
                else:
                    # Fallo completo en la creación
                    if hasattr(nuevo_usuario, 'asociacion_empresa_pendiente'):
                        nuevo_usuario.asociacion_empresa_pendiente = False
                    db.session.commit()
                    current_app.logger.warning(
                        f"[AUTOMATIZACION] No se pudo crear usuario {nuevo_usuario.usuario} en Corp: {resultado.get('error')}. "
                        f"El usuario se creó localmente."
                    )
        else:
            current_app.logger.info(f"[AUTOMATIZACION] Usuario {nuevo_usuario.usuario} ya existe en Corp, no se requiere creación.")
            
    except Exception as e:
        # Si falla la automatización, loguear pero no bloquear la creación local
        current_app.logger.error(f"[AUTOMATIZACION] Error al crear usuario en Corp: {str(e)}. El usuario se creó localmente.", exc_info=True)
    
    return nuevo_usuario, id_usuario_b2b

