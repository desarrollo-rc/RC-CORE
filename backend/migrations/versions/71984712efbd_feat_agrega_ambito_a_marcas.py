"""feat: agrega ambito a marcas

Revision ID: 71984712efbd
Revises: 8c315b745e8f
Create Date: 2025-09-22 10:31:03.289292

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '71984712efbd'
down_revision = '8c315b745e8f'
branch_labels = None
depends_on = None

# Definimos el nombre del tipo y las opciones para reusarlo
ambito_enum = sa.Enum('VEHICULO', 'REPUESTO', 'MIXTO', name='ambitomarca')

def upgrade():
    # Paso 1: Crear el tipo ENUM en PostgreSQL ANTES de usarlo.
    ambito_enum.create(op.get_bind(), checkfirst=True)
    
    # Paso 2: Añadir la columna a la tabla, usando el tipo que acabamos de crear.
    with op.batch_alter_table('marcas', schema='productos') as batch_op:
        batch_op.add_column(sa.Column('ambito_marca', ambito_enum, nullable=False, server_default='MIXTO'))
        
    # Paso 3: (Buena práctica) Eliminar el default a nivel de base de datos después de la inserción.
    with op.batch_alter_table('marcas', schema='productos') as batch_op:
        batch_op.alter_column('ambito_marca', server_default=None)


def downgrade():
    # Hacemos los pasos en orden inverso para poder deshacer la migración.
    
    # Paso 1: Eliminar la columna.
    with op.batch_alter_table('marcas', schema='productos') as batch_op:
        batch_op.drop_column('ambito_marca')
            
    # Paso 2: Eliminar el tipo ENUM de la base de datos.
    ambito_enum.drop(op.get_bind(), checkfirst=True)