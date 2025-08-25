# backend/app/api/v1/routes/contacto_routes.py
from flask import Blueprint, request, jsonify
from app.api.v1.schemas.contacto_schemas import ContactoSchema, UpdateContactoSchema
from app.api.v1.services.contacto_service import ContactoService
from app.api.v1.utils.errors import BusinessRuleError
from marshmallow import ValidationError
from flask_jwt_extended import jwt_required
from werkzeug.exceptions import NotFound

contactos_bp = Blueprint('contactos_bp', __name__)

schema_single = ContactoSchema()
schema_update = UpdateContactoSchema()

@contactos_bp.route('/', methods=['POST'])
@jwt_required()
def create_contacto():
    try:
        data = schema_single.load(request.get_json())
        nuevo_contacto = ContactoService.create_contacto(data)
        return schema_single.dump(nuevo_contacto), 201
    except ValidationError as err:
        return jsonify(err.messages), 422
    except BusinessRuleError as e:
        return jsonify({"error": str(e)}), e.status_code

@contactos_bp.route('/', methods=['GET'])
@jwt_required()
def get_contactos():
    contactos = ContactoService.get_contactos()
    return jsonify([schema_single.dump(contacto) for contacto in contactos]), 200

@contactos_bp.route('/<int:contacto_id>', methods=['GET'])
@jwt_required()
def get_contacto(contacto_id):
    try:
        contacto = ContactoService.get_contacto_by_id(contacto_id)
        return schema_single.dump(contacto), 200
    except NotFound:
        return jsonify({"error": f"Contacto con ID {contacto_id} no encontrado."}), 404

@contactos_bp.route('/<int:contacto_id>', methods=['PUT'])
@jwt_required()
def update_contacto(contacto_id):
    try:
        data = schema_update.load(request.get_json())
        contacto_actualizado = ContactoService.update_contacto(contacto_id, data)
        return schema_single.dump(contacto_actualizado), 200
    except (ValidationError, BusinessRuleError, NotFound) as e:
        status_code = 422 if isinstance(e, ValidationError) else (409 if isinstance(e, BusinessRuleError) else 404)
        error_message = e.messages if isinstance(e, ValidationError) else str(e)
        return jsonify({"error": error_message}), status_code

@contactos_bp.route('/<int:contacto_id>', methods=['DELETE'])
@jwt_required()
def delete_contacto(contacto_id):
    try:
        ContactoService.delete_contacto(contacto_id)
        return '', 204
    except NotFound:
        return jsonify({"error": f"Contacto con ID {contacto_id} no encontrado."}), 404