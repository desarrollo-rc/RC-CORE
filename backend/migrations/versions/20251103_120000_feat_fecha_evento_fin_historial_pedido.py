"""
feat: agrega columna fecha_evento_fin a historial_estados_pedido

Revision ID: 20251103_120000
Revises: ff1079b68247
Create Date: 2025-11-03 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20251103_120000'
down_revision = 'ff1079b68247'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('historial_estados_pedido', schema='negocio') as batch_op:
        batch_op.add_column(sa.Column('fecha_evento_fin', sa.DateTime(), nullable=True, comment='Fecha de término del evento para estados con inicio/fin'))


def downgrade():
    with op.batch_alter_table('historial_estados_pedido', schema='negocio') as batch_op:
        batch_op.drop_column('fecha_evento_fin')


