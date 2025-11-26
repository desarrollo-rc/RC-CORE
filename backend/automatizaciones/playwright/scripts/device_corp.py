from playwright.sync_api import sync_playwright, Page, Locator
from typing import Optional
from dataclasses import dataclass
import re
from navegation_corp import go_to_equipos


@dataclass
class InfoEquipo:
    """Información completa de un equipo."""
    fila: Locator
    nombre_empresa: str
    codigo_usuario: str
    nombre_usuario: str
    nombre_equipo: str
    mac: str
    procesador: str
    placa: str
    disco: str
    fecha_creacion: str
    estado: str
    estado_alta: str
    fecha_ultima_modificacion: str
    mensaje_alta: str


def _buscar_filas_equipo(page: Page, codigo_usuario: str, nombre_equipo: str | None = None) -> list[InfoEquipo]:
    """Busca equipos por código de usuario y opcionalmente por nombre de equipo.
    
    Retorna una lista de locators de las filas que coinciden.
    Si hay múltiples coincidencias, las imprime en consola.
    """
    # Asegurarse de estar en la página de equipos
    print(f"[DEBUG] Navegando a la página de equipos...")
    go_to_equipos(page)
    
    # Esperar a que la página se cargue completamente (igual que buscar_equipos)
    print(f"[DEBUG] Esperando a que la página se cargue...")
    page.wait_for_load_state("networkidle", timeout=15000)
    page.wait_for_timeout(2000)  # Esperar un poco más para que los elementos estén listos
    
    # Usar el mismo patrón que buscar_equipos
    # Intentar múltiples estrategias para encontrar el textbox
    print(f"[DEBUG] Buscando el campo de búsqueda...")
    textbox_buscar = None
    
    # Estrategia 1: Por rol y nombre
    try:
        textbox_buscar = page.get_by_role("textbox", name="Buscar Equipos")
        textbox_buscar.wait_for(state="visible", timeout=10000)
        print(f"[DEBUG] Textbox encontrado por rol y nombre")
    except Exception as e1:
        print(f"[DEBUG] No se encontró por rol y nombre: {e1}")
        # Estrategia 2: Por placeholder
        try:
            textbox_buscar = page.locator('input[placeholder*="Buscar"], input[placeholder*="Equipos"]').first
            textbox_buscar.wait_for(state="visible", timeout=10000)
            print(f"[DEBUG] Textbox encontrado por placeholder")
        except Exception as e2:
            print(f"[DEBUG] No se encontró por placeholder: {e2}")
            # Estrategia 3: Por ID o name
            try:
                textbox_buscar = page.locator('#txtBuscarEquipos, input[name*="buscar"], input[id*="buscar"]').first
                textbox_buscar.wait_for(state="visible", timeout=10000)
                print(f"[DEBUG] Textbox encontrado por ID/name")
            except Exception as e3:
                print(f"[DEBUG] No se encontró por ID/name: {e3}")
                # Estrategia 4: Cualquier input de texto visible
                try:
                    textbox_buscar = page.locator('input[type="text"]').first
                    textbox_buscar.wait_for(state="visible", timeout=10000)
                    print(f"[DEBUG] Textbox encontrado como primer input de texto")
                except Exception as e4:
                    print(f"[ERROR] No se pudo encontrar el campo de búsqueda: {e4}")
                    raise Exception(f"No se pudo encontrar el campo de búsqueda de equipos. Errores: {e1}, {e2}, {e3}, {e4}")
    
    # Hacer clic y llenar el campo
    print(f"[DEBUG] Llenando el campo de búsqueda con: {codigo_usuario}")
    textbox_buscar.click()
    textbox_buscar.fill(codigo_usuario)
    
    # Buscar y hacer clic en el botón de búsqueda
    print(f"[DEBUG] Buscando el botón de búsqueda...")
    try:
        btn_buscar = page.get_by_role("button", name="Buscar")
        btn_buscar.wait_for(state="visible", timeout=10000)
        btn_buscar.click()
        print(f"[DEBUG] Botón de búsqueda clickeado")
    except Exception as e:
        print(f"[DEBUG] No se encontró el botón por rol, intentando con Enter: {e}")
        textbox_buscar.press("Enter")
        print(f"[DEBUG] Presionado Enter en el campo de búsqueda")
    
    # Esperar a que el overlay de carga (blockUI) desaparezca
    print(f"[DEBUG] Esperando a que el overlay de carga desaparezca...")
    try:
        # Esperar a que el overlay blockUI desaparezca
        page.wait_for_function(
            "document.querySelectorAll('.blockUI.blockOverlay').length === 0",
            timeout=15000
        )
        print(f"[DEBUG] Overlay de carga desapareció")
    except Exception as e:
        print(f"[DEBUG] No se pudo esperar el overlay con wait_for_function: {e}")
        # Intentar esperar de otra forma
        try:
            overlay = page.locator('.blockUI.blockOverlay')
            overlay.wait_for(state="hidden", timeout=15000)
            print(f"[DEBUG] Overlay de carga desapareció (método alternativo)")
        except Exception:
            print(f"[DEBUG] Continuando sin esperar el overlay explícitamente")
            page.wait_for_timeout(2000)  # Esperar un tiempo fijo como fallback
    
    # Esperar a que la tabla de resultados exista/sea visible
    print(f"[DEBUG] Esperando a que la tabla de resultados aparezca...")
    page.wait_for_selector("#tablaBuscarEquipos", state="visible", timeout=15000)
    
    # Esperar a que la red esté inactiva para asegurar que los datos se cargaron
    try:
        page.wait_for_load_state("networkidle", timeout=10000)
    except Exception:
        # Si no se puede esperar networkidle, esperar un tiempo fijo
        page.wait_for_timeout(2000)
    
    # Hacer clic en la tabla como en buscar_equipos
    # Usar force=True si el overlay aún está presente
    print(f"[DEBUG] Haciendo clic en la tabla...")
    try:
        tabla_locator = page.locator("#tablaBuscarEquipos")
        tabla_locator.wait_for(state="visible", timeout=5000)
        # Intentar clic normal primero
        tabla_locator.click(timeout=5000)
        print(f"[DEBUG] Clic en tabla exitoso")
    except Exception as e:
        print(f"[DEBUG] Clic normal falló, intentando con force=True: {e}")
        # Si falla, usar force=True para forzar el clic
        tabla_locator.click(force=True)
        print(f"[DEBUG] Clic forzado en tabla exitoso")
    
    # Esperar un poco para que las filas se carguen
    page.wait_for_timeout(500)
    
    # Buscar las filas que coincidan
    tabla = page.locator("#tablaBuscarEquipos")
    filas = tabla.locator("tbody tr")
    
    # Esperar a que al menos una fila esté visible (o que no haya filas)
    try:
        # Esperar a que el tbody tenga contenido
        tabla.locator("tbody").wait_for(state="visible", timeout=3000)
        # Esperar a que al menos una fila esté visible
        if filas.count() > 0:
            filas.first.wait_for(state="visible", timeout=2000)
    except Exception:
        # Si no hay filas visibles, puede que no haya resultados
        pass
    
    total_filas = filas.count()
    print(f"[DEBUG] Total de filas encontradas en la tabla: {total_filas}")
    
    if total_filas == 0:
        print(f"[DEBUG] No se encontraron equipos para el usuario: {codigo_usuario}")
        return []
    
    filas_coincidentes = []
    etiquetas = [
        "nombre empresa",      # índice 1 (después del menú)
        "codigo usuario",      # índice 2
        "nombre usuario",      # índice 3
        "nombre equipo",       # índice 4
        "MAC",                 # índice 5
        "procesador",          # índice 6
        "placa",               # índice 7
        "disco",               # índice 8
        "fecha creación",      # índice 9
        "estado",              # índice 10
        "estado alta",         # índice 11
        "fecha ultima modificación",  # índice 12
        "mensaje alta",        # índice 13
    ]
    
    # Si se especifica nombre_equipo, buscar por él también
    if nombre_equipo:
        print(f"[DEBUG] Buscando equipos con usuario '{codigo_usuario}' y nombre '{nombre_equipo}'")
    else:
        print(f"[DEBUG] Buscando equipos con usuario '{codigo_usuario}' (sin filtrar por nombre)")
    
    for i in range(total_filas):
        fila = filas.nth(i)
        celdas = fila.locator("td")
        total_celdas = celdas.count()
        
        if total_celdas < 5:  # Necesitamos al menos hasta nombre equipo (índice 4)
            continue
        
        # Extraer todos los valores (saltando la primera columna que es el menú)
        valores = []
        for j in range(1, total_celdas):  # Empezar desde 1 para saltar el menú
            valores.append(celdas.nth(j).inner_text().strip())
        
        # Completar con vacío si faltan columnas
        while len(valores) < len(etiquetas):
            valores.append("")
        
        # Mapear los valores según el orden correcto
        # Según el debug: índice 1='RC Chile', índice 3='zonace1'
        # El usuario dice que índice 3 es el usuario, entonces:
        # - índice 1: nombre empresa
        # - índice 2: ? (probablemente código usuario, pero el debug muestra que índice 3 es 'zonace1')
        # - índice 3: codigo usuario (según el usuario)
        # - índice 4: nombre usuario
        # - índice 5: nombre equipo (segunda después del usuario)
        
        # Pero espera, el debug muestra que celdas.nth(1) es 'RC Chile' y celdas.nth(3) es 'zonace1'
        # Si celdas.nth(3) es el código usuario, entonces:
        nombre_empresa = valores[0] if len(valores) > 0 else ""
        codigo_usuario_fila = valores[2] if len(valores) > 2 else ""  # índice 3 en celdas = índice 2 en valores
        nombre_usuario_fila = valores[3] if len(valores) > 3 else ""
        nombre_equipo_fila = valores[4] if len(valores) > 4 else ""  # índice 5 en celdas = índice 4 en valores
        
        print(f"[DEBUG] Fila {i+1}: empresa='{nombre_empresa}', usuario='{codigo_usuario_fila}', nombre_usuario='{nombre_usuario_fila}', equipo='{nombre_equipo_fila}'")
        
        # Comparación case-insensitive
        coincide_usuario = codigo_usuario_fila.lower() == codigo_usuario.lower()
        coincide_equipo = True
        if nombre_equipo:
            coincide_equipo = nombre_equipo_fila.lower() == nombre_equipo.lower()
        
        if coincide_usuario and coincide_equipo:
            # Crear objeto con toda la información
            info_equipo = InfoEquipo(
                fila=fila,
                nombre_empresa=valores[0] if len(valores) > 0 else "",
                codigo_usuario=valores[2] if len(valores) > 2 else "",
                nombre_usuario=valores[3] if len(valores) > 3 else "",
                nombre_equipo=valores[4] if len(valores) > 4 else "",
                mac=valores[5] if len(valores) > 5 else "",
                procesador=valores[6] if len(valores) > 6 else "",
                placa=valores[7] if len(valores) > 7 else "",
                disco=valores[8] if len(valores) > 8 else "",
                fecha_creacion=valores[9] if len(valores) > 9 else "",
                estado=valores[10] if len(valores) > 10 else "",
                estado_alta=valores[11] if len(valores) > 11 else "",
                fecha_ultima_modificacion=valores[12] if len(valores) > 12 else "",
                mensaje_alta=valores[13] if len(valores) > 13 else "",
            )
            filas_coincidentes.append(info_equipo)
            print(f"[DEBUG] ✓ Coincidencia encontrada en fila {i+1}")
    
    # Si hay múltiples coincidencias, mostrar información en consola
    if len(filas_coincidentes) > 1:
        print(f"\n⚠️  Se encontraron {len(filas_coincidentes)} equipos con usuario '{codigo_usuario}'" + 
              (f" y nombre '{nombre_equipo}'" if nombre_equipo else "") + ":")
        for idx, info in enumerate(filas_coincidentes, 1):
            print(f"  Equipo {idx}: nombre_empresa={info.nombre_empresa}, codigo_usuario={info.codigo_usuario}, "
                  f"nombre_usuario={info.nombre_usuario}, nombre_equipo={info.nombre_equipo}, "
                  f"MAC={info.mac}, procesador={info.procesador}, placa={info.placa}, disco={info.disco}, "
                  f"fecha_creacion={info.fecha_creacion}, estado={info.estado}, estado_alta={info.estado_alta}, "
                  f"fecha_ultima_modificacion={info.fecha_ultima_modificacion}, mensaje_alta={info.mensaje_alta}")
        print("  (Por ahora se procesará el primer equipo encontrado)\n")
    elif len(filas_coincidentes) == 0:
        print(f"No se encontró el equipo para usuario: {codigo_usuario}" + (f", equipo: {nombre_equipo}" if nombre_equipo else ""))
    
    return filas_coincidentes


