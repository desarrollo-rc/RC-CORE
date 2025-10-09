"""feat: Agrega campo categoria_uso a tipos_caso

Revision ID: add_categoria_tipos
Revises: [última_revisión]
Create Date: 2025-10-08

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_categoria_tipos'
down_revision = '103598a96708'
branch_labels = None
depends_on = None

# Crear el tipo ENUM para categoría
categoria_tipo_caso_enum = sa.Enum(
    'Instalación Cliente Nuevo',
    'Instalación Usuario Nuevo', 
    'Instalación Usuario Adicional',
    'Instalación Cambio de Equipo',
    'Soporte Técnico',
    'Consulta',
    'Bloqueo',
    'Otro',
    name='categoria_tipo_caso'
)

def upgrade():
    # Crear el tipo ENUM directamente con SQL para especificar el esquema
    op.execute("""
        CREATE TYPE soporte.categoria_tipo_caso AS ENUM (
            'INSTALACION_CLIENTE_NUEVO',
            'INSTALACION_USUARIO_NUEVO',
            'INSTALACION_USUARIO_ADICIONAL',
            'INSTALACION_CAMBIO_EQUIPO',
            'SOPORTE_TECNICO',
            'CONSULTA',
            'BLOQUEO',
            'OTRO'
        );
    """)
    
    # Agregar la columna
    op.execute("""
        ALTER TABLE soporte.tipos_caso 
        ADD COLUMN categoria_uso soporte.categoria_tipo_caso;
    """)
    
    op.execute("""
        COMMENT ON COLUMN soporte.tipos_caso.categoria_uso IS 
        'Categoría para identificar automáticamente el tipo de caso en flujos';
    """)

def downgrade():
    op.execute("ALTER TABLE soporte.tipos_caso DROP COLUMN IF EXISTS categoria_uso;")
    op.execute("DROP TYPE IF EXISTS soporte.categoria_tipo_caso CASCADE;")

