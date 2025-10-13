# backend/app/api/v1/services/usuario_b2b_service.py
from app.models.entidades.usuarios_b2b import UsuarioB2B
from app.api.v1.utils.errors import RelatedResourceNotFoundError, BusinessRuleError
from app.extensions import db

class UsuarioB2BService:
    @staticmethod
    def get_all_usuarios_b2b():
        return UsuarioB2B.query.all()

    @staticmethod
    def get_all_usuarios_b2b_active():
        return UsuarioB2B.query.filter_by(activo=True).all()
    
    @staticmethod
    def get_usuario_b2b_by_id(usuario_id):
        usuario = UsuarioB2B.query.get(usuario_id)
        if not usuario:
            raise RelatedResourceNotFoundError(f"Usuario B2B con ID {usuario_id} no encontrado.")
        return usuario

    @staticmethod
    def create_usuario_b2b(data):
        # Extraer la contraseña del data antes de crear el usuario
        password = data.pop('password', None)
        
        nuevo_usuario = UsuarioB2B(**data)
        
        # Establecer la contraseña usando el método seguro
        if password:
            nuevo_usuario.set_password(password)
        
        db.session.add(nuevo_usuario)
        db.session.commit()
        return nuevo_usuario
    
    @staticmethod
    def update_usuario_b2b(usuario_id, data):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        for field, value in data.items():
            setattr(usuario, field, value)
        db.session.commit()
        return usuario
    
    @staticmethod
    def deactivate_usuario_b2b(usuario_id):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        usuario.activo = False
        db.session.commit()
        return usuario
    
    @staticmethod
    def activate_usuario_b2b(usuario_id):
        usuario = UsuarioB2BService.get_usuario_b2b_by_id(usuario_id)
        usuario.activo = True
        db.session.commit()
        return usuario
    
    @staticmethod
    def get_usuarios_b2b_by_cliente(cliente_id):
        """Obtiene todos los usuarios B2B activos de un cliente específico"""
        return UsuarioB2B.query.filter_by(id_cliente=cliente_id, activo=True).all()
    
    @staticmethod
    def sugerir_nombre_usuario(cliente_id):
        """
        Sugiere un nombre de usuario basado en los usuarios existentes del cliente.
        Patrón: [prefijo][número_correlativo]
        """
        usuarios_existentes = UsuarioB2BService.get_usuarios_b2b_by_cliente(cliente_id)
        
        if not usuarios_existentes:
            # Si no hay usuarios, sugerir el primero
            return "usuario1"
        
        # Extraer patrones de nombres existentes
        patrones = {}
        for usuario in usuarios_existentes:
            usuario_nombre = usuario.usuario.lower()
            
            # Buscar patrones como "autorep1", "autorep2", etc.
            import re
            match = re.match(r'^([a-zA-Z]+)(\d+)$', usuario_nombre)
            if match:
                prefijo = match.group(1)
                numero = int(match.group(2))
                if prefijo not in patrones:
                    patrones[prefijo] = []
                patrones[prefijo].append(numero)
        
        # Encontrar el prefijo más común
        if patrones:
            prefijo_mas_comun = max(patrones.keys(), key=lambda k: len(patrones[k]))
            numeros_usados = sorted(patrones[prefijo_mas_comun])
            
            # Encontrar el siguiente número disponible
            siguiente_numero = 1
            for num in numeros_usados:
                if num == siguiente_numero:
                    siguiente_numero += 1
                else:
                    break
            
            return f"{prefijo_mas_comun}{siguiente_numero}"
        else:
            # Si no hay patrones claros, usar un patrón genérico
            return "usuario1"
    