def activar_equipo(page: Page, codigo_usuario: str, nombre_equipo: str | None = None) -> bool:
    """Activa un equipo para el usuario dado.
    
    Realiza dos pasos:
    1. Gestionar Alta Equipo: Aprobar ("0")
    2. Gestionar Estado Equipo: Activo ("1")
    
    Ambos pasos incluyen comentarios indicando que se realizó desde el portal RC Core.
    
    Args:
        page: Página de Playwright
        codigo_usuario: Código del usuario
        nombre_equipo: Nombre del equipo (opcional, si hay múltiples equipos)
    
    Returns:
        True si se activó correctamente, False en caso contrario
    """
    go_to_equipos(page)
    
    # Buscar las filas del equipo
    equipos = _buscar_filas_equipo(page, codigo_usuario, nombre_equipo)
    if len(equipos) == 0:
        return False
    
    # Por ahora usar el primer equipo encontrado
    info_equipo = equipos[0]
    fila = info_equipo.fila
    
    comentario_rc_core = "Activación realizada desde el portal RC Core"
    
    try:
        # PASO 1: Gestionar Alta Equipo - Aprobar
        fila.get_by_role("link").first.click()
        page.wait_for_timeout(300)
        
        page.get_by_role("link", name=re.compile("Gestionar Alta Equipo")).click()
        
        # Esperar a que el modal se abra
        page.wait_for_selector("#ddlAlta", state="visible", timeout=5000)
        page.wait_for_timeout(300)
        
        # Obtener todas las opciones disponibles para debug
        options = page.locator("#ddlAlta option")
        option_count = options.count()
        print(f"[DEBUG] Opciones disponibles en ddlAlta: {option_count}")
        for i in range(option_count):
            opt = options.nth(i)
            value = opt.get_attribute("value")
            text = opt.inner_text().strip()
            print(f"[DEBUG]   Opción {i}: value='{value}', text='{text}'")
        
        # Seleccionar "Aprobar" por texto (el valor puede ser "0" o diferente)
        # Intentar primero por texto, luego por valor
        try:
            page.locator("#ddlAlta").select_option(label="Aprobar")
            print("[DEBUG] Seleccionado 'Aprobar' por label")
        except Exception:
            # Si no funciona por label, intentar por valor "0"
            try:
                page.locator("#ddlAlta").select_option("0")
                print("[DEBUG] Seleccionado por valor '0'")
            except Exception:
                # Si tampoco funciona, intentar con "1" (puede estar invertido)
                page.locator("#ddlAlta").select_option("1")
                print("[DEBUG] Seleccionado por valor '1'")
        page.wait_for_timeout(300)
        
        # Verificar que se seleccionó correctamente leyendo el texto seleccionado
        select_element = page.locator("#ddlAlta")
        selected_text = select_element.locator("option:checked").inner_text().strip()
        selected_value = select_element.input_value()
        print(f"[DEBUG] Texto seleccionado: '{selected_text}', Valor: '{selected_value}'")
        
        if "aprobar" not in selected_text.lower() and "rechazar" in selected_text.lower():
            print(f"[WARNING] Se seleccionó 'Rechazar' en vez de 'Aprobar'. Corrigiendo...")
            # Si se seleccionó rechazar, intentar con el otro valor
            if selected_value == "0":
                page.locator("#ddlAlta").select_option("1")
            elif selected_value == "1":
                page.locator("#ddlAlta").select_option("0")
            else:
                # Intentar por texto directamente
                page.locator("#ddlAlta").select_option(label="Aprobar")
            page.wait_for_timeout(300)
            # Verificar de nuevo
            selected_text = select_element.locator("option:checked").inner_text().strip()
            print(f"[DEBUG] Después de corregir - Texto seleccionado: '{selected_text}'")
        
        # Llenar comentario
        textarea_alta = page.locator("textarea[name=\"mensajeAlta\"]")
        textarea_alta.wait_for(state="visible", timeout=3000)
        textarea_alta.click()
        textarea_alta.fill(comentario_rc_core)
        page.wait_for_timeout(200)
        
        # Buscar y hacer clic en el botón Guardar
        # Usar el ID específico del botón
        btn_guardar = page.locator("#btnModificarAlta")
        btn_guardar.wait_for(state="visible", timeout=3000)
        btn_guardar.scroll_into_view_if_needed()
        btn_guardar.click()
        
        # Esperar a que el modal se cierre
        page.wait_for_selector("#formModificarAlta", state="hidden", timeout=10000)
        page.wait_for_timeout(500)
        
        # PASO 2: Gestionar Estado Equipo - Activo
        # Reabrir el menú de la fila
        fila.get_by_role("link").first.click()
        page.wait_for_timeout(300)
        
        page.get_by_role("link", name=re.compile("Gestionar Estado Equipo")).click()
        
        # Esperar a que el modal se abra
        page.wait_for_selector("#ddlActivo", state="visible", timeout=5000)
        page.wait_for_timeout(300)
        
        # Seleccionar "1" para activo
        page.locator("#ddlActivo").select_option("1")
        page.wait_for_timeout(300)
        
        # Verificar que se seleccionó correctamente
        selected_value = page.locator("#ddlActivo").input_value()
        if selected_value != "1":
            print(f"[WARNING] El valor seleccionado es '{selected_value}', esperado '1'. Reintentando...")
            page.locator("#ddlActivo").select_option("1")
            page.wait_for_timeout(300)
        
        # Llenar comentario (si existe el textarea)
        try:
            textarea_estado = page.locator("textarea[name='mensajeEstado'], textarea[name='comentarioEstado']")
            if textarea_estado.is_visible():
                textarea_estado.click()
                textarea_estado.fill(comentario_rc_core)
                page.wait_for_timeout(200)
        except Exception:
            # Si no existe el textarea, continuar sin comentario
            pass
        
        # Buscar y hacer clic en el botón Guardar
        # Usar el ID específico del botón (probablemente btnModificarEstado)
        try:
            btn_guardar = page.locator("#btnModificarEstado")
            btn_guardar.wait_for(state="visible", timeout=3000)
            btn_guardar.scroll_into_view_if_needed()
            
            # Esperar a que la petición se complete después del clic
            with page.expect_response(lambda response: response.status in [200, 400, 500], timeout=10000):
                btn_guardar.click()
        except Exception:
            # Si no existe btnModificarEstado, intentar otros selectores
            try:
                btn_alt = page.locator("button[type='submit']").filter(has_text="Guardar").first
                btn_alt.wait_for(state="visible", timeout=3000)
                with page.expect_response(lambda response: response.status in [200, 400, 500], timeout=10000):
                    btn_alt.click()
            except Exception:
                btn_alt2 = page.get_by_role("button", name=re.compile("Guardar", re.I))
                btn_alt2.wait_for(state="visible", timeout=3000)
                with page.expect_response(lambda response: response.status in [200, 400, 500], timeout=10000):
                    btn_alt2.click()
        
        # Esperar un momento para que procese la respuesta
        page.wait_for_timeout(1000)
        
        # Verificar si hay mensajes de error visibles antes de esperar que se cierre
        try:
            # Buscar mensajes de error comunes
            error_messages = page.locator(".error, .alert-danger, .validation-error, .field-error, [role='alert']")
            if error_messages.count() > 0:
                error_text = ""
                for i in range(min(error_messages.count(), 3)):  # Revisar hasta 3 mensajes
                    if error_messages.nth(i).is_visible():
                        error_text += error_messages.nth(i).inner_text() + "; "
                if error_text:
                    raise Exception(f"Error de validación en el formulario: {error_text.strip()}")
        except Exception as e:
            if "Error de validación" in str(e):
                raise e
            # Si no hay errores visibles, continuar
        
        # Esperar a que el modal se cierre (con un timeout más corto ya que esperamos la respuesta)
        try:
            page.wait_for_selector("#formModificarEstado", state="hidden", timeout=5000)
        except Exception:
            # Si el formulario no se cierra, puede ser que necesite cerrarse manualmente o hay un error
            # Verificar si el formulario aún está visible y si hay algún error
            if page.locator("#formModificarEstado").is_visible():
                # Intentar cerrar manualmente si hay un botón de cerrar
                try:
                    page.get_by_role("button", name=re.compile("Cerrar|Close|Cancelar", re.I)).first.click()
                    page.wait_for_timeout(500)
                except Exception:
                    pass
                # Verificar nuevamente si se cerró
                if page.locator("#formModificarEstado").is_visible():
                    raise Exception("El formulario no se cerró después de guardar. Puede haber un error de validación.")
        
        print(f"Equipo activado correctamente para usuario: {codigo_usuario}")
        return True
        
    except Exception as e:
        print(f"Error al activar equipo: {e}")
        # Intentar cerrar el modal si está abierto
        try:
            page.get_by_role("button", name="Close").click()
        except Exception:
            pass
        return False


