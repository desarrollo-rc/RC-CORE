"""feat: Eliminar restricción unique del email en usuarios_b2b

Revision ID: 20251013_112324
Revises: 20251013_101435
Create Date: 2025-10-13 11:23:24.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251013_112324'
down_revision = '20251013_101435'
branch_labels = None
depends_on = None


def upgrade():
    # Eliminar el índice único del email
    op.drop_index('ix_entidades_usuarios_b2b_email', table_name='usuarios_b2b', schema='entidades')
    
    # Crear un índice normal (no único) para el email
    op.create_index('ix_entidades_usuarios_b2b_email', 'usuarios_b2b', ['email'], schema='entidades')


def downgrade():
    # Eliminar el índice normal
    op.drop_index('ix_entidades_usuarios_b2b_email', table_name='usuarios_b2b', schema='entidades')
    
    # Recrear el índice único
    op.create_index('ix_entidades_usuarios_b2b_email', 'usuarios_b2b', ['email'], unique=True, schema='entidades')
