from playwright.sync_api import sync_playwright, Page


def login_corp(page: Page) -> None:
    page.goto("https://corp.repuestoscenter.cl/")
    page.get_by_role("textbox", name="Usuario").click()
    page.get_by_role("textbox", name="Usuario").fill("cechevarria")
    page.get_by_role("textbox", name="Contraseña").click()
    page.get_by_role("textbox", name="Contraseña").fill("464$$.bGh545")
    page.get_by_role("button", name="Ingresar").click()
    # Wait for post-login navigation and network to settle, so subsequent gotos don't get aborted
    page.wait_for_load_state("networkidle")


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        login_corp(page)

