"""
Módulo de automatización para creación de usuarios en Corp usando Playwright.
Integra las funciones de user_creation_corp.py para ser llamadas desde los servicios.
"""
import os
import sys
from typing import Dict, Optional
from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeoutError

# Agregar el directorio de scripts al path
script_dir = os.path.join(os.path.dirname(__file__), 'scripts')
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Importar las funciones de los scripts
try:
    from user_creation_corp import crear_usuario, buscar_y_abrir_usuario, asignar_canal_b2b
    from navegation_corp import go_to_usuarios
except ImportError:
    # Fallback: intentar importar desde scripts.
    from scripts.user_creation_corp import crear_usuario, buscar_y_abrir_usuario, asignar_canal_b2b
    from scripts.navegation_corp import go_to_usuarios


def crear_usuario_corp(
    codigo: str,
    nombre: str,
    contrasena: str,
    rut_cliente: str,
    email: str,
    nombre_cliente: Optional[str] = None,
    headless: bool = True
) -> Dict:
    """
    Crea un usuario en Corp y le asigna el canal B2B.
    
    Args:
        codigo: Código del usuario
        nombre: Nombre completo del usuario
        contrasena: Contraseña del usuario
        rut_cliente: RUT del cliente (formato: 12345678-9)
        email: Email del usuario
        nombre_cliente: Nombre del cliente (opcional, para validación)
        headless: Si ejecutar en modo headless (sin ventana visible)
    
    Returns:
        Dict con:
            - success: bool - Si la operación fue exitosa
            - message: str - Mensaje descriptivo
            - error: str - Mensaje de error si falló
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                # Paso 1: Crear el usuario
                print(f"[AUTOMATIZACION] Paso 1: Creando usuario {codigo} en Corp...")
                crear_usuario(page, codigo=codigo, nombre=nombre, contrasena=contrasena, submit=True)
                
                # Esperar a que se cierre el modal de creación y la página se estabilice
                try:
                    # Esperar a que no haya modales visibles
                    page.wait_for_function("document.querySelectorAll('.modal.show').length === 0", timeout=10000)
                except Exception:
                    # Si no se cierra automáticamente, esperar un tiempo y cerrar manualmente si es necesario
                    page.wait_for_timeout(2000)
                    try:
                        # Intentar cerrar cualquier modal abierto
                        close_btn = page.locator('.modal.show .close, .modal.show [data-dismiss="modal"], .modal.show button.close').first
                        if close_btn.is_visible():
                            close_btn.click()
                            page.wait_for_timeout(1000)
                    except Exception:
                        pass
                
                # Esperar a que la red esté inactiva
                try:
                    page.wait_for_load_state("networkidle", timeout=5000)
                except Exception:
                    pass
                
                page.wait_for_timeout(1000)
                
                # Paso 2: Buscar y abrir el usuario recién creado
                print(f"[AUTOMATIZACION] Paso 2: Buscando usuario {codigo} en Corp...")
                buscar_y_abrir_usuario(page, codigo_usuario=codigo, nombre_usuario=nombre)
                
                # Esperar a que se abra el detalle completamente
                page.wait_for_selector("#txtCodigoUsuario", state="visible", timeout=10000)
                page.wait_for_timeout(1000)
                
                # Paso 3: Asignar canal B2B
                print(f"[AUTOMATIZACION] Paso 3: Asignando canal B2B al usuario {codigo}...")
                asignar_canal_b2b(
                    page,
                    codigo_usuario=codigo,
                    nombre_usuario=nombre,
                    rut=rut_cliente,
                    email=email
                )
                print(f"[AUTOMATIZACION] Canal B2B asignado exitosamente")
                
                context.close()
                browser.close()
                
                return {
                    "success": True,
                    "message": f"Usuario {codigo} creado exitosamente en Corp y canal B2B asignado",
                    "error": None
                }
                
            except PlaywrightTimeoutError as e:
                context.close()
                browser.close()
                return {
                    "success": False,
                    "message": "Timeout al crear usuario en Corp",
                    "error": str(e)
                }
            except Exception as e:
                context.close()
                browser.close()
                return {
                    "success": False,
                    "message": f"Error al crear usuario en Corp: {str(e)}",
                    "error": str(e)
                }
                
    except Exception as e:
        return {
            "success": False,
            "message": f"Error al inicializar Playwright: {str(e)}",
            "error": str(e)
        }


def verificar_usuario_existe_corp(codigo_usuario: str, nombre_usuario: str, headless: bool = True) -> Dict:
    """
    Verifica si un usuario existe en Corp.
    
    Args:
        codigo_usuario: Código del usuario
        nombre_usuario: Nombre del usuario
        headless: Si ejecutar en modo headless
    
    Returns:
        Dict con:
            - exists: bool - Si el usuario existe
            - message: str - Mensaje descriptivo
            - error: str - Mensaje de error si falló
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                go_to_usuarios(page)
                buscar_y_abrir_usuario(page, codigo_usuario=codigo_usuario, nombre_usuario=nombre_usuario)
                
                # Verificar si estamos en el detalle del usuario
                try:
                    page.wait_for_selector("#txtCodigoUsuario", timeout=3000)
                    existe = page.locator("#txtCodigoUsuario").is_visible()
                    
                    context.close()
                    browser.close()
                    
                    return {
                        "exists": existe,
                        "message": f"Usuario {codigo_usuario} {'existe' if existe else 'no existe'} en Corp",
                        "error": None
                    }
                except PlaywrightTimeoutError:
                    context.close()
                    browser.close()
                    return {
                        "exists": False,
                        "message": f"Usuario {codigo_usuario} no encontrado en Corp",
                        "error": None
                    }
                    
            except Exception as e:
                context.close()
                browser.close()
                return {
                    "exists": False,
                    "message": f"Error al verificar usuario: {str(e)}",
                    "error": str(e)
                }
                
    except Exception as e:
        return {
            "exists": False,
            "message": f"Error al inicializar Playwright: {str(e)}",
            "error": str(e)
        }

