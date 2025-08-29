# backend/app/models/__init__.py

# Importar todos los modelos de cada subpaquete para que SQLAlchemy los reconozca
from .entidades import *
from .negocio import *
from .analitica import *
from .soporte import *

# El __all__ es una buena práctica para definir la API pública del módulo
__all__ = entidades.__all__ + negocio.__all__ + analitica.__all__ + soporte.__all__