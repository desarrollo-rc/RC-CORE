# backend/app/api/v1/utils/errors.py

class BusinessRuleError(Exception):
    """Excepción base para errores de reglas de negocio."""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.status_code = status_code

class ResourceConflictError(BusinessRuleError):
    """Lanzada cuando un recurso ya existe (ej. RUT duplicado)."""
    def __init__(self, message):
        super().__init__(message, status_code=409)

class RelatedResourceNotFoundError(BusinessRuleError):
    """Lanzada cuando una entidad relacionada no se encuentra."""
    def __init__(self, message):
        super().__init__(message, status_code=404)

# Alias para compatibilidad con código existente
NotFoundError = RelatedResourceNotFoundError
BusinessLogicError = BusinessRuleError