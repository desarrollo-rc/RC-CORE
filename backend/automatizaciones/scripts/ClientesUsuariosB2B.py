import re
import csv
from pathlib import Path
from playwright.sync_api import Playwright, sync_playwright


USUARIO_OMS = "cechevarria"
PASSWORD_OMS = "464$$.bGh545"
URL_LOGIN = "https://oms.repuestoscenter.cl/Usuarios/Acceso"

# Ruta donde se guardará el CSV
OUTPUT_CSV = Path(__file__).with_name("clientes_usuarios_b2b.csv")


def login_oms(page):
    page.goto(URL_LOGIN)
    page.get_by_role("textbox", name=re.compile("Usuario", re.I)).fill(USUARIO_OMS)
    page.get_by_role("textbox", name=re.compile("Contraseña", re.I)).fill(PASSWORD_OMS)
    page.get_by_role("button", name=re.compile("Ingresar", re.I)).click()
    page.wait_for_load_state("networkidle")


def navegar_a_clientes_b2b(page):
    # Abrir menú lateral si aplica
    page.locator("#kt_aside_desktop_toggle").click()
    page.get_by_role("link", name=re.compile("Socios Negocio", re.I)).click()
    page.get_by_role("link", name=re.compile("Clientes B2B", re.I)).click()

    # Esperar a que cargue la tabla de clientes B2B
    page.wait_for_selector("#tablaBuscarClientes tbody tr")


def extraer_usuarios_cliente(page, info_cliente):
    """
    Estando en el detalle del cliente, entrar a pestaña Usuarios y extraer
    todos los usuarios de la tabla.
    """
    resultados = []

    print(
        f"\n=== Entrando a pestaña Usuarios para cliente "
        f"{info_cliente['rut_cliente']} - {info_cliente['nombre_cliente']} ==="
    )

    # Ir a pestaña Usuarios (evitar ambigüedad con "Usuarios X Canal")
    page.get_by_role("link", name=" Usuarios").click()
    page.wait_for_selector("#tablaUsuarios tbody tr")
    print("Tabla de usuarios cargada")

    pagina_usuarios = 1

    while True:
        filas_usuarios = page.locator("#tablaUsuarios tbody tr")
        n_usuarios = filas_usuarios.count()
        print(f"Usuarios encontrados en esta página: {n_usuarios}")

        for i in range(n_usuarios):
            fila = filas_usuarios.nth(i)
            celdas = fila.locator("td")
            # Ajusta los índices si en la tabla el orden es distinto
            username = celdas.nth(0).inner_text().strip()
            nombre_usuario = celdas.nth(1).inner_text().strip()
            fecha_mod = celdas.nth(2).inner_text().strip()

            # Estado (activo/inactivo) puede venir como texto o como label
            estado_texto = ""
            try:
                estado_texto = celdas.nth(3).inner_text().strip()
            except Exception:
                # En algunos casos puede estar dentro de un span.label
                try:
                    estado_texto = celdas.nth(3).locator("span").inner_text().strip()
                except Exception:
                    estado_texto = ""

            # Mezclamos info del cliente con la del usuario
            registro = {
                **info_cliente,
                "username": username,
                "nombre_usuario": nombre_usuario,
                "fecha_ultima_modificacion": fecha_mod,
                "estado_usuario": estado_texto,
            }

            print(f"  Usuario extraído: {registro}")

            resultados.append(registro)

        # Paginación de usuarios (si existe) usando los números de página.
        # DataTables arma algo como:
        # <ul class="pagination">
        #   <li class="paginate_button page-item active">
        #     <a aria-controls="tablaUsuarios" class="page-link">1</a>
        #   ...
        siguiente_pagina = pagina_usuarios + 1
        selector_paginacion = f"ul.pagination a[aria-controls='tablaUsuarios']"
        next_link = page.locator(selector_paginacion).filter(has_text=str(siguiente_pagina))

        if next_link.count() == 0:
            print("No hay más páginas de usuarios, terminando.")
            break

        print(f"Pasando a la página {siguiente_pagina} de usuarios…")
        next_link.first.click()
        page.wait_for_timeout(500)
        pagina_usuarios = siguiente_pagina

    # Cerrar el modal de usuarios para volver a la pantalla del cliente
    try:
        print("Cerrando modal de usuarios…")
        page.locator("button.close[data-dismiss='modal']").click()
        page.wait_for_timeout(300)
    except Exception as e:
        print(f"No se pudo cerrar el modal de usuarios (puede que ya esté cerrado): {e}")

    return resultados


