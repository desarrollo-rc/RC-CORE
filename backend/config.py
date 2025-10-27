# config.py
import os
from dotenv import load_dotenv
from datetime import timedelta

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
    
    # Configuración de pool de conexiones para mejorar la estabilidad
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Verificar conexiones antes de usarlas
        'pool_recycle': 3600,   # Reciclar conexiones cada hora
        'pool_timeout': 30,     # Timeout para obtener conexión del pool
        'max_overflow': 10,     # Conexiones adicionales permitidas
        'pool_size': 5          # Tamaño base del pool
    }

    SQLALCHEMY_BINDS = {
        'omsrc': os.environ.get('OMSRC_DATABASE_URL') or 'mssql+pyodbc://federico.lorca:34NMyU$.32gH@omsrc.eastus.cloudapp.azure.com:1433/rcenter?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=yes&Connection+Timeout=30&Command+Timeout=60&Login+Timeout=30'
    }

    # Clave para firma de JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'una-clave-super-secreta'

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)

    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    
    META_ACCESS_TOKEN = 'EAASYg4iFdc0BPnZB3xH513YhZA6Lfx2GPUU99bQ7PJb6Y1JT8RCdNMVvd7hN2xST0IrZCtGDilj5l5A37EWJiSNUhMrOvYQgM9rS2L3cZBVHC7Yt7zzgzAVCaUPZCONhIbO4p1LZANPOIeALzXvCDCcF8IKz4rNi3FOjesQHXYFFcNpWZBDAkEl3YUZBoLuk6AZDZD'
    META_WHATSAPP_ACCOUNT_ID = '1809130203024365' # Lo encuentras en el panel de la App
    META_PHONE_NUMBER_ID = '756733997534128' # También en el panel