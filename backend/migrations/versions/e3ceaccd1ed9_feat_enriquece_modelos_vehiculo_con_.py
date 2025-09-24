"""feat: enriquece modelos vehiculo con codigo y nuevos campos

Revision ID: e3ceaccd1ed9
Revises: 716e2cce4dd6
Create Date: 2025-09-24 14:17:26.529442

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e3ceaccd1ed9'
down_revision = '716e2cce4dd6'
branch_labels = None
depends_on = None

# --- DEFINICIÓN DE LOS NUEVOS TIPOS ENUM ---
tipotransmision_enum = sa.Enum('MANUAL', 'AUTOMATICA', 'CVT', 'DOBLE_EMBRAGUE', 'OTRO', name='tipotransmision')
tipotraccion_enum = sa.Enum('DELANTERA', 'TRASERA', 'TOTAL_4X4', 'INTEGRAL_AWD', name='tipotraccion')
tipocombustible_enum = sa.Enum('GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO', 'GLP', 'GNV', name='tipocombustible')
# --------------------------------------------

def upgrade():
    # Paso 1: Crear los tipos ENUM en la base de datos ANTES de usarlos.
    tipotransmision_enum.create(op.get_bind(), checkfirst=True)
    tipotraccion_enum.create(op.get_bind(), checkfirst=True)
    tipocombustible_enum.create(op.get_bind(), checkfirst=True)

    # Paso 2: Ahora sí, alterar las tablas.
    with op.batch_alter_table('modelos', schema='productos') as batch_op:
        batch_op.add_column(sa.Column('codigo_modelo', sa.String(length=10), nullable=True)) # Permitir nulos temporalmente
        batch_op.create_unique_constraint('uq_codigo_modelo', ['codigo_modelo'])

    # Opcional: Si tienes datos, actualízalos para que no sean nulos antes de poner nullable=False
    # op.execute("UPDATE productos.modelos SET codigo_modelo = 'TEMP-' || id_modelo WHERE codigo_modelo IS NULL")

    with op.batch_alter_table('modelos', schema='productos') as batch_op:
        batch_op.alter_column('codigo_modelo', nullable=False) # Ahora sí, lo hacemos no nulo


    with op.batch_alter_table('versiones_vehiculo', schema='productos') as batch_op:
        batch_op.add_column(sa.Column('transmision', tipotransmision_enum, nullable=True))
        batch_op.add_column(sa.Column('traccion', tipotraccion_enum, nullable=True))
        batch_op.add_column(sa.Column('combustible', tipocombustible_enum, nullable=True))
        batch_op.alter_column('cilindrada', existing_type=sa.INTEGER(), nullable=True)


def downgrade():
    # Ejecutamos en orden inverso.
    
    # Paso 1: Alterar las tablas para remover las columnas.
    with op.batch_alter_table('versiones_vehiculo', schema='productos') as batch_op:
        batch_op.alter_column('cilindrada', existing_type=sa.INTEGER(), nullable=False)
        batch_op.drop_column('combustible')
        batch_op.drop_column('traccion')
        batch_op.drop_column('transmision')

    with op.batch_alter_table('modelos', schema='productos') as batch_op:
        batch_op.drop_constraint('uq_codigo_modelo', type_='unique')
        batch_op.drop_column('codigo_modelo')
    
    # Paso 2: Eliminar los tipos ENUM de la base de datos.
    tipocombustible_enum.drop(op.get_bind(), checkfirst=True)
    tipotraccion_enum.drop(op.get_bind(), checkfirst=True)
    tipotransmision_enum.drop(op.get_bind(), checkfirst=True)