from playwright.sync_api import sync_playwright, Page
from login_corp import login_corp


def go_to_usuarios(page: Page) -> None:
    """Login first, then navigate to Usuarios Canal Corp module."""
    login_corp(page)
    page.wait_for_load_state("networkidle")
    _goto_with_retry(page, "https://corp.repuestoscenter.cl/Seguridad/UsuariosCanalCorp")


def go_to_equipos(page: Page) -> None:
    """Login first, then navigate to Equipos module."""
    login_corp(page)
    page.wait_for_load_state("networkidle")
    _goto_with_retry(page, "https://corp.repuestoscenter.cl/Seguridad/Equipos")


def _goto_with_retry(page: Page, url: str) -> None:
    """Navigate to URL and retry once if the first attempt is aborted by a concurrent navigation."""
    # Small stabilization before first attempt to avoid collisions with post-login redirects
    page.wait_for_timeout(100)
    try:
        page.goto(url, wait_until="networkidle")
    except Exception:
        # Wait for any pending redirects to finish, then retry once
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(200)
        page.goto(url, wait_until="networkidle")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        # go_to_usuarios(page)
        go_to_equipos(page)

