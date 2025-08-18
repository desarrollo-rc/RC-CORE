# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# Crea las instancias de las extensiones sin asociarlas a una app todavía
db = SQLAlchemy()
migrate = Migrate()