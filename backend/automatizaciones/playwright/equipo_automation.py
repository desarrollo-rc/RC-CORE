"""
Módulo de automatización para gestión de equipos en Corp usando Playwright.
Integra las funciones de device_corp.py para ser llamadas desde los servicios.
"""
import os
import sys
from typing import Dict, List, Optional
from playwright.sync_api import sync_playwright, Page, TimeoutError as PlaywrightTimeoutError

# Agregar el directorio de scripts al path
script_dir = os.path.join(os.path.dirname(__file__), 'scripts')
if script_dir not in sys.path:
    sys.path.insert(0, script_dir)

# Importar las funciones de los scripts
try:
    from device_corp import _buscar_filas_equipo, activar_equipo, desactivar_equipo, InfoEquipo
    from navegation_corp import go_to_equipos
except ImportError:
    # Fallback: intentar importar desde scripts.
    from scripts.device_corp import _buscar_filas_equipo, activar_equipo, desactivar_equipo, InfoEquipo
    from scripts.navegation_corp import go_to_equipos


def buscar_equipos_corp(codigo_usuario: str, headless: bool = True) -> Dict:
    """
    Busca todos los equipos de un usuario en Corp.
    
    Args:
        codigo_usuario: Código del usuario
        headless: Si ejecutar en modo headless (sin ventana visible)
    
    Returns:
        Dict con:
            - success: bool - Si la operación fue exitosa
            - equipos: List[Dict] - Lista de equipos encontrados con toda su información
            - message: str - Mensaje descriptivo
            - error: str - Mensaje de error si falló
    """
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=headless)
            context = browser.new_context()
            page = context.new_page()
            
            try:
                # Buscar todos los equipos del usuario (sin filtrar por nombre)
                print(f"[EQUIPO_AUTOMATION] Buscando equipos para usuario: {codigo_usuario}")
                equipos_info = _buscar_filas_equipo(page, codigo_usuario, nombre_equipo=None)
                print(f"[EQUIPO_AUTOMATION] Se encontraron {len(equipos_info)} equipos")
                
                # Convertir InfoEquipo a diccionarios
                equipos_data = []
                for idx, info in enumerate(equipos_info):
                    # Determinar si está activo basado en el estado
                    estado_activo = info.estado.lower() in ("activo", "1", "true") if info.estado else False
                    # Determinar el estado de alta
                    alta_aprobado = info.estado_alta.lower() in ("aprobado", "aprobada", "1") if info.estado_alta else False
                    
                    equipos_data.append({
                        "nombre_empresa": info.nombre_empresa,
                        "codigo_usuario": info.codigo_usuario,
                        "nombre_usuario": info.nombre_usuario,
                        "nombre_equipo": info.nombre_equipo,
                        "equipo": info.nombre_equipo,  # Alias para compatibilidad con frontend
                        "mac": info.mac,
                        "procesador": info.procesador,
                        "placa": info.placa,
                        "disco": info.disco,
                        "fecha_creacion": info.fecha_creacion,
                        "estado": estado_activo,
                        "estado_alta": info.estado_alta,
                        "alta": alta_aprobado,  # Boolean para compatibilidad
                        "alta_str": info.estado_alta or "Pendiente",  # String para mostrar
                        "fecha_ultima_modificacion": info.fecha_ultima_modificacion,
                        "mensaje_alta": info.mensaje_alta,
                        # Generar un ID temporal basado en el índice y nombre para el frontend
                        "id_equipo": f"corp_{idx}_{info.nombre_equipo}".replace(" ", "_").replace("-", "_"),
                        "es_corp": True,  # Flag para indicar que viene de Corp
                    })
                
                context.close()
                browser.close()
                
                print(f"[EQUIPO_AUTOMATION] Retornando {len(equipos_data)} equipos")
                return {
                    "success": True,
                    "equipos": equipos_data,
                    "total": len(equipos_data),
                    "message": f"Se encontraron {len(equipos_data)} equipo(s) para el usuario {codigo_usuario}",
                    "error": None
                }
                
            except PlaywrightTimeoutError as e:
                print(f"[EQUIPO_AUTOMATION] Timeout error: {str(e)}")
                context.close()
                browser.close()
                return {
                    "success": False,
                    "equipos": [],
                    "total": 0,
                    "message": "Timeout al buscar equipos en Corp",
                    "error": str(e)
                }
            except Exception as e:
                print(f"[EQUIPO_AUTOMATION] Error: {str(e)}")
                import traceback
                traceback.print_exc()
                context.close()
                browser.close()
                return {
                    "success": False,
                    "equipos": [],
                    "total": 0,
                    "message": f"Error al buscar equipos en Corp: {str(e)}",
                    "error": str(e)
                }
                
    except Exception as e:
        return {
            "success": False,
            "equipos": [],
            "total": 0,
            "message": f"Error al inicializar Playwright: {str(e)}",
            "error": str(e)
        }


def activar_equipo_corp(codigo_usuario: str, nombre_equipo: str, headless: bool = True) -> Dict:
    """
    Activa un equipo en Corp.
    
    Args:
        codigo_usuario: Código del usuario
        nombre_equipo: Nombre del equipo
        headless: Si ejecutar en modo headless
    
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
                resultado = activar_equipo(page, codigo_usuario=codigo_usuario, nombre_equipo=nombre_equipo)
                
                context.close()
                browser.close()
                
                if resultado:
                    return {
                        "success": True,
                        "message": f"Equipo {nombre_equipo} activado exitosamente en Corp para usuario {codigo_usuario}",
                        "error": None
                    }
                else:
                    return {
                        "success": False,
                        "message": f"No se pudo activar el equipo {nombre_equipo}",
                        "error": "La función activar_equipo retornó False"
                    }
                
            except Exception as e:
                context.close()
                browser.close()
                return {
                    "success": False,
                    "message": f"Error al activar equipo en Corp: {str(e)}",
                    "error": str(e)
                }
                
    except Exception as e:
        return {
            "success": False,
            "message": f"Error al inicializar Playwright: {str(e)}",
            "error": str(e)
        }


def desactivar_equipo_corp(codigo_usuario: str, nombre_equipo: str, headless: bool = True) -> Dict:
    """
    Desactiva un equipo en Corp.
    
    Args:
        codigo_usuario: Código del usuario
        nombre_equipo: Nombre del equipo
        headless: Si ejecutar en modo headless
    
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
                resultado = desactivar_equipo(page, codigo_usuario=codigo_usuario, nombre_equipo=nombre_equipo)
                
                context.close()
                browser.close()
                
                if resultado:
                    return {
                        "success": True,
                        "message": f"Equipo {nombre_equipo} desactivado exitosamente en Corp para usuario {codigo_usuario}",
                        "error": None
                    }
                else:
                    return {
                        "success": False,
                        "message": f"No se pudo desactivar el equipo {nombre_equipo}",
                        "error": "La función desactivar_equipo retornó False"
                    }
                
            except Exception as e:
                context.close()
                browser.close()
                return {
                    "success": False,
                    "message": f"Error al desactivar equipo en Corp: {str(e)}",
                    "error": str(e)
                }
                
    except Exception as e:
        return {
            "success": False,
            "message": f"Error al inicializar Playwright: {str(e)}",
            "error": str(e)
        }
