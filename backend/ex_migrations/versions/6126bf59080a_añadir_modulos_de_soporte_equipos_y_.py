"""Añadir modulos de soporte, equipos y nuevas entidades de cliente

Revision ID: 6126bf59080a
Revises: 4909867e69ae
Create Date: 2025-08-26 12:34:16.031825

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '6126bf59080a'
down_revision = '4909867e69ae'
branch_labels = None
depends_on = None


def upgrade():
    # ### Comandos para los nuevos cambios ###
    op.execute('CREATE SCHEMA IF NOT EXISTS soporte')

    op.create_table('tipo_negocio',
    sa.Column('id_tipo_negocio', sa.Integer(), nullable=False),
    sa.Column('codigo_tipo_negocio', sa.String(length=25), nullable=False),
    sa.Column('nombre_tipo_negocio', sa.String(length=255), nullable=False),
    sa.Column('descripcion_tipo_negocio', sa.String(length=255), nullable=True),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un tipo de negocio sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_tipo_negocio'),
    sa.UniqueConstraint('codigo_tipo_negocio'),
    schema='entidades'
    )
    op.create_table('tipos_caso',
    sa.Column('id_tipo_caso', sa.Integer(), nullable=False),
    sa.Column('codigo_tipo_caso', sa.String(length=50), nullable=False),
    sa.Column('nombre_tipo_caso', sa.String(length=100), nullable=False),
    sa.Column('descripcion_tipo_caso', sa.String(length=255), nullable=True),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_tipo_caso'),
    sa.UniqueConstraint('codigo_tipo_caso'),
    schema='soporte',
    comment='Categoriza los casos de soporte (Instalación, Bloqueo, etc.)'
    )
    op.create_table('base_conocimiento',
    sa.Column('id_articulo', sa.Integer(), nullable=False),
    sa.Column('problema_frecuente', sa.String(length=255), nullable=False),
    sa.Column('solucion_detallada', sa.Text(), nullable=False, comment='Puede contener Markdown para formato enriquecido'),
    sa.Column('id_tipo_caso', sa.Integer(), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_tipo_caso'], ['soporte.tipos_caso.id_tipo_caso'], ),
    sa.PrimaryKeyConstraint('id_articulo'),
    sa.UniqueConstraint('problema_frecuente'),
    schema='soporte',
    comment='Artículos para resolver problemas comunes'
    )
    op.create_table('cliente_empresa',
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('id_empresa', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['id_cliente'], ['entidades.maestro_clientes.id_cliente'], ),
    sa.ForeignKeyConstraint(['id_empresa'], ['entidades.empresas.id_empresa'], ),
    sa.PrimaryKeyConstraint('id_cliente', 'id_empresa'),
    schema='entidades'
    )
    op.create_table('equipos',
    sa.Column('id_equipo', sa.Integer(), nullable=False),
    sa.Column('id_usuario_b2b', sa.Integer(), nullable=False),
    sa.Column('nombre_equipo', sa.String(length=100), nullable=False),
    sa.Column('mac_address', sa.String(length=17), nullable=True, comment='Dirección MAC del dispositivo'),
    sa.Column('procesador', sa.String(length=100), nullable=True),
    sa.Column('placa_madre', sa.String(length=100), nullable=True),
    sa.Column('disco_duro', sa.String(length=100), nullable=True),
    sa.Column('estado_alta', sa.Enum('PENDIENTE', 'APROBADO', 'RECHAZADO', name='estadoaltaequipo'), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_usuario_b2b'], ['entidades.usuarios_b2b.id_usuario_b2b'], ),
    sa.PrimaryKeyConstraint('id_equipo'),
    schema='entidades',
    comment='Equipos de clientes autorizados para operar con el B2B'
    )
    op.create_table('casos',
    sa.Column('id_caso', sa.Integer(), nullable=False),
    sa.Column('titulo', sa.String(length=255), nullable=False),
    sa.Column('descripcion', sa.Text(), nullable=False),
    sa.Column('estado', sa.Enum('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO', name='estadocaso'), nullable=False),
    sa.Column('prioridad', sa.Enum('BAJA', 'MEDIA', 'ALTA', 'URGENTE', name='prioridadcaso'), nullable=False),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_cierre', sa.DateTime(), nullable=True),
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('id_usuario_creacion', sa.Integer(), nullable=False, comment='Usuario interno que registra el caso'),
    sa.Column('id_usuario_asignado', sa.Integer(), nullable=True),
    sa.Column('id_tipo_caso', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['id_cliente'], ['entidades.maestro_clientes.id_cliente'], ),
    sa.ForeignKeyConstraint(['id_tipo_caso'], ['soporte.tipos_caso.id_tipo_caso'], ),
    sa.ForeignKeyConstraint(['id_usuario_asignado'], ['entidades.usuarios.id_usuario'], ),
    sa.ForeignKeyConstraint(['id_usuario_creacion'], ['entidades.usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_caso'),
    schema='soporte',
    comment='Ticket o solicitud central de un cliente'
    )
    op.create_table('casos_conocimiento',
    sa.Column('id_caso', sa.Integer(), nullable=False),
    sa.Column('id_articulo', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['id_articulo'], ['soporte.base_conocimiento.id_articulo'], ),
    sa.ForeignKeyConstraint(['id_caso'], ['soporte.casos.id_caso'], ),
    sa.PrimaryKeyConstraint('id_caso', 'id_articulo'),
    schema='soporte'
    )
    op.create_table('instalaciones',
    sa.Column('id_instalacion', sa.Integer(), nullable=False),
    sa.Column('id_caso', sa.Integer(), nullable=False),
    sa.Column('id_usuario_b2b', sa.Integer(), nullable=True, comment='Usuario B2B a instalar'),
    sa.Column('id_equipo', sa.Integer(), nullable=True),
    sa.Column('fecha_solicitud', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_aprobacion', sa.DateTime(), nullable=True, comment='Fecha de aprobación de Gerencia'),
    sa.Column('fecha_creacion_usuario', sa.DateTime(), nullable=True, comment='Fecha de creación del usuario en el sistema'),
    sa.Column('fecha_instalacion', sa.DateTime(), nullable=True, comment='Fecha de instalación en el equipo del cliente'),
    sa.Column('fecha_capacitacion', sa.DateTime(), nullable=True, comment='Fecha de la capacitación (opcional)'),
    sa.Column('fecha_finalizacion', sa.DateTime(), nullable=True, comment='Fecha de cierre del proceso completo'),
    sa.Column('id_tecnico_asignado', sa.Integer(), nullable=True, comment='Usuario asignado a la instalación'),
    sa.Column('estado', sa.Enum('PENDIENTE_APROBACION', 'PENDIENTE_INSTALACION', 'AGENDADA', 'COMPLETADA', 'CANCELADA', name='estadoinstalacion'), nullable=False),
    sa.Column('observaciones', sa.Text(), nullable=True, comment='Observaciones del proceso'),
    sa.ForeignKeyConstraint(['id_caso'], ['soporte.casos.id_caso'], ),
    sa.ForeignKeyConstraint(['id_equipo'], ['entidades.equipos.id_equipo'], ),
    sa.ForeignKeyConstraint(['id_tecnico_asignado'], ['entidades.usuarios.id_usuario'], ),
    sa.ForeignKeyConstraint(['id_usuario_b2b'], ['entidades.usuarios_b2b.id_usuario_b2b'], ),
    sa.PrimaryKeyConstraint('id_instalacion'),
    schema='soporte',
    comment='Registra el flujo de trabajo de una instalación específica'
    )

    # --- 2. Modificaciones a la tabla existente 'maestro_clientes' ---
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        # Paso A: Añadir la columna permitiendo nulos
        batch_op.add_column(sa.Column('id_tipo_negocio', sa.Integer(), nullable=True))

    # Paso B: Crear un 'Tipo de Negocio' por defecto y obtener su ID
    op.execute("INSERT INTO entidades.tipo_negocio (codigo_tipo_negocio, nombre_tipo_negocio, activo, fecha_creacion) VALUES ('SIN_ASIGNAR', 'Sin Asignar', true, NOW()) ON CONFLICT (codigo_tipo_negocio) DO NOTHING")
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id_tipo_negocio FROM entidades.tipo_negocio WHERE codigo_tipo_negocio = 'SIN_ASIGNAR'"))
    default_id = result.fetchone()[0]

    # Paso C: Actualizar todos los clientes existentes para que usen el ID por defecto
    op.execute(f"UPDATE entidades.maestro_clientes SET id_tipo_negocio = {default_id} WHERE id_tipo_negocio IS NULL")

    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        # Paso D: Ahora sí, hacer la columna NO NULA
        batch_op.alter_column('id_tipo_negocio',
               existing_type=sa.INTEGER(),
               nullable=False)
        # Crear la FK
        batch_op.create_foreign_key('fk_maestro_clientes_tipo_negocio', 'tipo_negocio', ['id_tipo_negocio'], ['id_tipo_negocio'], referent_schema='entidades')
        # Eliminar la antigua columna y su FK
        batch_op.drop_constraint('maestro_clientes_id_empresa_fkey', type_='foreignkey')
        batch_op.drop_column('id_empresa')

def downgrade():
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.add_column(sa.Column('id_empresa', sa.INTEGER(), autoincrement=False, nullable=False))
        batch_op.create_foreign_key('maestro_clientes_id_empresa_fkey', 'empresas', ['id_empresa'], ['id_empresa'])
        batch_op.drop_constraint('fk_maestro_clientes_tipo_negocio', type_='foreignkey')
        batch_op.drop_column('id_tipo_negocio')

    op.drop_table('instalaciones', schema='soporte')
    op.drop_table('casos_conocimiento', schema='soporte')
    op.drop_table('casos', schema='soporte')
    op.drop_table('equipos', schema='entidades')
    op.drop_table('cliente_empresa', schema='entidades')
    op.drop_table('base_conocimiento', schema='soporte')
    op.drop_table('tipos_caso', schema='soporte')
    op.drop_table('tipo_negocio', schema='entidades')

    op.execute('DROP SCHEMA soporte')