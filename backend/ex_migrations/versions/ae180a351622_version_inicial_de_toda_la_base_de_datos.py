"""Version inicial de toda la base de datos

Revision ID: ae180a351622
Revises: 
Create Date: 2025-08-18 16:31:19.858183

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'ae180a351622'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute('CREATE SCHEMA IF NOT EXISTS entidades')
    op.execute('CREATE SCHEMA IF NOT EXISTS negocio')
    op.execute('CREATE SCHEMA IF NOT EXISTS analitica')

    # --- Entidades ---
    op.create_table('areas',
    sa.Column('id_area', sa.Integer(), nullable=False),
    sa.Column('codigo_area', sa.String(length=20), nullable=False),
    sa.Column('nombre_area', sa.String(length=100), nullable=False),
    sa.Column('descripcion_area', sa.String(length=255), nullable=True),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_area'),
    sa.UniqueConstraint('codigo_area'),
    schema='entidades',
    comment='Almacena las areas (Repuesto Center S.A., etc)'
    )
    op.create_table('condiciones_pago',
    sa.Column('id_condicion_pago', sa.Integer(), nullable=False),
    sa.Column('codigo_condicion_pago', sa.String(length=20), nullable=False, comment='Código de la condición de pago'),
    sa.Column('nombre_condicion_pago', sa.String(length=100), nullable=False),
    sa.Column('descripcion_condicion_pago', sa.String(length=255), nullable=True),
    sa.Column('dias_credito', sa.Integer(), nullable=False),
    sa.Column('ambito', sa.String(length=20), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_condicion_pago'),
    sa.UniqueConstraint('codigo_condicion_pago'),
    schema='entidades',
    comment='Almacena las condiciones de pago para cada cliente'
    )
    op.create_table('empresas',
    sa.Column('id_empresa', sa.Integer(), nullable=False),
    sa.Column('nombre_empresa', sa.String(length=100), nullable=False),
    sa.Column('rut_empresa', sa.String(length=15), nullable=False),
    sa.Column('codigo_empresa', sa.String(length=20), nullable=False, comment='Código de la empresa (RC_CL, RC_PE, GH, etc)'),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_empresa'),
    sa.UniqueConstraint('codigo_empresa'),
    schema='entidades',
    comment='Almacena las empresas (Repuesto Center S.A., etc)'
    )
    with op.batch_alter_table('empresas', schema='entidades') as batch_op:
        batch_op.create_index(batch_op.f('ix_entidades_empresas_rut_empresa'), ['rut_empresa'], unique=True)

    op.create_table('listas_precios',
    sa.Column('id_lista_precios', sa.Integer(), nullable=False),
    sa.Column('codigo_lista_precios', sa.String(length=20), nullable=False, comment='Código de la lista de precios (Alpha, Beta, etc.)'),
    sa.Column('nombre_lista_precios', sa.String(length=100), nullable=False),
    sa.Column('descripcion_lista_precios', sa.String(length=255), nullable=True),
    sa.Column('moneda', sa.String(length=3), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_lista_precios'),
    sa.UniqueConstraint('codigo_lista_precios'),
    schema='entidades',
    comment='Almacena las listas de precios para cada cliente'
    )
    op.create_table('permisos',
    sa.Column('id_permiso', sa.Integer(), nullable=False),
    sa.Column('nombre_permiso', sa.String(length=100), nullable=False),
    sa.Column('descripcion_permiso', sa.String(length=255), nullable=True),
    sa.PrimaryKeyConstraint('id_permiso'),
    sa.UniqueConstraint('nombre_permiso'),
    schema='entidades'
    )
    op.create_table('roles',
    sa.Column('id_rol', sa.Integer(), nullable=False),
    sa.Column('nombre_rol', sa.String(length=100), nullable=False),
    sa.Column('descripcion_rol', sa.String(length=255), nullable=True),
    sa.PrimaryKeyConstraint('id_rol'),
    sa.UniqueConstraint('nombre_rol'),
    schema='entidades'
    )
    op.create_table('segmentos_cliente',
    sa.Column('id_segmento_cliente', sa.Integer(), nullable=False),
    sa.Column('codigo_segmento_cliente', sa.String(length=20), nullable=False, comment='Código del segmento de cliente (SM, L, XL VOLUMEN, XL REPOSICION)'),
    sa.Column('nombre_segmento_cliente', sa.String(length=100), nullable=False),
    sa.Column('descripcion_segmento_cliente', sa.String(length=255), nullable=True),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_segmento_cliente'),
    sa.UniqueConstraint('codigo_segmento_cliente'),
    schema='entidades',
    comment='Clasifica clientes por su segmento (Grandes, Medianos, Pequeños, etc.)'
    )
    op.create_table('tipos_cliente',
    sa.Column('id_tipo_cliente', sa.Integer(), nullable=False),
    sa.Column('codigo_tipo_cliente', sa.String(length=20), nullable=False, comment='Código del tipo de cliente (NAC, EXT, etc.)'),
    sa.Column('nombre_tipo_cliente', sa.String(length=100), nullable=False),
    sa.Column('descripcion_tipo_cliente', sa.String(length=255), nullable=True),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_tipo_cliente'),
    sa.UniqueConstraint('codigo_tipo_cliente'),
    schema='entidades',
    comment='Clasifica clientes por su naturaleza (Nacional, Extranjero, etc.)'
    )
    op.create_table('canales_venta',
    sa.Column('id_canal', sa.Integer(), nullable=False),
    sa.Column('codigo_canal', sa.String(length=20), nullable=True),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_canal'),
    sa.UniqueConstraint('codigo_canal'),
    sa.UniqueConstraint('nombre'),
    schema='negocio',
    comment='Canales de venta (B2B, Call Center, Presencial, etc.)'
    )
    op.create_table('tipos_reglas',
    sa.Column('id_tipo_regla', sa.Integer(), nullable=False),
    sa.Column('codigo_tipo_regla', sa.String(length=20), nullable=True),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id_tipo_regla'),
    sa.UniqueConstraint('codigo_tipo_regla'),
    sa.UniqueConstraint('nombre'),
    schema='negocio',
    comment='Tipos de regla del motor (precio, descuento, tope, etc.)'
    )
    op.create_table('roles_permisos',
    sa.Column('id_rol', sa.Integer(), nullable=False),
    sa.Column('id_permiso', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['id_permiso'], ['entidades.permisos.id_permiso'], ),
    sa.ForeignKeyConstraint(['id_rol'], ['entidades.roles.id_rol'], ),
    sa.PrimaryKeyConstraint('id_rol', 'id_permiso'),
    schema='entidades'
    )
    op.create_table('usuarios',
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.Column('nombre_completo', sa.String(length=150), nullable=False),
    sa.Column('email', sa.String(length=100), nullable=False),
    sa.Column('telefono', sa.String(length=20), nullable=True),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_ultimo_login', sa.DateTime(), nullable=True),
    sa.Column('id_area', sa.Integer(), nullable=False),
    sa.Column('id_jefe_directo', sa.Integer(), nullable=True),
    sa.Column('preferencias', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='Preferencias de UI, notificaciones, etc.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_area'], ['entidades.areas.id_area'], ),
    sa.ForeignKeyConstraint(['id_jefe_directo'], ['entidades.usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_usuario'),
    schema='entidades'
    )
    with op.batch_alter_table('usuarios', schema='entidades') as batch_op:
        batch_op.create_index(batch_op.f('ix_entidades_usuarios_email'), ['email'], unique=True)

    op.create_table('motor_reglas_comerciales',
    sa.Column('id_regla', sa.Integer(), nullable=False),
    sa.Column('nombre_regla', sa.String(length=255), nullable=False),
    sa.Column('id_tipo_regla', sa.Integer(), nullable=False),
    sa.Column('condiciones', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='Define CUÁNDO se aplica la regla. Ej: {"canal": "B2B", "segmento": "XL"}'),
    sa.Column('resultado', postgresql.JSONB(astext_type=sa.Text()), nullable=False, comment='Define QUÉ sucede. Ej: {"tipo": "descuento_porcentual", "valor": 5}'),
    sa.Column('prioridad', sa.Integer(), nullable=False, comment='Para resolver conflictos entre reglas. Mayor número = mayor prioridad.'),
    sa.Column('activa', sa.Boolean(), nullable=False, comment='Si la regla está activa o no.'),
    sa.Column('fecha_inicio', sa.DateTime(), nullable=True, comment='Fecha de inicio de la regla.'),
    sa.Column('fecha_fin', sa.DateTime(), nullable=True, comment='Fecha de fin de la regla.'),
    sa.ForeignKeyConstraint(['id_tipo_regla'], ['negocio.tipos_reglas.id_tipo_regla'], ),
    sa.PrimaryKeyConstraint('id_regla'),
    schema='negocio',
    comment='Cerebro central de reglas de negocio para precios, descuentos, etc.'
    )
    op.create_table('historial_cambios',
    sa.Column('id_historial', sa.Integer(), nullable=False),
    sa.Column('fecha_cambio', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('id_usuario', sa.Integer(), nullable=True),
    sa.Column('nombre_tabla', sa.String(length=100), nullable=False),
    sa.Column('id_registro', sa.String(length=100), nullable=False),
    sa.Column('nombre_campo', sa.String(length=100), nullable=False),
    sa.Column('valor_anterior', sa.Text(), nullable=True),
    sa.Column('valor_nuevo', sa.Text(), nullable=True),
    sa.Column('tipo_operacion', sa.String(length=20), nullable=False, comment='CREATE, UPDATE, DELETE'),
    sa.ForeignKeyConstraint(['id_usuario'], ['entidades.usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_historial'),
    schema='analitica',
    comment='Log de auditoría para cambios en tablas críticas.'
    )
    op.create_table('maestro_clientes',
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('codigo_cliente', sa.String(length=30), nullable=False),
    sa.Column('rut_cliente', sa.String(length=15), nullable=False),
    sa.Column('nombre_cliente', sa.String(length=100), nullable=False),
    sa.Column('giro_economico', sa.String(length=100), nullable=True),
    sa.Column('descuento_base', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=True),
    sa.Column('linea_credito', sa.Numeric(precision=10, scale=2), server_default='0.0', nullable=True),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Cliente activo para operar. Si es False, revisar motivo_bloqueo.'),
    sa.Column('motivo_bloqueo', sa.String(length=255), nullable=True, comment='Causa del bloqueo. Si activo = True, este campo debe ser NULO.'),
    sa.Column('b2b_habilitado', sa.Boolean(), nullable=False, comment='Si la empresa cliente tiene acceso al portal B2B.'),
    sa.Column('id_tipo_cliente', sa.Integer(), nullable=False),
    sa.Column('id_segmento_cliente', sa.Integer(), nullable=False),
    sa.Column('id_lista_precios', sa.Integer(), nullable=False),
    sa.Column('id_condicion_pago', sa.Integer(), nullable=True),
    sa.Column('id_usuario_creacion', sa.Integer(), nullable=False),
    sa.Column('id_usuario_vendedor', sa.Integer(), nullable=True),
    sa.Column('id_empresa', sa.Integer(), nullable=False, comment='Refiere a nuestra empresa (Repuesto Center S.A., etc)'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_condicion_pago'], ['entidades.condiciones_pago.id_condicion_pago'], ),
    sa.ForeignKeyConstraint(['id_empresa'], ['entidades.empresas.id_empresa'], ),
    sa.ForeignKeyConstraint(['id_lista_precios'], ['entidades.listas_precios.id_lista_precios'], ),
    sa.ForeignKeyConstraint(['id_segmento_cliente'], ['entidades.segmentos_cliente.id_segmento_cliente'], ),
    sa.ForeignKeyConstraint(['id_tipo_cliente'], ['entidades.tipos_cliente.id_tipo_cliente'], ),
    sa.ForeignKeyConstraint(['id_usuario_creacion'], ['entidades.usuarios.id_usuario'], ),
    sa.ForeignKeyConstraint(['id_usuario_vendedor'], ['entidades.usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_cliente'),
    schema='entidades',
    comment='Tabla central de clientes'
    )
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.create_index(batch_op.f('ix_entidades_maestro_clientes_codigo_cliente'), ['codigo_cliente'], unique=True)
        batch_op.create_index(batch_op.f('ix_entidades_maestro_clientes_nombre_cliente'), ['nombre_cliente'], unique=False)
        batch_op.create_index(batch_op.f('ix_entidades_maestro_clientes_rut_cliente'), ['rut_cliente'], unique=True)

    op.create_table('usuarios_roles',
    sa.Column('id_usuario', sa.Integer(), nullable=False),
    sa.Column('id_rol', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['id_rol'], ['entidades.roles.id_rol'], ),
    sa.ForeignKeyConstraint(['id_usuario'], ['entidades.usuarios.id_usuario'], ),
    sa.PrimaryKeyConstraint('id_usuario', 'id_rol'),
    schema='entidades'
    )
    op.create_table('cliente_metricas',
    sa.Column('id_metrica', sa.Integer(), nullable=False),
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('fecha_ultima_compra', sa.DateTime(), nullable=True),
    sa.Column('monto_total_global', sa.Numeric(precision=12, scale=2), server_default='0.0', nullable=True),
    sa.Column('ticket_promedio_global', sa.Numeric(precision=12, scale=2), server_default='0.0', nullable=True),
    sa.Column('metricas_por_canal', postgresql.JSONB(astext_type=sa.Text()), nullable=True, comment='Objeto JSON con KPIs por canal de venta (B2B, Call Center, etc)'),
    sa.ForeignKeyConstraint(['id_cliente'], ['entidades.maestro_clientes.id_cliente'], ),
    sa.PrimaryKeyConstraint('id_metrica'),
    sa.UniqueConstraint('id_cliente'),
    schema='analitica',
    comment='Almacena KPIs y métricas agregadas por cliente para una consulta rápida.'
    )
    op.create_table('contactos',
    sa.Column('id_contacto', sa.Integer(), nullable=False),
    sa.Column('nombre', sa.String(length=100), nullable=False),
    sa.Column('cargo', sa.String(length=100), nullable=True),
    sa.Column('email', sa.String(length=100), nullable=False),
    sa.Column('telefono', sa.String(length=20), nullable=True),
    sa.Column('es_principal', sa.Boolean(), nullable=False),
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_cliente'], ['entidades.maestro_clientes.id_cliente'], ),
    sa.PrimaryKeyConstraint('id_contacto'),
    schema='entidades'
    )
    op.create_table('direcciones',
    sa.Column('id_direccion', sa.Integer(), nullable=False),
    sa.Column('calle', sa.String(length=255), nullable=False),
    sa.Column('numero', sa.String(length=20), nullable=True),
    sa.Column('comuna', sa.String(length=100), nullable=False),
    sa.Column('ciudad', sa.String(length=100), nullable=False),
    sa.Column('region', sa.String(length=100), nullable=False),
    sa.Column('codigo_postal', sa.String(length=20), nullable=True),
    sa.Column('es_facturacion', sa.Boolean(), nullable=False),
    sa.Column('es_despacho', sa.Boolean(), nullable=False),
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_cliente'], ['entidades.maestro_clientes.id_cliente'], ),
    sa.PrimaryKeyConstraint('id_direccion'),
    schema='entidades'
    )
    op.create_table('usuarios_b2b',
    sa.Column('id_usuario_b2b', sa.Integer(), nullable=False),
    sa.Column('nombre_completo', sa.String(length=150), nullable=False),
    sa.Column('usuario', sa.String(length=100), nullable=False),
    sa.Column('email', sa.String(length=100), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('id_cliente', sa.Integer(), nullable=False),
    sa.Column('activo', sa.Boolean(), nullable=False, comment='Permite desactivar un usuario sin borrarlo.'),
    sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('fecha_modificacion', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['id_cliente'], ['entidades.maestro_clientes.id_cliente'], ),
    sa.PrimaryKeyConstraint('id_usuario_b2b'),
    sa.UniqueConstraint('usuario'),
    schema='entidades'
    )
    with op.batch_alter_table('usuarios_b2b', schema='entidades') as batch_op:
        batch_op.create_index(batch_op.f('ix_entidades_usuarios_b2b_email'), ['email'], unique=True)

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('usuarios_b2b', schema='entidades') as batch_op:
        batch_op.drop_index(batch_op.f('ix_entidades_usuarios_b2b_email'))

    op.drop_table('usuarios_b2b', schema='entidades')
    op.drop_table('direcciones', schema='entidades')
    op.drop_table('contactos', schema='entidades')
    op.drop_table('cliente_metricas', schema='analitica')
    op.drop_table('usuarios_roles', schema='entidades')
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.drop_index(batch_op.f('ix_entidades_maestro_clientes_rut_cliente'))
        batch_op.drop_index(batch_op.f('ix_entidades_maestro_clientes_nombre_cliente'))
        batch_op.drop_index(batch_op.f('ix_entidades_maestro_clientes_codigo_cliente'))

    op.drop_table('maestro_clientes', schema='entidades')
    op.drop_table('historial_cambios', schema='analitica')
    op.drop_table('motor_reglas_comerciales', schema='negocio')
    with op.batch_alter_table('usuarios', schema='entidades') as batch_op:
        batch_op.drop_index(batch_op.f('ix_entidades_usuarios_email'))

    op.drop_table('usuarios', schema='entidades')
    op.drop_table('roles_permisos', schema='entidades')
    op.drop_table('tipos_reglas', schema='negocio')
    op.drop_table('canales_venta', schema='negocio')
    op.drop_table('tipos_cliente', schema='entidades')
    op.drop_table('segmentos_cliente', schema='entidades')
    op.drop_table('roles', schema='entidades')
    op.drop_table('permisos', schema='entidades')
    op.drop_table('listas_precios', schema='entidades')
    with op.batch_alter_table('empresas', schema='entidades') as batch_op:
        batch_op.drop_index(batch_op.f('ix_entidades_empresas_rut_empresa'))

    op.drop_table('empresas', schema='entidades')
    op.drop_table('condiciones_pago', schema='entidades')
    op.drop_table('areas', schema='entidades')

    op.execute('DROP SCHEMA analitica CASCADE')
    op.execute('DROP SCHEMA negocio CASCADE')
    op.execute('DROP SCHEMA entidades CASCADE')
    # ### end Alembic commands ###