def desactivar_equipo(page: Page, codigo_usuario: str, nombre_equipo: str | None = None) -> bool:
    """Desactiva un equipo del usuario.
    
    Realiza dos pasos:
    1. Gestionar Alta Equipo: Rechazar ("1")
    2. Gestionar Estado Equipo: Inactivo ("0")
    
    Ambos pasos incluyen comentarios indicando que se realizó desde el portal RC Core.
    
    Args:
        page: Página de Playwright
        codigo_usuario: Código del usuario
        nombre_equipo: Nombre del equipo (opcional, si hay múltiples equipos)
    
    Returns:
        True si se desactivó correctamente, False en caso contrario
    """
    go_to_equipos(page)
    
    # Buscar las filas del equipo
    equipos = _buscar_filas_equipo(page, codigo_usuario, nombre_equipo)
    if len(equipos) == 0:
        return False
    
    # Por ahora usar el primer equipo encontrado
    info_equipo = equipos[0]
    fila = info_equipo.fila
    
    comentario_rc_core = "Desactivación realizada desde el portal RC Core"
    
    try:
        # PASO 1: Gestionar Alta Equipo - Rechazar
        fila.get_by_role("link").first.click()
        page.wait_for_timeout(300)
        
        page.get_by_role("link", name=re.compile("Gestionar Alta Equipo")).click()
        
        # Esperar a que el modal se abra
        page.wait_for_selector("#ddlAlta", state="visible", timeout=5000)
        page.wait_for_timeout(300)
        
        # Obtener todas las opciones disponibles para debug
        options = page.locator("#ddlAlta option")
        option_count = options.count()
        print(f"[DEBUG] Opciones disponibles en ddlAlta: {option_count}")
        for i in range(option_count):
            opt = options.nth(i)
            value = opt.get_attribute("value")
            text = opt.inner_text().strip()
            print(f"[DEBUG]   Opción {i}: value='{value}', text='{text}'")
        
        # Seleccionar "Rechazar" por texto (el valor puede ser "1" o diferente)
        # Intentar primero por texto, luego por valor
        try:
            page.locator("#ddlAlta").select_option(label="Rechazar")
            print("[DEBUG] Seleccionado 'Rechazar' por label")
        except Exception:
            # Si no funciona por label, intentar por valor "1"
            try:
                page.locator("#ddlAlta").select_option("1")
                print("[DEBUG] Seleccionado por valor '1'")
            except Exception:
                # Si tampoco funciona, intentar con "0" (puede estar invertido)
                page.locator("#ddlAlta").select_option("0")
                print("[DEBUG] Seleccionado por valor '0'")
        page.wait_for_timeout(300)
        
        # Verificar que se seleccionó correctamente leyendo el texto seleccionado
        select_element = page.locator("#ddlAlta")
        selected_text = select_element.locator("option:checked").inner_text().strip()
        selected_value = select_element.input_value()
        print(f"[DEBUG] Texto seleccionado: '{selected_text}', Valor: '{selected_value}'")
        
        if "rechazar" not in selected_text.lower() and "aprobar" in selected_text.lower():
            print(f"[WARNING] Se seleccionó 'Aprobar' en vez de 'Rechazar'. Corrigiendo...")
            # Si se seleccionó aprobar, intentar con el otro valor
            if selected_value == "0":
                page.locator("#ddlAlta").select_option("1")
            elif selected_value == "1":
                page.locator("#ddlAlta").select_option("0")
            else:
                # Intentar por texto directamente
                page.locator("#ddlAlta").select_option(label="Rechazar")
            page.wait_for_timeout(300)
            # Verificar de nuevo
            selected_text = select_element.locator("option:checked").inner_text().strip()
            print(f"[DEBUG] Después de corregir - Texto seleccionado: '{selected_text}'")
        
        # Llenar comentario
        textarea_alta = page.locator("textarea[name=\"mensajeAlta\"]")
        textarea_alta.wait_for(state="visible", timeout=3000)
        textarea_alta.click()
        textarea_alta.fill(comentario_rc_core)
        page.wait_for_timeout(200)
        
        # Buscar y hacer clic en el botón Guardar
        # Usar el ID específico del botón
        btn_guardar = page.locator("#btnModificarAlta")
        btn_guardar.wait_for(state="visible", timeout=3000)
        btn_guardar.scroll_into_view_if_needed()
        btn_guardar.click()
        
        # Esperar a que el modal se cierre
        page.wait_for_selector("#formModificarAlta", state="hidden", timeout=10000)
        page.wait_for_timeout(500)
        
        # PASO 2: Gestionar Estado Equipo - Inactivo
        # Reabrir el menú de la fila
        fila.get_by_role("link").first.click()
        page.wait_for_timeout(300)
        
        page.get_by_role("link", name=re.compile("Gestionar Estado Equipo")).click()
        
        # Esperar a que el modal se abra
        page.wait_for_selector("#ddlActivo", state="visible", timeout=5000)
        page.wait_for_timeout(300)
        
        # Seleccionar "0" para inactivo
        page.locator("#ddlActivo").select_option("0")
        page.wait_for_timeout(300)
        
        # Verificar que se seleccionó correctamente
        selected_value = page.locator("#ddlActivo").input_value()
        if selected_value != "0":
            print(f"[WARNING] El valor seleccionado es '{selected_value}', esperado '0'. Reintentando...")
            page.locator("#ddlActivo").select_option("0")
            page.wait_for_timeout(300)
        
        # Llenar comentario (si existe el textarea)
        try:
            textarea_estado = page.locator("textarea[name='mensajeEstado'], textarea[name='comentarioEstado']")
            if textarea_estado.is_visible():
                textarea_estado.click()
                textarea_estado.fill(comentario_rc_core)
                page.wait_for_timeout(200)
        except Exception:
            # Si no existe el textarea, continuar sin comentario
            pass
        
        # Buscar y hacer clic en el botón Guardar
        # Usar el ID específico del botón (probablemente btnModificarEstado)
        try:
            btn_guardar = page.locator("#btnModificarEstado")
            btn_guardar.wait_for(state="visible", timeout=3000)
            btn_guardar.scroll_into_view_if_needed()
            
            # Esperar a que la petición se complete después del clic
            with page.expect_response(lambda response: response.status in [200, 400, 500], timeout=10000):
                btn_guardar.click()
        except Exception:
            # Si no existe btnModificarEstado, intentar otros selectores
            try:
                btn_alt = page.locator("button[type='submit']").filter(has_text="Guardar").first
                btn_alt.wait_for(state="visible", timeout=3000)
                with page.expect_response(lambda response: response.status in [200, 400, 500], timeout=10000):
                    btn_alt.click()
            except Exception:
                btn_alt2 = page.get_by_role("button", name=re.compile("Guardar", re.I))
                btn_alt2.wait_for(state="visible", timeout=3000)
                with page.expect_response(lambda response: response.status in [200, 400, 500], timeout=10000):
                    btn_alt2.click()
        
        # Esperar un momento para que procese la respuesta
        page.wait_for_timeout(1000)
        
        # Verificar si hay mensajes de error visibles antes de esperar que se cierre
        try:
            # Buscar mensajes de error comunes
            error_messages = page.locator(".error, .alert-danger, .validation-error, .field-error, [role='alert']")
            if error_messages.count() > 0:
                error_text = ""
                for i in range(min(error_messages.count(), 3)):  # Revisar hasta 3 mensajes
                    if error_messages.nth(i).is_visible():
                        error_text += error_messages.nth(i).inner_text() + "; "
                if error_text:
                    raise Exception(f"Error de validación en el formulario: {error_text.strip()}")
        except Exception as e:
            if "Error de validación" in str(e):
                raise e
            # Si no hay errores visibles, continuar
        
        # Esperar a que el modal se cierre (con un timeout más corto ya que esperamos la respuesta)
        try:
            page.wait_for_selector("#formModificarEstado", state="hidden", timeout=5000)
        except Exception:
            # Si el formulario no se cierra, puede ser que necesite cerrarse manualmente o hay un error
            # Verificar si el formulario aún está visible y si hay algún error
            if page.locator("#formModificarEstado").is_visible():
                # Intentar cerrar manualmente si hay un botón de cerrar
                try:
                    page.get_by_role("button", name=re.compile("Cerrar|Close|Cancelar", re.I)).first.click()
                    page.wait_for_timeout(500)
                except Exception:
                    pass
                # Verificar nuevamente si se cerró
                if page.locator("#formModificarEstado").is_visible():
                    raise Exception("El formulario no se cerró después de guardar. Puede haber un error de validación.")
        
        print(f"Equipo desactivado correctamente para usuario: {codigo_usuario}")
        return True
        
    except Exception as e:
        print(f"Error al desactivar equipo: {e}")
        # Intentar cerrar el modal si está abierto
        try:
            page.get_by_role("button", name="Close").click()
        except Exception:
            pass
        return False


