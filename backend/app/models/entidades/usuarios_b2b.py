from app.extensions import db
from sqlalchemy.orm import validates
from werkzeug.security import generate_password_hash, check_password_hash
from .entidades_auxiliares import MixinAuditoria


class UsuarioB2B(db.Model, MixinAuditoria):
    __tablename__ = 'usuarios_b2b'
    __table_args__ = {'schema': 'entidades'}

    id_usuario_b2b = db.Column(db.Integer, primary_key=True)
    nombre_completo = db.Column(db.String(150), nullable=False)
    usuario = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    
    id_cliente = db.Column(db.Integer, db.ForeignKey('entidades.maestro_clientes.id_cliente'), nullable=False)
    cliente = db.relationship('MaestroClientes', back_populates='usuarios_b2b')

    @validates('usuario', 'email', 'nombre_completo')
    def validate_fields(self, key, value):
        if not value:
            raise ValueError(f'El campo {key} es requerido')
        cleaned = value.strip()
        if key in ('usuario', 'email'):
            return cleaned.lower()
        return cleaned

    def __repr__(self):
        return f'<UsuarioB2B {self.email}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)