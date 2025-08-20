# backend/app/models/negocio/__init__.py
from .canales import CanalVenta
from .tipo_regla import TipoRegla
from .reglas import MotorReglasComerciales
from .vendedores import Vendedor
from .metas import Meta, TipoMeta

__all__ = [
    "CanalVenta",
    "TipoRegla",
    "MotorReglasComerciales",
    "Vendedor",
    "Meta",
    "TipoMeta",
]