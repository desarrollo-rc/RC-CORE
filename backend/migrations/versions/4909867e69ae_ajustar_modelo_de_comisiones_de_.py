"""Ajustar modelo de comisiones de Vendedor a Meta

Revision ID: 4909867e69ae
Revises: 582438abb8b7
Create Date: 2025-08-20 15:07:15.269559

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '4909867e69ae'
down_revision = '582438abb8b7'
branch_labels = None
depends_on = None


def upgrade():
    # ### Comandos manuales para el ajuste de comisiones ###
    with op.batch_alter_table('metas', schema='negocio') as batch_op:
        batch_op.add_column(sa.Column('monto_comision', sa.Numeric(precision=10, scale=2), nullable=False, server_default=sa.text('0.0')))

    with op.batch_alter_table('vendedores', schema='negocio') as batch_op:
        batch_op.drop_column('porcentaje_comision')

    # ### Fin de los comandos ###


def downgrade():
    # ### Comandos para revertir los cambios ###
    with op.batch_alter_table('vendedores', schema='negocio') as batch_op:
        batch_op.add_column(sa.Column('porcentaje_comision', sa.NUMERIC(precision=5, scale=2), autoincrement=False, nullable=False, server_default=sa.text('0.0')))

    with op.batch_alter_table('metas', schema='negocio') as batch_op:
        batch_op.drop_column('monto_comision')