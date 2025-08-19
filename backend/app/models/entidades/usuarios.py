# backend/app/models/entidades/usuarios.py
from app.extensions import db
from sqlalchemy import func
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import JSONB
from .roles import usuarios_roles
from .roles import Permiso
from .roles import Rol
from .areas import Area
from sqlalchemy.ext.hybrid import hybrid_property

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    __table_args__ = {'schema': 'entidades'}

    # --- Identidad y Acceso ---
    id_usuario = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    telefono = db.Column(db.String(20), nullable=True)
    password_hash = db.Column(db.String(255), nullable=False)
    activo = db.Column(db.Boolean, default=True, nullable=False, comment='Permite desactivar un usuario sin borrarlo.')
    fecha_ultimo_login = db.Column(db.DateTime, nullable=True)
    
    # --- Rol, Jerarquía y Organización ---
    roles = db.relationship('Rol', secondary=usuarios_roles, back_populates='usuarios')
    
    id_area = db.Column(db.Integer, db.ForeignKey('entidades.areas.id_area'), nullable=False)
    area = db.relationship('Area', back_populates='usuarios')
    
    id_jefe_directo = db.Column(db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'))
    jefe_directo = db.relationship('Usuario', remote_side=[id_usuario], back_populates='subordinados')
    subordinados = db.relationship('Usuario', back_populates='jefe_directo')
    
    # --- Preferencias de Usuario ---       
    preferencias = db.Column(JSONB, comment='Preferencias de UI, notificaciones, etc.') 

    # --- Relaciones Inversas (Conexiones al Negocio) ---
    clientes_creados = db.relationship('MaestroClientes', foreign_keys='MaestroClientes.id_usuario_creacion', back_populates='creador')
    clientes_asignados = db.relationship('MaestroClientes', foreign_keys='MaestroClientes.id_usuario_vendedor', back_populates='vendedor')

    # --- Auditoría ---
    fecha_creacion = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    fecha_modificacion = db.Column(db.DateTime, onupdate=func.now())

    def __repr__(self):
        return f'<Usuario {self.nombre_completo}>'
    
    # --- Métodos de Seguridad ---
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @hybrid_property
    def permisos(self):
        if not hasattr(self, '_permisos_cache'):
            permisos_totales = set()
            for rol in self.roles:
                for permiso in rol.permisos:
                    permisos_totales.add(permiso.nombre_permiso)
            self._permisos_cache = list(permisos_totales)
        return self._permisos_cache

    @permisos.expression
    def permisos(cls):
        return db.select(Permiso.nombre_permiso).join(Rol.permisos).join(cls.roles).where(cls.id_usuario == cls.id_usuario)

