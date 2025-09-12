# backend/app/models/productos/__init__.py
from .aplicaciones import Aplicacion
from .marcas import Marca
from .modelos import Modelo, VersionVehiculo
from .origenes import Origen
from .fabricas import Fabrica
from .codigos import CodigoReferencia
from .calidades import Calidad
from .maestro_productos import MaestroProductos
from .categorias import Categoria, SubCategoria

__all__ = [
    "Aplicacion",
    "Marca",
    "Modelo",
    "VersionVehiculo",
    "Origen",
    "Fabrica",
    "CodigoReferencia",
    "Calidad",
    "Categoria",
    "SubCategoria",
    "MaestroProductos",
]