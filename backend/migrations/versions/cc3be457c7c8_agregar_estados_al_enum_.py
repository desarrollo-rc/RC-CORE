"""Agregar estados al enum EstadoInstalacion

Revision ID: cc3be457c7c8
Revises: 7e54c79513d1
Create Date: 2025-10-08 14:32:20.185936

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cc3be457c7c8'
down_revision = '7e54c79513d1'
branch_labels = None
depends_on = None


def upgrade():
    # Agregar nuevos valores al enum estadoinstalacion
    op.execute("ALTER TYPE estadoinstalacion ADD VALUE IF NOT EXISTS 'Usuario Creado'")
    op.execute("ALTER TYPE estadoinstalacion ADD VALUE IF NOT EXISTS 'Configuración Pendiente'")


def downgrade():
    # No se puede eliminar valores de un enum en PostgreSQL sin recrearlo
    pass
