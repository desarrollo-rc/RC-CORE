# backend/app/models/entidades/roles.py
from app.extensions import db

roles_permisos = db.Table('roles_permisos',
    db.Column('id_rol', db.Integer, db.ForeignKey('entidades.roles.id_rol'), primary_key=True),
    db.Column('id_permiso', db.Integer, db.ForeignKey('entidades.permisos.id_permiso'), primary_key=True),
    schema='entidades'
)

usuarios_roles = db.Table('usuarios_roles',
    db.Column('id_usuario', db.Integer, db.ForeignKey('entidades.usuarios.id_usuario'), primary_key=True),
    db.Column('id_rol', db.Integer, db.ForeignKey('entidades.roles.id_rol'), primary_key=True),
    schema='entidades'
)

class Rol(db.Model):
    __tablename__ = 'roles'
    __table_args__ = {'schema': 'entidades'}

    id_rol = db.Column(db.Integer, primary_key=True)
    nombre_rol = db.Column(db.String(100), unique=True, nullable=False)
    descripcion_rol = db.Column(db.String(255), nullable=True)

    usuarios = db.relationship('Usuario', secondary=usuarios_roles, back_populates='roles')

    permisos = db.relationship('Permiso', secondary=roles_permisos, back_populates='roles')

    def __repr__(self):
        return f'<Rol {self.nombre_rol}>'

class Permiso(db.Model):
    __tablename__ = 'permisos'
    __table_args__ = {'schema': 'entidades'}

    id_permiso = db.Column(db.Integer, primary_key=True)
    nombre_permiso = db.Column(db.String(100), unique=True, nullable=False) # Ej: cliente:crear, producto:editar_precio, etc.
    descripcion_permiso = db.Column(db.String(255), nullable=True)

    roles = db.relationship('Rol', secondary=roles_permisos, back_populates='permisos')

    def __repr__(self):
        return f'<Permiso {self.nombre_permiso}>'