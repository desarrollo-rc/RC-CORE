"""Sincronizacion final de esquemas

Revision ID: 68083d2918e7
Revises: 34cb039c04a8
Create Date: 2025-08-29 12:06:39.902629

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '68083d2918e7'
down_revision = '34cb039c04a8'
branch_labels = None
depends_on = None


def upgrade():
    # ### Comandos Reorganizados Manualmente para la Sincronización Final ###

    # --- PASO 1: Crear los nuevos esquemas y tablas independientes ---
    op.execute('CREATE SCHEMA IF NOT EXISTS general')
    op.execute('CREATE SCHEMA IF NOT EXISTS productos')
    # ... (Aquí van todas las op.create_table para paises, regiones, ciudades, comunas y marcas, tal como estaban)
    op.create_table('paises', sa.Column('id_pais', sa.Integer(), nullable=False), sa.Column('nombre_pais', sa.String(length=100), nullable=False), sa.PrimaryKeyConstraint('id_pais'), schema='general')
    op.create_table('regiones', sa.Column('id_region', sa.Integer(), nullable=False), sa.Column('nombre_region', sa.String(length=100), nullable=False), sa.Column('id_pais', sa.Integer(), nullable=False), sa.ForeignKeyConstraint(['id_pais'], ['general.paises.id_pais'], ), sa.PrimaryKeyConstraint('id_region'), schema='general')
    op.create_table('ciudades', sa.Column('id_ciudad', sa.Integer(), nullable=False), sa.Column('nombre_ciudad', sa.String(length=100), nullable=False), sa.Column('id_region', sa.Integer(), nullable=False), sa.ForeignKeyConstraint(['id_region'], ['general.regiones.id_region'], ), sa.PrimaryKeyConstraint('id_ciudad'), schema='general')
    op.create_table('comunas', sa.Column('id_comuna', sa.Integer(), nullable=False), sa.Column('nombre_comuna', sa.String(length=100), nullable=False), sa.Column('id_ciudad', sa.Integer(), nullable=False), sa.ForeignKeyConstraint(['id_ciudad'], ['general.ciudades.id_ciudad'], ), sa.PrimaryKeyConstraint('id_comuna'), schema='general')
    op.create_table('marcas', sa.Column('id_marca', sa.Integer(), nullable=False), sa.Column('codigo_marca', sa.String(length=30), nullable=False), sa.Column('nombre_marca', sa.String(length=100), nullable=False), sa.Column('descripcion', sa.String(length=255), nullable=True, comment='Breve descripción o eslogan de la marca.'), sa.Column('tier_marca', sa.String(length=50), nullable=True, comment='Tier de la marca (TIER 1, TIER 2, TIER 3, TIER 4, etc.)'), sa.Column('id_pais_origen', sa.Integer(), nullable=True), sa.Column('url_imagen', sa.String(length=255), nullable=True, comment='URL del logo de la marca'), sa.Column('activo', sa.Boolean(), nullable=False), sa.Column('fecha_creacion', sa.DateTime(), server_default=sa.text('now()'), nullable=False), sa.Column('fecha_modificacion', sa.DateTime(), nullable=True), sa.ForeignKeyConstraint(['id_pais_origen'], ['general.paises.id_pais'], ), sa.PrimaryKeyConstraint('id_marca'), sa.UniqueConstraint('codigo_marca'), schema='productos')

    # --- PASO 2: Modificar 'cliente_metricas' para establecer la nueva estructura y PK ---
    with op.batch_alter_table('cliente_metricas', schema='analitica') as batch_op:
        # Añadir nuevas columnas
        batch_op.add_column(sa.Column('fecha_primera_compra', sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column('dias_desde_ultima_compra', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('monto_total_historico', sa.Numeric(precision=15, scale=2), server_default='0.0'))
        batch_op.add_column(sa.Column('ticket_promedio_historico', sa.Numeric(precision=12, scale=2), server_default='0.0'))
        batch_op.add_column(sa.Column('cantidad_ordenes_historico', sa.Integer(), server_default='0'))
        batch_op.add_column(sa.Column('estado_cliente', sa.String(length=50), nullable=True))

        # Eliminar las columnas y restricciones antiguas
        batch_op.drop_constraint('cliente_metricas_id_cliente_key', type_='unique')
        batch_op.drop_column('metricas_por_canal')
        batch_op.drop_column('ticket_promedio_global')
        batch_op.drop_column('monto_total_global')
        batch_op.drop_column('id_metrica')
        
        # *** LA LÍNEA CLAVE: Establecer id_cliente como la nueva llave primaria ***
        batch_op.create_primary_key('pk_cliente_metricas', ['id_cliente'])

    # --- PASO 3: Crear las nuevas tablas "spoke" que AHORA SÍ pueden referenciar a la nueva PK ---
    op.create_table('cliente_actividad',
        sa.Column('id_cliente', sa.Integer(), nullable=False),
        sa.Column('ultimo_login_b2b', sa.DateTime(), nullable=True),
        sa.Column('sesiones_b2b_ultimos_30d', sa.Integer(), server_default='0', nullable=True),
        sa.Column('sesiones_b2b_total', sa.Integer(), server_default='0', nullable=True),
        sa.Column('busquedas_sin_resultado_ultimos_30d', sa.Integer(), server_default='0', nullable=True),
        sa.Column('busquedas_sin_resultado_total', sa.Integer(), server_default='0', nullable=True),
        sa.ForeignKeyConstraint(['id_cliente'], ['analitica.cliente_metricas.id_cliente'], ),
        sa.PrimaryKeyConstraint('id_cliente'),
        schema='analitica'
    )
    # ... (y el resto de las create_table para las métricas, que ya estaban bien) ...
    op.create_table('cliente_metricas_canal', sa.Column('id_cliente', sa.Integer(), nullable=False), sa.Column('id_canal', sa.Integer(), nullable=False), sa.Column('monto_total_canal', sa.Numeric(precision=15, scale=2), nullable=True), sa.Column('ticket_promedio_canal', sa.Numeric(precision=12, scale=2), nullable=True), sa.Column('cantidad_ordenes_canal', sa.Integer(), nullable=True), sa.Column('fecha_ultima_compra_canal', sa.DateTime(), nullable=True), sa.ForeignKeyConstraint(['id_canal'], ['negocio.canales_venta.id_canal'], ), sa.ForeignKeyConstraint(['id_cliente'], ['analitica.cliente_metricas.id_cliente'], ), sa.PrimaryKeyConstraint('id_cliente', 'id_canal', name='pk_cliente_canal'), schema='analitica')
    op.create_table('cliente_metricas_marca', sa.Column('id_cliente', sa.Integer(), nullable=False), sa.Column('id_marca', sa.Integer(), nullable=False), sa.Column('monto_total_marca', sa.Numeric(precision=15, scale=2), nullable=True), sa.Column('cantidad_productos_marca', sa.Integer(), nullable=True), sa.Column('ticket_promedio_marca', sa.Numeric(precision=12, scale=2), nullable=True), sa.Column('fecha_ultima_compra_marca', sa.DateTime(), nullable=True), sa.ForeignKeyConstraint(['id_cliente'], ['analitica.cliente_metricas.id_cliente'], ), sa.ForeignKeyConstraint(['id_marca'], ['productos.marcas.id_marca'], ), sa.PrimaryKeyConstraint('id_cliente', 'id_marca', name='pk_cliente_marca'), schema='analitica')
    op.create_table('cliente_metricas_mensuales', sa.Column('id_cliente', sa.Integer(), nullable=False), sa.Column('anio', sa.SmallInteger(), nullable=False), sa.Column('mes', sa.SmallInteger(), nullable=False), sa.Column('monto_total_mes', sa.Numeric(precision=15, scale=2), nullable=True), sa.Column('ordenes_mes', sa.Integer(), nullable=True), sa.Column('ticket_promedio_mes', sa.Numeric(precision=12, scale=2), nullable=True), sa.ForeignKeyConstraint(['id_cliente'], ['analitica.cliente_metricas.id_cliente'], ), sa.PrimaryKeyConstraint('id_cliente', 'anio', 'mes', name='pk_cliente_mes'), schema='analitica')

    # --- PASO 4: Aplicar el resto de las modificaciones ---
    with op.batch_alter_table('direcciones', schema='entidades') as batch_op:
        batch_op.add_column(sa.Column('id_comuna', sa.Integer(), nullable=True))

    op.execute("INSERT INTO general.paises (id_pais, nombre_pais) VALUES (-1, 'NO ASIGNADO') ON CONFLICT DO NOTHING")
    op.execute("INSERT INTO general.regiones (id_region, nombre_region, id_pais) VALUES (-1, 'NO ASIGNADO', -1) ON CONFLICT DO NOTHING")
    op.execute("INSERT INTO general.ciudades (id_ciudad, nombre_ciudad, id_region) VALUES (-1, 'NO ASIGNADO', -1) ON CONFLICT DO NOTHING")
    op.execute("INSERT INTO general.comunas (id_comuna, nombre_comuna, id_ciudad) VALUES (-1, 'NO ASIGNADO', -1) ON CONFLICT DO NOTHING")

    op.execute("UPDATE entidades.direcciones SET id_comuna = -1 WHERE id_comuna IS NULL")

    with op.batch_alter_table('direcciones', schema='entidades') as batch_op:
        batch_op.alter_column('id_comuna', existing_type=sa.INTEGER(), nullable=False)
        batch_op.create_foreign_key('fk_direcciones_comuna', 'comunas', ['id_comuna'], ['id_comuna'], referent_schema='general')
        batch_op.drop_column('region')
        batch_op.drop_column('comuna')
        batch_op.drop_column('ciudad')
    
    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.add_column(sa.Column('es_vip', sa.Boolean(), server_default='false', nullable=False))

    with op.batch_alter_table('tipo_negocio', schema='entidades') as batch_op:
        batch_op.alter_column('activo',
               existing_type=sa.BOOLEAN(),
               comment='Permite desactivar un usuario sin borrarlo.',
               existing_comment='Permite desactivar un tipo de negocio sin borrarlo.',
               existing_nullable=False)

    with op.batch_alter_table('base_conocimiento', schema='soporte') as batch_op:
        batch_op.drop_column('fecha_creacion')
        batch_op.drop_column('activo')
        batch_op.drop_column('fecha_modificacion')

    with op.batch_alter_table('instalaciones', schema='soporte') as batch_op:
        batch_op.add_column(sa.Column('id_usuario_asignado', sa.Integer(), nullable=True, comment='Usuario asignado a la instalación'))
        batch_op.drop_constraint(batch_op.f('instalaciones_id_tecnico_asignado_fkey'), type_='foreignkey')
        batch_op.create_foreign_key(None, 'usuarios', ['id_usuario_asignado'], ['id_usuario'], referent_schema='entidades')
        batch_op.drop_column('id_tecnico_asignado')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('instalaciones', schema='soporte') as batch_op:
        batch_op.add_column(sa.Column('id_tecnico_asignado', sa.INTEGER(), autoincrement=False, nullable=True, comment='Usuario asignado a la instalación'))
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.create_foreign_key(batch_op.f('instalaciones_id_tecnico_asignado_fkey'), 'usuarios', ['id_tecnico_asignado'], ['id_usuario'], referent_schema='entidades')
        batch_op.drop_column('id_usuario_asignado')

    with op.batch_alter_table('base_conocimiento', schema='soporte') as batch_op:
        batch_op.add_column(sa.Column('fecha_modificacion', postgresql.TIMESTAMP(), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('activo', sa.BOOLEAN(), autoincrement=False, nullable=False, comment='Permite desactivar un usuario sin borrarlo.'))
        batch_op.add_column(sa.Column('fecha_creacion', postgresql.TIMESTAMP(), server_default=sa.text('now()'), autoincrement=False, nullable=False))

    with op.batch_alter_table('tipo_negocio', schema='entidades') as batch_op:
        batch_op.alter_column('activo',
               existing_type=sa.BOOLEAN(),
               comment='Permite desactivar un tipo de negocio sin borrarlo.',
               existing_comment='Permite desactivar un usuario sin borrarlo.',
               existing_nullable=False)

    with op.batch_alter_table('maestro_clientes', schema='entidades') as batch_op:
        batch_op.drop_column('es_vip')

    with op.batch_alter_table('direcciones', schema='entidades') as batch_op:
        batch_op.add_column(sa.Column('ciudad', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('comuna', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
        batch_op.add_column(sa.Column('region', sa.VARCHAR(length=100), autoincrement=False, nullable=False))
        batch_op.drop_constraint(None, type_='foreignkey')
        batch_op.drop_column('id_comuna')

    with op.batch_alter_table('cliente_metricas', schema='analitica') as batch_op:
        batch_op.add_column(sa.Column('monto_total_global', sa.NUMERIC(precision=12, scale=2), server_default=sa.text('0.0'), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('ticket_promedio_global', sa.NUMERIC(precision=12, scale=2), server_default=sa.text('0.0'), autoincrement=False, nullable=True))
        batch_op.add_column(sa.Column('id_metrica', sa.INTEGER(), autoincrement=True, nullable=False))
        batch_op.add_column(sa.Column('metricas_por_canal', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True, comment='Objeto JSON con KPIs por canal de venta (B2B, Call Center, etc)'))
        batch_op.create_table_comment(
        'Almacena KPIs y métricas agregadas por cliente para una consulta rápida.',
        existing_comment='HUB de métricas. Almacena KPIs agregados a nivel de cliente.'
    )
        batch_op.create_unique_constraint(batch_op.f('cliente_metricas_id_cliente_key'), ['id_cliente'], postgresql_nulls_not_distinct=False)
        batch_op.drop_column('estado_cliente')
        batch_op.drop_column('cantidad_ordenes_historico')
        batch_op.drop_column('ticket_promedio_historico')
        batch_op.drop_column('monto_total_historico')
        batch_op.drop_column('dias_desde_ultima_compra')
        batch_op.drop_column('fecha_primera_compra')

    op.drop_table('cliente_metricas_mensuales', schema='analitica')
    op.drop_table('cliente_metricas_marca', schema='analitica')
    op.drop_table('cliente_metricas_canal', schema='analitica')
    op.drop_table('cliente_actividad', schema='analitica')
    op.drop_table('comunas', schema='general')
    op.drop_table('ciudades', schema='general')
    op.drop_table('marcas', schema='productos')
    op.drop_table('regiones', schema='general')
    op.drop_table('paises', schema='general')
    # ### end Alembic commands ###
