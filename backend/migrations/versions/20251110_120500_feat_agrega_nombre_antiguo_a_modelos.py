"""
feat: agrega columna nombre_antiguo a modelos

Revision ID: 20251110_120500
Revises: 20251103_120000
Create Date: 2025-11-10 12:05:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251110_120500'
down_revision = '20251103_120000'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('modelos', schema='productos') as batch_op:
        batch_op.add_column(sa.Column('nombre_antiguo', sa.String(length=100), nullable=True, comment='Nombre original del modelo previo al proceso de normalización.'))


def downgrade():
    with op.batch_alter_table('modelos', schema='productos') as batch_op:
        batch_op.drop_column('nombre_antiguo')

