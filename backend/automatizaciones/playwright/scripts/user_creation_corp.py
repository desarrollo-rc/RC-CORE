import os
from time import perf_counter
from playwright.sync_api import sync_playwright, Page
from navegation_corp import go_to_usuarios
 


def crear_usuario(page: Page, codigo: str, nombre: str, contrasena: str, submit: bool = False) -> None:
    """Crea un usuario en el módulo de Usuarios (sin guardar por defecto)."""
    # Ir al módulo de Usuarios (incluye login)
    go_to_usuarios(page)

    # Abrir formulario de nuevo usuario
    page.get_by_role("link", name="Nuevo").click()

    # Completar campos
    page.get_by_role("textbox", name="Código").click()
    page.get_by_role("textbox", name="Código").fill(codigo)
    page.get_by_role("textbox", name="Código").press("Tab")

    page.get_by_role("textbox", name="Nombre").fill(nombre)
    page.get_by_role("textbox", name="Nombre").press("Tab")

    page.locator("input[name=\"contrasena\"]").fill(contrasena)
    page.locator("input[name=\"contrasena\"]").press("Tab")
    page.locator("input[name=\"reContrasena\"]").fill(contrasena)

    page.screenshot(path="user_creation_corp.png")
    # Por ahora NO guardamos para evitar crear usuarios reales
    if submit:
        page.get_by_role("button", name="Guardar").click()


def buscar_y_abrir_usuario(page: Page, codigo_usuario: str, nombre_usuario: str) -> None:
    """Busca en la tabla y abre el detalle del usuario cuyo código y nombre coinciden."""
    go_to_usuarios(page)

    page.get_by_role("textbox", name="Buscar Usuarios Canal").click()
    page.get_by_role("textbox", name="Buscar Usuarios Canal").fill(codigo_usuario)
    page.get_by_role("button", name="Buscar").click()
    # Espera robusta a que el modal de resultados se abra; reintenta con Enter si es necesario
    try:
        page.wait_for_selector("#modalResBuscarAgrupacionesUsuarios.show", timeout=7000)
    except Exception:
        try:
            page.get_by_role("textbox", name="Buscar Usuarios Canal").press("Enter")
            page.wait_for_selector("#modalResBuscarAgrupacionesUsuarios.show", timeout=7000)
        except Exception:
            print("No se abrió el modal de resultados")
            return

    # Trabajar dentro del modal de resultados explícitamente
    modal = page.locator("#modalResBuscarAgrupacionesUsuarios")
    modal.wait_for(state="visible")
    rows = modal.locator("#tablaBuscarAgrupaciones tbody tr")
    try:
        rows.first.wait_for(state="visible", timeout=5000)
    except Exception:
        print("El modal abrió pero no hay filas de resultado")
        return
    count = rows.count()
    match_row_index = None
    for i in range(count):
        row = rows.nth(i)
        # Extrae columnas: 0=acción, 1=usuario, 2=nombre
        tds = row.locator("td")
        # Seguridad por si faltan columnas
        if tds.count() < 3:
            continue

        user_text = tds.nth(1).inner_text().strip()
        name_text = tds.nth(2).inner_text().strip()
        # No imprimir por rendimiento

        if match_row_index is None and user_text == codigo_usuario and name_text == nombre_usuario:
            match_row_index = i
    if match_row_index is None:
        print(f"Sin resultados para: {codigo_usuario} / {nombre_usuario}")
        return
    # Mantiene el modal abierto y hace clic en la acción de la primera columna del primer match
    row_to_click = rows.nth(match_row_index)
    # Click forzado dentro del modal para evitar cualquier intercepción (dos veces para asegurar)
    action_btn = row_to_click.locator("td").first.locator("a.btn, a, button, .btn").first
    action_btn.click(force=True)
    page.wait_for_timeout(1000)
    action_btn.click(force=True)

