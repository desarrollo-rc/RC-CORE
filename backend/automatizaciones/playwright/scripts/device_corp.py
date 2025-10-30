from playwright.sync_api import sync_playwright, Page
import re
from navegation_corp import go_to_equipos


def activar_equipo(page: Page, codigo_usuario: str, imei: str) -> None:
    """Activa un equipo para el usuario dado (flujo a implementar)."""
    go_to_equipos(page)
    page.screenshot(path="equipos_activar_pendiente.png")


def desactivar_equipo(page: Page, codigo_usuario: str, imei: str) -> None:
    """Desactiva un equipo del usuario (flujo a implementar)."""
    go_to_equipos(page)
    page.screenshot(path="equipos_desactivar_pendiente.png")


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

        # Ejemplos de invocación iniciales (no ejecutan acciones reales aún)
        # activar_equipo(page, codigo_usuario="demo_user")
        # desactivar_equipo(page, codigo_usuario="demo_user")
        # cambiar_equipo(page, codigo_usuario="demo_user")
        buscar_equipos(page, codigo_usuario="gpacifico1")

        context.close()
        browser.close()


