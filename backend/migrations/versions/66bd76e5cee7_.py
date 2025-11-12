"""
merge heads: sincroniza ramas paralelas de migraciones

Revision ID: 66bd76e5cee7
Revises: 9e05fe9941a8, 20251110_120500
Create Date: 2025-11-10 10:12:54.755261
"""

# Este merge no introduce cambios de esquema. Solo unifica las ramas.

from alembic import op  # noqa: F401
import sqlalchemy as sa  # noqa: F401


# revision identifiers, used by Alembic.
revision = '66bd76e5cee7'
down_revision = ('9e05fe9941a8', '20251110_120500')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
