"""feat: Actualiza categorías de tipo caso - elimina INSTALACION_USUARIO_NUEVO

Revision ID: 20251013_101435
Revises: 103598a96708
Create Date: 2025-10-13 10:14:35.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251013_101435'
down_revision = 'c59d1deb5a6b'
branch_labels = None
depends_on = None


def upgrade():
    # Primero, actualizar cualquier registro que use INSTALACION_USUARIO_NUEVO a INSTALACION_USUARIO_ADICIONAL
    op.execute("""
        UPDATE soporte.tipos_caso 
        SET categoria_uso = 'INSTALACION_USUARIO_ADICIONAL'::soporte.categoria_tipo_caso
        WHERE categoria_uso = 'INSTALACION_USUARIO_NUEVO'::soporte.categoria_tipo_caso;
    """)
    
    # Crear un nuevo tipo enum sin el valor que queremos eliminar
    op.execute("""
        CREATE TYPE soporte.categoria_tipo_caso_new AS ENUM (
            'INSTALACION_CLIENTE_NUEVO',
            'INSTALACION_USUARIO_ADICIONAL',
            'INSTALACION_CAMBIO_EQUIPO',
            'SOPORTE_TECNICO',
            'CONSULTA',
            'BLOQUEO',
            'OTRO'
        );
    """)
    
    # Cambiar el tipo de la columna
    op.execute("""
        ALTER TABLE soporte.tipos_caso 
        ALTER COLUMN categoria_uso TYPE soporte.categoria_tipo_caso_new 
        USING categoria_uso::text::soporte.categoria_tipo_caso_new;
    """)
    
    # Eliminar el tipo antiguo y renombrar el nuevo
    op.execute("DROP TYPE soporte.categoria_tipo_caso;")
    op.execute("ALTER TYPE soporte.categoria_tipo_caso_new RENAME TO categoria_tipo_caso;")


def downgrade():
    # Crear el tipo original con todos los valores
    op.execute("""
        CREATE TYPE soporte.categoria_tipo_caso_old AS ENUM (
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
    
    # Cambiar el tipo de la columna de vuelta
    op.execute("""
        ALTER TABLE soporte.tipos_caso 
        ALTER COLUMN categoria_uso TYPE soporte.categoria_tipo_caso_old 
        USING categoria_uso::text::soporte.categoria_tipo_caso_old;
    """)
    
    # Eliminar el tipo actual y renombrar el original
    op.execute("DROP TYPE soporte.categoria_tipo_caso;")
    op.execute("ALTER TYPE soporte.categoria_tipo_caso_old RENAME TO categoria_tipo_caso;")
    
    # Nota: Los registros que fueron cambiados de INSTALACION_USUARIO_NUEVO a INSTALACION_USUARIO_ADICIONAL
    # permanecerán como INSTALACION_USUARIO_ADICIONAL
