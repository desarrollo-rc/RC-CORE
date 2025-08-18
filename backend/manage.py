# backend/manage.py
import click
from flask.cli import with_appcontext
from app import create_app, db
from app.models.entidades.usuarios import Usuario
from app.models.entidades.areas import Area

app = create_app()

@app.cli.command("create-user")
@click.argument("nombre_completo")
@click.argument("email")
@click.argument("password")
@click.argument("codigo_area")
def create_user(nombre_completo, email, password, codigo_area):
    """
    Crea un nuevo usuario interno en el sistema.
    """
    # 1. Validar que el área exista
    area = Area.query.filter_by(codigo_area=codigo_area.upper()).first()
    if not area:
        print(f"Error: El área con código '{codigo_area}' no existe. Por favor, créala primero.")
        return

    # 2. Validar que el email no esté en uso
    if Usuario.query.filter_by(email=email).first():
        print(f"Error: El email '{email}' ya está registrado.")
        return
    
    # 3. Crear el usuario
    new_user = Usuario(
        nombre_completo=nombre_completo,
        email=email,
        id_area=area.id_area
    )
    new_user.set_password(password) # ¡Importante! Esto hashea la contraseña
    
    db.session.add(new_user)
    db.session.commit()
    
    print(f"¡Usuario '{nombre_completo}' creado exitosamente en el área de '{area.nombre_area}'!")

@app.cli.command("create-area")
@click.argument("codigo")
@click.argument("nombre")
def create_area(codigo, nombre):
    """
    Crea una nueva área de negocio.
    """
    if Area.query.filter_by(codigo_area=codigo.upper()).first():
        print(f"Error: El área con código '{codigo}' ya existe.")
        return
        
    new_area = Area(codigo_area=codigo, nombre_area=nombre)
    db.session.add(new_area)
    db.session.commit()
    print(f"¡Área '{nombre}' con código '{codigo.upper()}' creada exitosamente!")