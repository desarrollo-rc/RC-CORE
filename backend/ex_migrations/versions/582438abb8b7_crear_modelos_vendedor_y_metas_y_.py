"""Crear modelos Vendedor y Metas y refactorizar relacion con Clientes

Revision ID: 582438abb8b7
Revises: ae180a351622
Create Date: 2025-08-20 11:21:27.429004

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '582438abb8b7'
down_revision = 'ae180a351622'
branch_labels = None
depends_on = None


def upgrade():
    # ### Comandos generados por nosotros para ajustar la migración ###

    # 1. Crear las nuevas tablas del modelo de negocio
    op.create_table('vendedores',
    sa.Column('id_vendedor', sa.Integer(), nullable=False),
    sa.Column('codigo_vendedor_sap', sa.String(length=50), nullable=True),
    sa.Column('porcentaje_comision', sa.Numeric(precision=5, scale=2), nullable=False),
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['id_usuario'], ['entidades.usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_vendedor'),
    sa.UniqueConstraint('codigo_vendedor_sap'),
    sa.UniqueConstraint('id_usuario'),
    schema='negocio'
    )
    op.create_table('tipos_metas',
    sa.Column('id_tipo_meta', sa.Integer(), nullable=False),
    sa.Column('codigo_meta', sa.String(length=50), nullable=False),
    sa.Column('nombre_meta', sa.String(length=150), nullable=False),
    sa.Column('descripcion', sa.String(length=255), nullable=True),
    sa.Column('unidad_medida', sa.String(length=50), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False),
    sa.PrimaryKeyConstraint('id_tipo_meta'),
    sa.UniqueConstraint('codigo_meta'),
    schema='negocio'
    )
    op.create_table('metas',
    sa.Column('id_meta', sa.Integer(), nullable=False),
    sa.Column('periodo_anio', sa.Integer(), nullable=False),
    sa.Column('periodo_mes', sa.Integer(), nullable=False),
    sa.Column('valor_objetivo', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('valor_alcanzado', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('id_vendedor', sa.Integer(), nullable=False),
    sa.Column('id_tipo_meta', sa.Integer(), nullable=False),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_tipo_meta'], ['negocio.tipos_metas.id_tipo_meta'], ),
    sa.ForeignKeyConstraint(['id_vendedor'], ['negocio.vendedores.id_vendedor'], ),
    sa.PrimaryKeyConstraint('id_meta'),
    schema='negocio'
    )

    # 2. Modificar la tabla 'maestro_clientes'
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.add_column(sa.Column('id_vendedor', sa.Integer(), nullable=True))
        # Nota: La FK se crea con un nombre explícito para poder eliminarla fácilmente si es necesario
        batch_op.create_foreign_key('fk_maestro_clientes_id_vendedor', 'vendedores', ['id_vendedor'], ['id_vendedor'], referent_schema='negocio')
        batch_op.drop_column('id_usuario_vendedor')
    # ### end Alembic commands ###


def downgrade():
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.add_column(sa.Column('id_usuario_vendedor', sa.INTEGER(), autoincrement=False, nullable=True))
        batch_op.drop_constraint('fk_maestro_clientes_id_vendedor', type_='foreignkey')
        batch_op.drop_column('id_vendedor')

    # 2. Eliminar las tablas creadas en esta migración
    op.drop_table('metas', schema='negocio')
    op.drop_table('tipos_metas', schema='negocio')
    op.drop_table('vendedores', schema='negocio')