def cambiar_equipo(page: Page, codigo_usuario: str, imei_anterior: str, imei_nuevo: str) -> None:
    """Cambia un equipo antiguo por uno nuevo (flujo a implementar)."""
    go_to_equipos(page)
    page.screenshot(path="equipos_cambiar_pendiente.png")

def buscar_equipos(page: Page, codigo_usuario: str) -> None:
    """Busca equipos, hace clic en la tabla y lista todos los resultados en consola."""
    go_to_equipos(page)
    page.get_by_role("textbox", name="Buscar Equipos").click()
    page.get_by_role("textbox", name="Buscar Equipos").fill(codigo_usuario)
    page.get_by_role("button", name="Buscar").click()

    # Espera a que la tabla de resultados exista/sea visible
    page.wait_for_selector("#tablaBuscarEquipos", state="visible")

    # Hace clic en la tabla como se solicita
    page.locator("#tablaBuscarEquipos").click()

    # Recorre todas las filas y las imprime
    tabla = page.locator("#tablaBuscarEquipos")
    filas = tabla.locator("tbody tr")
    total_filas = filas.count()

    print(f"Resultados encontrados: {total_filas}")
    etiquetas = [
        "nombre empresa",
        "codigo usuario",
        "nombre usuario",
        "nombre equipo",
        "MAC",
        "procesador",
        "placa",
        "disco",
        "fecha creación",
        "estado",
        "estado alta",
        "fecha ultima modificación",
        "mensaje alta",
    ]

    for i in range(total_filas):
        fila = filas.nth(i)
        celdas = fila.locator("td")
        total_celdas = celdas.count()
        valores = []
        for j in range(total_celdas):
            valores.append(celdas.nth(j).inner_text().strip())

        # Saltar la primera columna (menú)
        datos = valores[1:1 + len(etiquetas)]
        # Completar con vacío si faltan columnas
        if len(datos) < len(etiquetas):
            datos = datos + [""] * (len(etiquetas) - len(datos))
        pares = [f"{etiquetas[k]}: {datos[k]}" for k in range(len(etiquetas))]
        print(f"Resultado {i + 1}: " + ", ".join(pares))

    # Tras imprimir, para cada fila abre el menú y navega por las 3 opciones
    for i in range(total_filas):
        fila = filas.nth(i)
        # Abre el menú de la primera columna (link dentro de la fila)
        fila.get_by_role("link").first.click()

        # 1) Gestionar Alta Equipo
        page.get_by_role("link", name=re.compile("Gestionar Alta Equipo")).click()
        page.get_by_role("button", name="Close").click()


        # Reabrir menú
        fila.get_by_role("link").first.click()

        # 2) Gestionar Estado Equipo
        page.get_by_role("link", name=re.compile("Gestionar Estado Equipo")).click()
        page.get_by_role("button", name="Close").click()


        # Reabrir menú
        fila.get_by_role("link").first.click()

        # 3) Log Estado Equipo
        page.get_by_role("link", name=re.compile("Log Estado Equipo")).click()
        page.get_by_role("button", name="Close").click()


    page.screenshot(path="equipos_buscar_resultados.png")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # Ejemplos de uso (descomentar la que necesites):
        # activar_equipo(page, codigo_usuario="zonace1", nombre_equipo="L-CECHEVERRIA1")
        desactivar_equipo(page, codigo_usuario="zonace1", nombre_equipo="L-CECHEVERRIA1")
        # buscar_equipos(page, codigo_usuario="gpacifico1")

        context.close()
        browser.close()



