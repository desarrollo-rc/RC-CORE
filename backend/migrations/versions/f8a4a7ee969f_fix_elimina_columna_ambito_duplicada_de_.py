"""fix: elimina columna ambito duplicada de marcas

Revision ID: f8a4a7ee969f
Revises: 71984712efbd
Create Date: 2025-09-22 10:35:03.706369

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'f8a4a7ee969f'
down_revision = '71984712efbd'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('marcas', schema='productos') as batch_op:
        batch_op.drop_column('ambito') # La columna que queremos eliminar


def downgrade():
    with op.batch_alter_table('marcas', schema='productos') as batch_op:
        batch_op.add_column(sa.Column('ambito', postgresql.ENUM('VEHICULO', 'REPUESTO', 'MIXTO', name='ambitomarca'), autoincrement=False, nullable=True))