def extraer_todos_clientes_y_usuarios(page):
    """
    Estando en la pantalla de Clientes B2B, recorrer todas las páginas
    y, por cada cliente, ir al detalle → Usuarios y extraer datos.
    """
    resultados = []

    # Control de página actual del listado de clientes
    pagina_clientes = 1

    while True:
        # Esperar filas de la página actual
        page.wait_for_selector("#tablaBuscarClientes tbody tr")
        filas_clientes = page.locator("#tablaBuscarClientes tbody tr")
        n_clientes = filas_clientes.count()

        for i in range(n_clientes):
            fila = filas_clientes.nth(i)
            celdas = fila.locator("td")

            # Ajusta los índices según tu tabla:
            #   - La primera celda está vacía
            #   - La segunda celda contiene el RUT
            #   - La tercera celda contiene el nombre del cliente
            #   - A partir de ahí: condición de pago, línea de crédito, montos, estado, qty usuarios, etc.
            rut_cliente = celdas.nth(1).inner_text().strip()
            nombre_cliente = celdas.nth(2).inner_text().strip()
            condicion_pago = celdas.nth(3).inner_text().strip()
            linea_credito = celdas.nth(4).inner_text().strip()
            compras_mes_pasado_b2b = celdas.nth(5).inner_text().strip()
            compras_mes_pasado_total = celdas.nth(6).inner_text().strip()
            compras_mes_actual_b2b = celdas.nth(7).inner_text().strip()
            compras_mes_actual_total = celdas.nth(8).inner_text().strip()
            estado_cliente = celdas.nth(9).inner_text().strip()
            qty_usuarios_tabla = celdas.nth(10).inner_text().strip()

            info_cliente = {
                "rut_cliente": rut_cliente,
                "nombre_cliente": nombre_cliente,
                "condicion_pago": condicion_pago,
                "linea_credito": linea_credito,
                "compras_mes_pasado_b2b": compras_mes_pasado_b2b,
                "compras_mes_pasado_total": compras_mes_pasado_total,
                "compras_mes_actual_b2b": compras_mes_actual_b2b,
                "compras_mes_actual_total": compras_mes_actual_total,
                "estado_cliente": estado_cliente,
                "qty_usuarios_tabla": qty_usuarios_tabla,
            }

            print(
                f"\n=== Procesando cliente {i+1}/{n_clientes} (página {pagina_clientes}): "
                f"{rut_cliente} - {nombre_cliente} ==="
            )
            print(f"  Info cliente: {info_cliente}")

            # Abrir el detalle/usuarios del cliente (abre modal o sección en la misma página)
            link_detalle = fila.locator("a").first
            print("  Haciendo clic en el detalle del cliente…")
            link_detalle.click()

            # Si es necesario, espera a que aparezca la opción de Usuarios
            page.wait_for_load_state("networkidle")

            # Extraer usuarios de este cliente
            usuarios_cliente = extraer_usuarios_cliente(page, info_cliente)
            print(f"Total usuarios extraídos para cliente {rut_cliente}: {len(usuarios_cliente)}")
            resultados.extend(usuarios_cliente)
            # Al cerrar el modal de usuarios seguimos en la misma página de Clientes B2B,
            # por lo que no hace falta hacer ningún refresh ni navegación extra.

        # Paginación de clientes B2B usando los números de página
        siguiente_pagina = pagina_clientes + 1
        selector_paginacion_clientes = "ul.pagination a[aria-controls='tablaBuscarClientes']"
        next_link_clientes = page.locator(selector_paginacion_clientes).filter(has_text=str(siguiente_pagina))

        if next_link_clientes.count() == 0:
            print("No hay más páginas de clientes B2B, terminando.")
            break

        print(f"Pasando a la página {siguiente_pagina} de clientes B2B…")
        next_link_clientes.first.click()
        page.wait_for_timeout(800)
        pagina_clientes = siguiente_pagina

    return resultados


def guardar_csv(datos):
    cabeceras = [
        "rut_cliente",
        "nombre_cliente",
        "condicion_pago",
        "linea_credito",
        "compras_mes_pasado_b2b",
        "compras_mes_pasado_total",
        "compras_mes_actual_b2b",
        "compras_mes_actual_total",
        "estado_cliente",
        "qty_usuarios_tabla",
        "username",
        "nombre_usuario",
        "fecha_ultima_modificacion",
        "estado_usuario",
    ]

    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=cabeceras)
        writer.writeheader()
        for fila in datos:
            writer.writerow(fila)

    print(f"Se guardó el CSV con {len(datos)} registros en: {OUTPUT_CSV}")


def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=False)
    context = browser.new_context()
    page = context.new_page()

    login_oms(page)
    navegar_a_clientes_b2b(page)

    datos = extraer_todos_clientes_y_usuarios(page)
    guardar_csv(datos)

    context.close()
    browser.close()


if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)