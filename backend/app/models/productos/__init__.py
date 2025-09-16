# backend/app/models/productos/__init__.py
from .aplicaciones import Aplicacion
from .marcas import Marca
from .modelos import Modelo, VersionVehiculo
from .origenes import Origen
from .fabricas import Fabrica
from .codigos import CodigoReferencia, CodigoTecnico
from .caracteristicas import Atributo, Medida, AtributoAsignado, MedidaAsignada
from .calidades import Calidad
from .maestro_productos import MaestroProductos
from .categorias import Division,Categoria, SubCategoria, DetSubCategoria

__all__ = [
    "Aplicacion",
    "Marca",
    "Modelo",
    "VersionVehiculo",
    "Origen",
    "Fabrica",
    "CodigoReferencia",
    "CodigoTecnico",
    "Atributo",
    "Medida",
    "AtributoAsignado",
    "MedidaAsignada",
    "Calidad",
    "Categoria",
    "SubCategoria",
    "DetSubCategoria",
    "Division",
    "MaestroProductos",
]