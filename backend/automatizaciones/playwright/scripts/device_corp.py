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
        
        # Seleccionar "Aprobar" - usar el valor "1" basado en los logs
        select_element = page.locator("#ddlAlta")
        
        # Primero asegurarse de que el dropdown esté en un estado limpio
        try:
            select_element.click()
            page.wait_for_timeout(200)
        except:
            pass
        
        # Seleccionar "Aprobar" usando el valor "1" que sabemos que funciona
        try:
            select_element.select_option("1")  # Valor "1" = "Aprobar" según los logs
            print("[DEBUG] Seleccionado 'Aprobar' por valor '1'")
        except Exception as e:
            print(f"[DEBUG] Error al seleccionar por valor: {str(e)}")
            # Intentar por label como fallback
            try:
                select_element.select_option(label="Aprobar")
                print("[DEBUG] Seleccionado 'Aprobar' por label")
            except:
                raise Exception("No se pudo seleccionar 'Aprobar' en el dropdown")
        
        # Esperar y verificar que se seleccionó correctamente
        page.wait_for_timeout(500)
        selected_text = select_element.locator("option:checked").inner_text().strip()
        selected_value = select_element.input_value()
        print(f"[DEBUG] Texto seleccionado: '{selected_text}', Valor: '{selected_value}'")
        
        # Verificar que no esté en "Seleccione.." (valor vacío)
        if selected_value == "" or "seleccione" in selected_text.lower():
            raise Exception("El dropdown quedó en 'Seleccione..'. No se pudo seleccionar 'Aprobar'")
        
        # Verificar que se seleccionó Aprobar y no Rechazar
        if "rechazar" in selected_text.lower():
            print(f"[WARNING] Se seleccionó 'Rechazar' en vez de 'Aprobar'. Corrigiendo...")
            # Si el valor "1" es Rechazar, entonces "0" debe ser Aprobar
            if selected_value == "1":
                select_element.select_option("0")
            elif selected_value == "0":
                select_element.select_option("1")
            page.wait_for_timeout(300)
            selected_text = select_element.locator("option:checked").inner_text().strip()
            selected_value = select_element.input_value()
            print(f"[DEBUG] Después de corregir - Texto: '{selected_text}', Valor: '{selected_value}'")
        
        # Disparar evento de cambio para asegurar que el formulario detecte el cambio
        try:
            select_element.evaluate("el => el.dispatchEvent(new Event('change', { bubbles: true }))")
            page.wait_for_timeout(300)
        except:
            pass
        
        # Esperar un momento para que aparezcan todos los campos después de seleccionar el dropdown
        page.wait_for_timeout(500)
        
        # Llenar comentario - intentar múltiples métodos para asegurar que se llene
        textarea_alta = page.locator("textarea[name=\"mensajeAlta\"]")
        textarea_alta.wait_for(state="visible", timeout=3000)
        
        # Intentar llenar el campo usando diferentes métodos
        comentario_llenado = False
        for intento in range(3):
            try:
                textarea_alta.click()
                page.wait_for_timeout(100)
                textarea_alta.clear()
                page.wait_for_timeout(100)
                textarea_alta.fill(comentario_rc_core)
                page.wait_for_timeout(200)
                
                # Verificar que se llenó
                texto_comentario = textarea_alta.input_value()
                if texto_comentario and texto_comentario.strip() != "":
                    comentario_llenado = True
                    print(f"[DEBUG] Comentario llenado en intento {intento + 1}: '{texto_comentario[:50]}...'")
                    break
                else:
                    # Intentar con type en lugar de fill
                    textarea_alta.clear()
                    textarea_alta.type(comentario_rc_core, delay=50)
                    page.wait_for_timeout(200)
                    texto_comentario = textarea_alta.input_value()
                    if texto_comentario and texto_comentario.strip() != "":
                        comentario_llenado = True
                        print(f"[DEBUG] Comentario llenado con type() en intento {intento + 1}")
                        break
            except Exception as e:
                print(f"[DEBUG] Error en intento {intento + 1} de llenar comentario: {str(e)}")
        
        if not comentario_llenado:
            raise Exception("No se pudo llenar el campo de comentario después de 3 intentos")
        
        # Verificar si hay otros campos requeridos visibles antes de guardar
        campos_requeridos = page.locator("input[required]:visible, select[required]:visible, textarea[required]:visible")
        cantidad_requeridos = campos_requeridos.count()
        if cantidad_requeridos > 0:
            print(f"[DEBUG] Verificando {cantidad_requeridos} campos marcados como requeridos")
            for i in range(cantidad_requeridos):
                campo = campos_requeridos.nth(i)
                if campo.is_visible():
                    campo_name = campo.get_attribute("name") or campo.get_attribute("id") or "desconocido"
                    campo_value = ""
                    try:
                        campo_value = campo.input_value() or ""
                    except:
                        try:
                            campo_value = campo.inner_text() or ""
                        except:
                            campo_value = "no disponible"
                    print(f"[DEBUG] Campo requerido {i+1}: name/id={campo_name}, valor='{campo_value[:50]}'")
        
        # Verificación final antes de guardar: asegurarse de que el dropdown tiene un valor válido
        final_dropdown_value = select_element.input_value()
        final_dropdown_text = select_element.locator("option:checked").inner_text().strip()
        
        if final_dropdown_value == "" or "seleccione" in final_dropdown_text.lower():
            raise Exception(f"El dropdown está en estado inválido antes de guardar: valor='{final_dropdown_value}', texto='{final_dropdown_text}'")
        
        # Verificación final del comentario
        final_comentario = textarea_alta.input_value()
        if not final_comentario or final_comentario.strip() == "":
            raise Exception("El comentario está vacío antes de guardar")
        
        print(f"[DEBUG] Verificación pre-guardar: dropdown='{final_dropdown_text}' (valor: {final_dropdown_value}), comentario='{final_comentario[:30]}...'")
        
        # Buscar y hacer clic en el botón Guardar
        btn_guardar = page.locator("#btnModificarAlta")
        btn_guardar.wait_for(state="visible", timeout=3000)
        btn_guardar.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        
        # Verificar que el botón no esté deshabilitado
        if btn_guardar.is_disabled():
            raise Exception("El botón Guardar está deshabilitado. Verifique que todos los campos requeridos estén completados.")
        
        # Hacer clic en el botón y esperar respuesta
        print("[DEBUG] Haciendo clic en el botón Guardar...")
        btn_guardar.click()
        
        # Esperar a que el modal se cierre - PRIORIDAD: verificar si se cerró antes de buscar errores
        modal_cerrado = False
        try:
            page.wait_for_selector("#formModificarAlta", state="hidden", timeout=8000)
            modal_cerrado = True
            print("[DEBUG] Modal de Alta Equipo se cerró exitosamente")
        except Exception:
            # Verificar si el modal sigue visible
            if page.locator("#formModificarAlta").is_visible():
                print("[DEBUG] El modal sigue visible después de hacer clic en Guardar")
                # Esperar un poco más por si el cierre es lento
                page.wait_for_timeout(2000)
                if page.locator("#formModificarAlta").is_visible():
                    # Si todavía está visible, intentar cerrar manualmente
                    try:
                        close_btn = page.locator("#formModificarAlta button.close, #formModificarAlta [data-dismiss='modal']").first
                        if close_btn.is_visible():
                            close_btn.click()
                            page.wait_for_timeout(500)
                            modal_cerrado = True
                            print("[DEBUG] Modal cerrado manualmente")
                    except:
                        pass
                else:
                    modal_cerrado = True
            else:
                modal_cerrado = True
        
        # Solo si el modal NO se cerró, buscar errores y lanzar excepción
        if not modal_cerrado:
            print("[DEBUG] El modal no se cerró, buscando mensajes de error...")
            error_message = ""
            error_selectors = [
                ".error:visible", 
                ".alert-danger:visible", 
                ".validation-error:visible", 
                ".field-error:visible", 
                "[role='alert']:visible",
                ".text-danger:visible",
                ".alert:visible"
            ]
            
            for selector in error_selectors:
                try:
                    error_elements = page.locator(selector)
                    if error_elements.count() > 0:
                        for i in range(min(error_elements.count(), 5)):
                            error_elem = error_elements.nth(i)
                            if error_elem.is_visible():
                                error_text = error_elem.inner_text().strip()
                                if error_text and len(error_text) > 0:
                                    print(f"[DEBUG] Mensaje de error encontrado ({selector}): '{error_text}'")
                                    if not error_message:
                                        error_message = error_text
                except:
                    pass
            
            if error_message:
                raise Exception(f"Error de validación en el formulario: {error_message}")
            else:
                raise Exception("El formulario no se cerró después de guardar. Verifique que todos los campos requeridos estén completados.")
        
        print("[DEBUG] Paso 1 completado: Alta Equipo aprobada exitosamente")
        page.wait_for_timeout(500)
        
        # PASO 2: Gestionar Estado Equipo - Activo
        print("[DEBUG] Iniciando Paso 2: Gestionar Estado Equipo")
        
        # Reabrir el menú de la fila
        fila.get_by_role("link").first.click()
        page.wait_for_timeout(300)
        
        page.get_by_role("link", name=re.compile("Gestionar Estado Equipo")).click()
        
        # Esperar a que el modal se abra
        page.wait_for_selector("#ddlActivo", state="visible", timeout=5000)
        page.wait_for_timeout(300)
        
        # Seleccionar "1" para activo
        select_estado = page.locator("#ddlActivo")
        select_estado.select_option("1")
        page.wait_for_timeout(300)
        
        # Verificar que se seleccionó correctamente
        selected_value = select_estado.input_value()
        if selected_value != "1":
            print(f"[WARNING] El valor seleccionado es '{selected_value}', esperado '1'. Reintentando...")
            select_estado.select_option("1")
            page.wait_for_timeout(300)
            selected_value = select_estado.input_value()
        
        print(f"[DEBUG] Estado seleccionado: valor='{selected_value}'")
        
        # Disparar evento de cambio
        try:
            select_estado.evaluate("el => el.dispatchEvent(new Event('change', { bubbles: true }))")
            page.wait_for_timeout(300)
        except:
            pass
        
        # Esperar a que aparezcan todos los campos
        page.wait_for_timeout(500)
        
        # Debug: listar todos los textareas disponibles en el formulario
        try:
            all_textareas = page.locator("#formModificarEstado textarea, .modal.show textarea")
            count = all_textareas.count()
            print(f"[DEBUG] Total de textareas encontrados en el formulario de estado: {count}")
            for i in range(count):
                try:
                    ta = all_textareas.nth(i)
                    name_attr = ta.get_attribute("name") or "sin nombre"
                    id_attr = ta.get_attribute("id") or "sin id"
                    is_vis = ta.is_visible()
                    print(f"[DEBUG] Textarea {i+1}: name='{name_attr}', id='{id_attr}', visible={is_vis}")
                except:
                    pass
        except:
            pass
        
        # Llenar comentario - buscar el textarea con múltiples selectores posibles
        textarea_estado = None
        
        # Lista de selectores posibles para el textarea de comentario
        selectores_textarea = [
            "textarea[name='mensajeEstado']",
            "textarea[name='comentarioEstado']",
            "textarea[name='mensaje']",
            "#formModificarEstado textarea",
            "form#formModificarEstado textarea",
            ".modal.show textarea",
            "#formModificarEstado textarea[name]"
        ]
        
        # Buscar el textarea dentro del formulario de estado
        for selector in selectores_textarea:
            try:
                textarea_candidate = page.locator(selector)
                if textarea_candidate.count() > 0:
                    # Verificar que al menos uno sea visible
                    for i in range(textarea_candidate.count()):
                        if textarea_candidate.nth(i).is_visible(timeout=1000):
                            textarea_estado = textarea_candidate.nth(i)
                            name_attr = textarea_estado.get_attribute("name") or "sin nombre"
                            print(f"[DEBUG] Textarea encontrado usando selector '{selector}': name='{name_attr}'")
                            break
                    if textarea_estado:
                        break
            except Exception as e:
                print(f"[DEBUG] Error con selector '{selector}': {str(e)}")
                continue
        
        # Si no se encontró, buscar cualquier textarea visible en el modal
        if not textarea_estado:
            try:
                all_textareas = page.locator("#formModificarEstado textarea, .modal.show textarea")
                if all_textareas.count() > 0:
                    for i in range(all_textareas.count()):
                        ta = all_textareas.nth(i)
                        if ta.is_visible(timeout=1000):
                            textarea_estado = ta
                            name_attr = textarea_estado.get_attribute("name") or "sin nombre"
                            print(f"[DEBUG] Textarea encontrado buscando todos los textareas del modal: name='{name_attr}'")
                            break
            except Exception as e:
                print(f"[DEBUG] Error buscando textareas del modal: {str(e)}")
        
        if not textarea_estado:
            # Último intento: buscar cualquier textarea en la página que esté visible
            try:
                all_visible_textareas = page.locator("textarea:visible")
                if all_visible_textareas.count() > 0:
                    textarea_estado = all_visible_textareas.first
                    name_attr = textarea_estado.get_attribute("name") or "sin nombre"
                    print(f"[DEBUG] Textarea encontrado buscando textareas visibles en la página: name='{name_attr}'")
            except:
                pass
        
        if not textarea_estado:
            raise Exception("No se pudo encontrar el textarea de comentario en el formulario de estado")
        
        # Esperar a que sea visible
        textarea_estado.wait_for(state="visible", timeout=3000)
        
        # Intentar llenar el comentario usando múltiples métodos
        comentario_estado_llenado = False
        for intento in range(3):
            try:
                textarea_estado.click()
                page.wait_for_timeout(100)
                textarea_estado.clear()
                page.wait_for_timeout(100)
                textarea_estado.fill(comentario_rc_core)
                page.wait_for_timeout(200)
                
                # Verificar que se llenó
                texto_comentario = textarea_estado.input_value()
                if texto_comentario and texto_comentario.strip() != "":
                    comentario_estado_llenado = True
                    print(f"[DEBUG] Comentario de estado llenado en intento {intento + 1}: '{texto_comentario[:50]}...'")
                    break
                else:
                    # Intentar con type
                    textarea_estado.clear()
                    textarea_estado.type(comentario_rc_core, delay=50)
                    page.wait_for_timeout(200)
                    texto_comentario = textarea_estado.input_value()
                    if texto_comentario and texto_comentario.strip() != "":
                        comentario_estado_llenado = True
                        print(f"[DEBUG] Comentario de estado llenado con type() en intento {intento + 1}")
                        break
            except Exception as e:
                print(f"[DEBUG] Error en intento {intento + 1} de llenar comentario de estado: {str(e)}")
        
        if not comentario_estado_llenado:
            raise Exception("No se pudo llenar el campo de comentario de estado después de 3 intentos")
        
        # Verificación final antes de guardar
        final_estado_value = select_estado.input_value()
        final_comentario = textarea_estado.input_value()
        
        if final_estado_value != "1":
            raise Exception(f"El dropdown de estado no está en '1' antes de guardar: valor='{final_estado_value}'")
        
        if not final_comentario or final_comentario.strip() == "":
            raise Exception("El comentario de estado está vacío antes de guardar")
        
        print(f"[DEBUG] Verificación pre-guardar estado: dropdown='1', comentario='{final_comentario[:30]}...'")
        
        # Buscar y hacer clic en el botón Guardar
        btn_guardar_estado = page.locator("#btnModificarEstado")
        btn_guardar_estado.wait_for(state="visible", timeout=3000)
        btn_guardar_estado.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        
        # Verificar que el botón no esté deshabilitado
        if btn_guardar_estado.is_disabled():
            raise Exception("El botón Guardar está deshabilitado en el formulario de estado.")
        
        print("[DEBUG] Haciendo clic en el botón Guardar del estado...")
        btn_guardar_estado.click()
        page.wait_for_timeout(3000)
        
        # Buscar mensajes de error (pero no fallar si el modal se cierra)
        error_message_estado = ""
        error_selectors = [
            ".error:visible", 
            ".alert-danger:visible", 
            "[role='alert']:visible",
            ".alert:visible"
        ]
        
        for selector in error_selectors:
            try:
                error_elements = page.locator(selector)
                if error_elements.count() > 0:
                    for i in range(min(error_elements.count(), 5)):
                        error_elem = error_elements.nth(i)
                        if error_elem.is_visible():
                            error_text = error_elem.inner_text().strip()
                            if error_text and len(error_text) > 0:
                                print(f"[DEBUG] Mensaje de error en estado ({selector}): '{error_text}'")
                                if not error_message_estado:
                                    error_message_estado = error_text
            except:
                pass
        
        # Esperar a que el modal se cierre
        modal_estado_cerrado = False
        try:
            page.wait_for_selector("#formModificarEstado", state="hidden", timeout=8000)
            modal_estado_cerrado = True
            print("[DEBUG] Modal de Estado Equipo se cerró exitosamente")
        except Exception:
            if page.locator("#formModificarEstado").is_visible():
                print("[DEBUG] El modal de estado sigue visible después de hacer clic en Guardar")
                page.wait_for_timeout(2000)
                if page.locator("#formModificarEstado").is_visible():
                    # Intentar cerrar manualmente
                    try:
                        close_btn = page.locator("#formModificarEstado button.close, #formModificarEstado [data-dismiss='modal']").first
                        if close_btn.is_visible():
                            close_btn.click()
                            page.wait_for_timeout(500)
                            modal_estado_cerrado = True
                            print("[DEBUG] Modal de estado cerrado manualmente")
                    except:
                        pass
                    
                    if not modal_estado_cerrado and page.locator("#formModificarEstado").is_visible():
                        if error_message_estado:
                            raise Exception(f"Error de validación en el formulario de estado: {error_message_estado}")
                        else:
                            raise Exception("El formulario de estado no se cerró después de guardar.")
                else:
                    modal_estado_cerrado = True
            else:
                modal_estado_cerrado = True
        
        if not modal_estado_cerrado:
            raise Exception("No se pudo cerrar el modal de Estado Equipo")
        
        print(f"[DEBUG] Paso 2 completado: Estado Equipo activado exitosamente")
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
    1. Gestionar Alta Equipo: Rechazar (valor "0")
    2. Gestionar Estado Equipo: Inactivo (valor "0")
    
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
        print("[DEBUG] Iniciando Paso 1: Gestionar Alta Equipo - Rechazar")
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
        
        # Seleccionar "Rechazar" - usar el valor "0" (opuesto de "1" que es Aprobar)
        select_element = page.locator("#ddlAlta")
        
        # Primero asegurarse de que el dropdown esté en un estado limpio
        try:
            select_element.click()
            page.wait_for_timeout(200)
        except:
            pass
        
        # Seleccionar "Rechazar" usando el valor "0"
        try:
            select_element.select_option("0")  # Valor "0" = "Rechazar" según los logs
            print("[DEBUG] Seleccionado 'Rechazar' por valor '0'")
        except Exception as e:
            print(f"[DEBUG] Error al seleccionar por valor: {str(e)}")
            # Intentar por label como fallback
            try:
                select_element.select_option(label="Rechazar")
                print("[DEBUG] Seleccionado 'Rechazar' por label")
            except:
                raise Exception("No se pudo seleccionar 'Rechazar' en el dropdown")
        
        # Esperar y verificar que se seleccionó correctamente
        page.wait_for_timeout(500)
        selected_text = select_element.locator("option:checked").inner_text().strip()
        selected_value = select_element.input_value()
        print(f"[DEBUG] Texto seleccionado: '{selected_text}', Valor: '{selected_value}'")
        
        # Verificar que no esté en "Seleccione.." (valor vacío)
        if selected_value == "" or "seleccione" in selected_text.lower():
            raise Exception("El dropdown quedó en 'Seleccione..'. No se pudo seleccionar 'Rechazar'")
        
        # Verificar que se seleccionó Rechazar y no Aprobar
        if "aprobar" in selected_text.lower():
            print(f"[WARNING] Se seleccionó 'Aprobar' en vez de 'Rechazar'. Corrigiendo...")
            # Si el valor "0" es Aprobar, entonces "1" debe ser Rechazar
            if selected_value == "0":
                select_element.select_option("1")
            elif selected_value == "1":
                select_element.select_option("0")
            page.wait_for_timeout(300)
            selected_text = select_element.locator("option:checked").inner_text().strip()
            selected_value = select_element.input_value()
            print(f"[DEBUG] Después de corregir - Texto: '{selected_text}', Valor: '{selected_value}'")
        
        # Disparar evento de cambio para asegurar que el formulario detecte el cambio
        try:
            select_element.evaluate("el => el.dispatchEvent(new Event('change', { bubbles: true }))")
            page.wait_for_timeout(300)
        except:
            pass
        
        # Esperar un momento para que aparezcan todos los campos después de seleccionar el dropdown
        page.wait_for_timeout(500)
        
        # Llenar comentario - usar la misma lógica robusta que activar_equipo
        textarea_alta = page.locator("textarea[name=\"mensajeAlta\"]")
        textarea_alta.wait_for(state="visible", timeout=3000)
        
        comentario_llenado = False
        for intento in range(3):
            try:
                textarea_alta.click()
                page.wait_for_timeout(100)
                textarea_alta.clear()
                page.wait_for_timeout(100)
                textarea_alta.fill(comentario_rc_core)
                page.wait_for_timeout(200)
                
                texto_comentario = textarea_alta.input_value()
                if texto_comentario and texto_comentario.strip() != "":
                    comentario_llenado = True
                    print(f"[DEBUG] Comentario llenado en intento {intento + 1}: '{texto_comentario[:50]}...'")
                    break
                else:
                    textarea_alta.clear()
                    textarea_alta.type(comentario_rc_core, delay=50)
                    page.wait_for_timeout(200)
                    texto_comentario = textarea_alta.input_value()
                    if texto_comentario and texto_comentario.strip() != "":
                        comentario_llenado = True
                        print(f"[DEBUG] Comentario llenado con type() en intento {intento + 1}")
                        break
            except Exception as e:
                print(f"[DEBUG] Error en intento {intento + 1} de llenar comentario: {str(e)}")
        
        if not comentario_llenado:
            raise Exception("No se pudo llenar el campo de comentario después de 3 intentos")
        
        # Verificación final antes de guardar
        final_dropdown_value = select_element.input_value()
        final_dropdown_text = select_element.locator("option:checked").inner_text().strip()
        
        if final_dropdown_value == "" or "seleccione" in final_dropdown_text.lower():
            raise Exception("El dropdown de alta no tiene un valor válido antes de guardar")
        
        final_comentario = textarea_alta.input_value()
        if not final_comentario or final_comentario.strip() == "":
            raise Exception("El comentario de alta está vacío antes de guardar")
        
        print(f"[DEBUG] Verificación pre-guardar: dropdown='{final_dropdown_text}' (valor: {final_dropdown_value}), comentario='{final_comentario[:30]}...'")
        
        # Buscar y hacer clic en el botón Guardar
        btn_guardar = page.locator("#btnModificarAlta")
        btn_guardar.wait_for(state="visible", timeout=3000)
        btn_guardar.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        
        if btn_guardar.is_disabled():
            raise Exception("El botón Guardar está deshabilitado en el formulario de alta.")
        
        print("[DEBUG] Haciendo clic en el botón Guardar...")
        btn_guardar.click()
        
        # Esperar a que el modal se cierre - PRIORIDAD: verificar si se cerró antes de buscar errores
        modal_cerrado = False
        try:
            page.wait_for_selector("#formModificarAlta", state="hidden", timeout=8000)
            modal_cerrado = True
            print("[DEBUG] Modal de Alta Equipo se cerró exitosamente")
        except Exception:
            if page.locator("#formModificarAlta").is_visible():
                print("[DEBUG] El modal sigue visible después de hacer clic en Guardar")
                page.wait_for_timeout(2000)
                if page.locator("#formModificarAlta").is_visible():
                    try:
                        close_btn = page.locator("#formModificarAlta button.close, #formModificarAlta [data-dismiss='modal']").first
                        if close_btn.is_visible():
                            close_btn.click()
                            page.wait_for_timeout(500)
                            modal_cerrado = True
                            print("[DEBUG] Modal cerrado manualmente")
                    except:
                        pass
                else:
                    modal_cerrado = True
            else:
                modal_cerrado = True
        
        # Solo si el modal NO se cerró, buscar errores y lanzar excepción
        if not modal_cerrado:
            print("[DEBUG] El modal no se cerró, buscando mensajes de error...")
            error_message = ""
            error_selectors = [
                ".error:visible", 
                ".alert-danger:visible", 
                "[role='alert']:visible",
                ".alert:visible"
            ]
            
            for selector in error_selectors:
                try:
                    error_elements = page.locator(selector)
                    if error_elements.count() > 0:
                        for i in range(min(error_elements.count(), 5)):
                            error_elem = error_elements.nth(i)
                            if error_elem.is_visible():
                                error_text = error_elem.inner_text().strip()
                                if error_text and len(error_text) > 0:
                                    print(f"[DEBUG] Mensaje de error encontrado ({selector}): '{error_text}'")
                                    if not error_message:
                                        error_message = error_text
                except:
                    pass
            
            if error_message:
                raise Exception(f"Error de validación en el formulario: {error_message}")
            else:
                raise Exception("El formulario no se cerró después de guardar. Verifique que todos los campos requeridos estén completados.")
        
        print("[DEBUG] Paso 1 completado: Alta Equipo rechazada exitosamente")
        page.wait_for_timeout(500)
        
        # PASO 2: Gestionar Estado Equipo - Inactivo
        print("[DEBUG] Iniciando Paso 2: Gestionar Estado Equipo - Inactivo")
        fila.get_by_role("link").first.click()
        page.wait_for_timeout(300)
        
        page.get_by_role("link", name=re.compile("Gestionar Estado Equipo")).click()
        
        page.wait_for_selector("#ddlActivo", state="visible", timeout=5000)
        page.wait_for_timeout(300)
        
        # Seleccionar "0" para inactivo
        select_estado = page.locator("#ddlActivo")
        select_estado.select_option("0")
        page.wait_for_timeout(300)
        
        selected_value = select_estado.input_value()
        if selected_value != "0":
            print(f"[WARNING] El valor seleccionado es '{selected_value}', esperado '0'. Reintentando...")
            select_estado.select_option("0")
            page.wait_for_timeout(300)
            selected_value = select_estado.input_value()
        
        print(f"[DEBUG] Estado seleccionado: valor='{selected_value}'")
        
        # Disparar evento de cambio
        try:
            select_estado.evaluate("el => el.dispatchEvent(new Event('change', { bubbles: true }))")
            page.wait_for_timeout(300)
        except:
            pass
        
        page.wait_for_timeout(500)
        
        # Buscar y llenar el textarea de comentario (usar la misma lógica que activar_equipo)
        textarea_estado = None
        selectores_textarea = [
            "textarea[name='mensajeEstado']",
            "textarea[name='comentarioEstado']",
            "textarea[name='mensaje']",
            "#formModificarEstado textarea",
            "form#formModificarEstado textarea",
            ".modal.show textarea",
            "#formModificarEstado textarea[name]"
        ]
        
        for selector in selectores_textarea:
            try:
                textarea_candidate = page.locator(selector)
                if textarea_candidate.count() > 0:
                    for i in range(textarea_candidate.count()):
                        if textarea_candidate.nth(i).is_visible(timeout=1000):
                            textarea_estado = textarea_candidate.nth(i)
                            name_attr = textarea_estado.get_attribute("name") or "sin nombre"
                            print(f"[DEBUG] Textarea encontrado usando selector '{selector}': name='{name_attr}'")
                            break
                    if textarea_estado:
                        break
            except Exception as e:
                print(f"[DEBUG] Error con selector '{selector}': {str(e)}")
                continue
        
        if not textarea_estado:
            try:
                all_textareas = page.locator("#formModificarEstado textarea, .modal.show textarea")
                if all_textareas.count() > 0:
                    for i in range(all_textareas.count()):
                        ta = all_textareas.nth(i)
                        if ta.is_visible(timeout=1000):
                            textarea_estado = ta
                            name_attr = textarea_estado.get_attribute("name") or "sin nombre"
                            print(f"[DEBUG] Textarea encontrado buscando todos los textareas del modal: name='{name_attr}'")
                            break
            except Exception as e:
                print(f"[DEBUG] Error buscando textareas del modal: {str(e)}")
        
        if not textarea_estado:
            raise Exception("No se pudo encontrar el textarea de comentario en el formulario de estado")
        
        textarea_estado.wait_for(state="visible", timeout=3000)
        
        # Llenar comentario con múltiples intentos
        comentario_estado_llenado = False
        for intento in range(3):
            try:
                textarea_estado.click()
                page.wait_for_timeout(100)
                textarea_estado.clear()
                page.wait_for_timeout(100)
                textarea_estado.fill(comentario_rc_core)
                page.wait_for_timeout(200)
                
                texto_comentario = textarea_estado.input_value()
                if texto_comentario and texto_comentario.strip() != "":
                    comentario_estado_llenado = True
                    print(f"[DEBUG] Comentario de estado llenado en intento {intento + 1}: '{texto_comentario[:50]}...'")
                    break
                else:
                    textarea_estado.clear()
                    textarea_estado.type(comentario_rc_core, delay=50)
                    page.wait_for_timeout(200)
                    texto_comentario = textarea_estado.input_value()
                    if texto_comentario and texto_comentario.strip() != "":
                        comentario_estado_llenado = True
                        print(f"[DEBUG] Comentario de estado llenado con type() en intento {intento + 1}")
                        break
            except Exception as e:
                print(f"[DEBUG] Error en intento {intento + 1} de llenar comentario de estado: {str(e)}")
        
        if not comentario_estado_llenado:
            raise Exception("No se pudo llenar el campo de comentario de estado después de 3 intentos")
        
        # Verificación final antes de guardar
        final_estado_value = select_estado.input_value()
        final_comentario = textarea_estado.input_value()
        
        if final_estado_value != "0":
            raise Exception(f"El dropdown de estado no está en '0' antes de guardar: valor='{final_estado_value}'")
        
        if not final_comentario or final_comentario.strip() == "":
            raise Exception("El comentario de estado está vacío antes de guardar")
        
        print(f"[DEBUG] Verificación pre-guardar estado: dropdown='0', comentario='{final_comentario[:30]}...'")
        
        # Buscar y hacer clic en el botón Guardar
        btn_guardar_estado = page.locator("#btnModificarEstado")
        btn_guardar_estado.wait_for(state="visible", timeout=3000)
        btn_guardar_estado.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        
        if btn_guardar_estado.is_disabled():
            raise Exception("El botón Guardar está deshabilitado en el formulario de estado.")
        
        print("[DEBUG] Haciendo clic en el botón Guardar del estado...")
        btn_guardar_estado.click()
        page.wait_for_timeout(3000)
        
        # Buscar mensajes de error (pero no fallar si el modal se cierra)
        error_message_estado = ""
        error_selectors = [
            ".error:visible", 
            ".alert-danger:visible", 
            "[role='alert']:visible",
            ".alert:visible"
        ]
        
        for selector in error_selectors:
            try:
                error_elements = page.locator(selector)
                if error_elements.count() > 0:
                    for i in range(min(error_elements.count(), 5)):
                        error_elem = error_elements.nth(i)
                        if error_elem.is_visible():
                            error_text = error_elem.inner_text().strip()
                            if error_text and len(error_text) > 0:
                                print(f"[DEBUG] Mensaje de error en estado ({selector}): '{error_text}'")
                                if not error_message_estado:
                                    error_message_estado = error_text
            except:
                pass
        
        # Esperar a que el modal se cierre
        modal_estado_cerrado = False
        try:
            page.wait_for_selector("#formModificarEstado", state="hidden", timeout=8000)
            modal_estado_cerrado = True
            print("[DEBUG] Modal de Estado Equipo se cerró exitosamente")
        except Exception:
            if page.locator("#formModificarEstado").is_visible():
                print("[DEBUG] El modal de estado sigue visible después de hacer clic en Guardar")
                page.wait_for_timeout(2000)
                if page.locator("#formModificarEstado").is_visible():
                    try:
                        close_btn = page.locator("#formModificarEstado button.close, #formModificarEstado [data-dismiss='modal']").first
                        if close_btn.is_visible():
                            close_btn.click()
                            page.wait_for_timeout(500)
                            modal_estado_cerrado = True
                            print("[DEBUG] Modal de estado cerrado manualmente")
                    except:
                        pass
                    
                    if not modal_estado_cerrado and page.locator("#formModificarEstado").is_visible():
                        if error_message_estado:
                            raise Exception(f"Error de validación en el formulario de estado: {error_message_estado}")
                        else:
                            raise Exception("El formulario de estado no se cerró después de guardar.")
                else:
                    modal_estado_cerrado = True
            else:
                modal_estado_cerrado = True
        
        if not modal_estado_cerrado:
            raise Exception("No se pudo cerrar el modal de Estado Equipo")
        
        print(f"[DEBUG] Paso 2 completado: Estado Equipo desactivado exitosamente")
        print(f"Equipo desactivado correctamente para usuario: {codigo_usuario}")
        return True
        
    except Exception as e:
        print(f"Error al desactivar equipo: {e}")
        import traceback
        traceback.print_exc()
        # Intentar cerrar los modales si están abiertos
        try:
            page.get_by_role("button", name="Close").click()
        except:
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



