# backend/app/events.py
from sqlalchemy import event
from sqlalchemy.orm.attributes import get_history
from flask import g
from app.models.analitica.historial_cambios import HistorialCambios
from app.models.entidades.maestro_clientes import MaestroClientes
from app import db

def before_flush(session, flush_context, instances):
    """
    Listener que se ejecuta ANTES de que la sesión se envíe a la DB.
    Aquí preparamos los logs de cambios.
    """
    # Usamos session.info para almacenar temporalmente los logs a crear
    session.info.setdefault('logs_a_crear', [])
    
    # Iteramos sobre los objetos modificados en la sesión
    for instance in session.dirty:
        if not isinstance(instance, MaestroClientes):
            continue # Solo nos interesa auditar MaestroClientes por ahora

        # Obtenemos el historial de cambios del objeto
        for attr in instance.__mapper__.attrs:
            history = get_history(instance, attr.key)
            if history.has_changes():
                valor_anterior = history.deleted[0] if history.deleted else None
                valor_nuevo = history.added[0] if history.added else None
                
                if str(valor_anterior) != str(valor_nuevo):
                    nuevo_log = HistorialCambios(
                        id_usuario=g.user.id_usuario if 'user' in g and hasattr(g.user, 'id_usuario') else None,
                        nombre_tabla=instance.__tablename__,
                        id_registro=str(instance.id_cliente),
                        nombre_campo=attr.key,
                        valor_anterior=str(valor_anterior),
                        valor_nuevo=str(valor_nuevo),
                        tipo_operacion='UPDATE'
                    )
                    # En lugar de session.add(), lo guardamos en nuestra lista temporal
                    session.info['logs_a_crear'].append(nuevo_log)

def after_flush(session, flush_context):
    """
    Listener que se ejecuta DESPUÉS de que la sesión se ha enviado a la DB.
    Este es el lugar seguro para añadir nuestros logs a la sesión.
    """
    if 'logs_a_crear' in session.info and session.info['logs_a_crear']:
        for log in session.info['logs_a_crear']:
            session.add(log)
        # Limpiamos la lista para la próxima transacción
        session.info['logs_a_crear'].clear()

# Registramos los nuevos listeners de eventos
event.listen(db.session, 'before_flush', before_flush)
event.listen(db.session, 'after_flush', after_flush)