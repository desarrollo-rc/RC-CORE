# config.py
import os
from dotenv import load_dotenv

# Carga las variables del archivo .env que has creado
load_dotenv()

class Config:
    """
    Clase de configuración de la aplicación.
    Lee las variables de entorno para configurar la app.
    """
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'una-clave-super-secreta'

    # 1. Lee cada una de las variables de la base de datos
    DB_USER = os.environ.get('DB_USER')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_HOST = os.environ.get('DB_HOST')
    DB_PORT = os.environ.get('DB_PORT')
    DB_NAME = os.environ.get('DB_NAME')

    # 2. Construye la URI de la base de datos usando un f-string.
    #    Este es el formato que SQLAlchemy necesita para conectarse.
    SQLALCHEMY_DATABASE_URI = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Desactiva una función de SQLAlchemy que no necesitamos y que consume recursos.
    SQLALCHEMY_TRACK_MODIFICATIONS = False