def asignar_canal_b2b(page: Page, codigo_usuario: str | None = None, nombre_usuario: str | None = None, rut: str | None = None, email: str | None = None) -> None:
    """Asigna canal B2B al usuario. Si no está en el detalle, puede buscarlo primero.

    - Si ya estás en el detalle (visible #txtCodigoUsuario), continúa.
    - Si no, y se proveen codigo_usuario y nombre_usuario, abre el detalle con buscar_y_abrir_usuario.
    """
    try:
        en_detalle = page.locator("#txtCodigoUsuario").is_visible()
        
    except Exception:
        en_detalle = False

    if not en_detalle:
        if codigo_usuario and nombre_usuario:
            buscar_y_abrir_usuario(page, codigo_usuario=codigo_usuario, nombre_usuario=nombre_usuario)
        else:
            raise ValueError("No estás en el detalle y no se entregaron parametros de búsqueda")

    # Intentar presionar botón "Agregar" en el detalle
    try:
        agregar_btn = page.locator('a[onclick="VerInsertarUsuarios()"]')
        if agregar_btn.first.is_visible():
            agregar_btn.first.click()
            page.wait_for_timeout(300)
    except Exception:
        pass

    # TODO: Completar los pasos de asignación de canal cuando definamos los selectores/flujo exactos
    # Abrir formulario Agregar
    try:
        page.get_by_role("link", name=" Agregar").click()
    except Exception:
        page.locator('a[onclick="VerInsertarUsuarios()"]').first.click()

    # Trabajar estrictamente dentro del modal de inserción (el modal visible más reciente)
    insert_modal = page.locator("#formInsertarUsuario")
    insert_modal.wait_for(state="visible")
    print("[canal_b2b] Modal visible")

    # 1) Canal Venta (Select2): abrir y seleccionar "Web B2B"
    insert_modal.locator('#select2-ddlInsertarCanalVenta-container').scroll_into_view_if_needed()
    insert_modal.locator('#select2-ddlInsertarCanalVenta-container').click()
    # Preferir el contenedor de resultados específico del select: #select2-ddlInsertarCanalVenta-results
    try:
        results_ul = page.locator('#select2-ddlInsertarCanalVenta-results')
        results_ul.wait_for(state='visible')
        option_web_b2b = results_ul.locator('li.select2-results__option', has_text='Web B2B').first
        option_web_b2b.wait_for(state='visible')
        option_web_b2b.click()
    except Exception:
        # Fallback a contenedor abierto más cercano
        container_open = page.locator('.select2-container--open').last
        option_web_b2b = container_open.locator('.select2-results__option', has_text='Web B2B').first
        option_web_b2b.wait_for(state='visible')
        option_web_b2b.click()
    # Confirm selection set on container text
    page.wait_for_function("document.getElementById('select2-ddlInsertarCanalVenta-container').textContent.includes('Web B2B')")

    # 2) Cliente (Select2): buscar por RUT y seleccionar primer match por número base
    insert_modal.locator('#select2-ddlInsertarCliente-container').scroll_into_view_if_needed()
    insert_modal.locator('#select2-ddlInsertarCliente-container').click()
    # Esperar dropdown de resultados específico del select de cliente
    try:
        cliente_results = page.locator('#select2-ddlInsertarCliente-results')
        cliente_results.wait_for(state='visible')
    except Exception:
        page.locator('.select2-container--open').last.wait_for(state='visible')
    # Campo de búsqueda de Select2
    searchbox = page.locator('input.select2-search__field').last
    searchbox.wait_for(state="visible")
    searchbox.fill(rut)
    base_rut = rut.split('-')[0]
    # Seleccionar opción que contenga el RUT base (o el texto completo si aparece así)
    opcion_cliente = page.locator('.select2-container--open .select2-results__option', has_text=base_rut).first
    opcion_cliente.wait_for(state='visible')
    opcion_cliente.click()
    # Esperar hidden idCliente distinto de vacío
    page.wait_for_function("document.getElementById('hfInsertarIDCliente').value !== ''")

    # 3) Dirección (Select2): abrir y elegir "BRISAS DEL MAIPO" (tras poblar por AJAX)
    insert_modal.locator('#select2-ddlInsertarDireccion-container').scroll_into_view_if_needed()
    insert_modal.locator('#select2-ddlInsertarDireccion-container').click()
    try:
        dir_results = page.locator('#select2-ddlInsertarDireccion-results')
        dir_results.wait_for(state='visible')
        option_dir = dir_results.locator('li.select2-results__option', has_text="BRISAS DEL MAIPO").first
        if not option_dir.is_visible():
            option_dir = dir_results.locator('li.select2-results__option').nth(1)
    except Exception:
        container_open = page.locator('.select2-container--open').last
        option_dir = container_open.locator('.select2-results__option', has_text='BRISAS DEL MAIPO').first
        if not option_dir.is_visible():
            option_dir = container_open.locator('.select2-results__option').nth(1)
    option_dir.wait_for(state='visible')
    option_dir.click()
    # Esperar hidden idDireccion != '0'
    page.wait_for_function("document.getElementById('hfInsertarIDDireccion').value !== '0'")

    # 4) Usuario Canal (Select2): abrir y elegir "-- NO ESTÁ EN LA LISTA --"
    insert_modal.locator('#select2-ddlInsertarUsuarioCanal-container').scroll_into_view_if_needed()
    insert_modal.locator('#select2-ddlInsertarUsuarioCanal-container').click()
    try:
        uc_results = page.locator('#select2-ddlInsertarUsuarioCanal-results')
        uc_results.wait_for(state='visible')
        option_no_lista = uc_results.locator('li.select2-results__option', has_text="-- NO ESTÁ EN LA LISTA --").first
    except Exception:
        container_open = page.locator('.select2-container--open').last
        option_no_lista = container_open.locator('.select2-results__option', has_text='-- NO ESTÁ EN LA LISTA --').first
    option_no_lista.wait_for(state="visible")
    option_no_lista.click()

    # 5) Email: se habilita cuando se selecciona "-1" (NO ESTÁ EN LA LISTA)
    email_input = insert_modal.locator('#txtInsertarEmail')
    # Esperar que deje de ser readonly
    page.wait_for_function("!document.getElementById('txtInsertarEmail').hasAttribute('readonly')")
    email_input.fill(email)
    print("[canal_b2b] Email seteado")

    # Guardar asignación
    try:
        print("[canal_b2b] Click en Guardar asignación")
        insert_modal.locator('#btnInsertarUsuario').scroll_into_view_if_needed()
        insert_modal.locator('#btnInsertarUsuario').click()
        # Espera a que el modal se cierre
        page.locator('#formInsertarUsuario').wait_for(state='hidden', timeout=15000)
        print("[canal_b2b] Modal cerrado tras guardar")
    except Exception as e:
        print("[canal_b2b] Error al guardar:", e)


if __name__ == "__main__":
    # Prueba manual rápida: no guarda
    with sync_playwright() as p:
        headless = os.environ.get("HEADLESS", "0").lower() in ("1", "true", "yes")
        t0 = perf_counter()
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context()
        page = context.new_page()

        # crear_usuario(page, codigo="test_user_002", nombre="test_user_002", contrasena="test1", submit=True)
        # buscar_y_abrir_usuario(page, codigo_usuario="cecheverria", nombre_usuario="cristian echeverria")
        asignar_canal_b2b(page, codigo_usuario="test_user_002", nombre_usuario="Usuario de Prueba Async", rut="77337586-0", email="ejemplo@gmail.com")

        context.close()
        browser.close()
        dt = perf_counter() - t0
        print(f"Headless={headless} duration={dt:.2f}s")


