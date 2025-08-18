# backend/app/models/negocio/__init__.py
from .canales import CanalVenta
from .tipo_regla import TipoRegla
from .reglas import MotorReglasComerciales

__all__ = [
    "CanalVenta",
    "TipoRegla",
    "MotorReglasComerciales",
]