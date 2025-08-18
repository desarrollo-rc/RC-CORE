# backend/app/api/v1/services/cliente_service.py
from app.models.entidades import (
    MaestroClientes, Contacto, Direccion, TipoCliente, SegmentoCliente,
    ListaPrecios, CondicionPago, Empresa
)
from app import db
from sqlalchemy.exc import IntegrityError
from app.api.v1.utils.errors import ResourceConflictError, RelatedResourceNotFoundError, BusinessRuleError

class ClienteService:

    @staticmethod
    def create_customer(data, user_id):
        """
        Orquesta la creación de un nuevo cliente.
        Lanza excepciones específicas de negocio en caso de error.
        """
        # La lógica principal se delega a métodos privados
        ClienteService._validate_uniqueness(data)
        related_entities = ClienteService._resolve_related_entities(data)
        
        new_customer = ClienteService._build_customer_instance(data, user_id, related_entities)

        try:
            db.session.add(new_customer)
            db.session.commit()
            return new_customer
        except Exception as e:
            db.session.rollback()
            # En un entorno real, aquí se registraría el error 'e' en un log
            raise Exception("Error inesperado en la base de datos.") # Se convierte en un error 500 genérico
    
    @staticmethod
    def _validate_uniqueness(data):
        """Valida que el RUT y el código de cliente no existan en la base de datos."""
        if MaestroClientes.query.filter_by(rut_cliente=data['rut_cliente']).first():
            raise ResourceConflictError(f"El RUT '{data['rut_cliente']}' ya está registrado.")
        if MaestroClientes.query.filter_by(codigo_cliente=data['codigo_cliente']).first():
            raise ResourceConflictError(f"El código de cliente '{data['codigo_cliente']}' ya está registrado.")

    @staticmethod
    def _resolve_related_entities(data):
        """Busca todas las entidades relacionadas y las devuelve en un diccionario."""
        entities = {
            'tipo_cliente': TipoCliente.get_by_codigo(data['codigo_tipo_cliente']),
            'segmento_cliente': SegmentoCliente.get_by_codigo(data['codigo_segmento_cliente']),
            'lista_precios': ListaPrecios.get_by_codigo(data['codigo_lista_precios']),
            'condicion_pago': CondicionPago.get_by_codigo(data['codigo_condicion_pago']),
            'empresa': Empresa.get_by_codigo(data['codigo_empresa']),
        }
        missing = [name for name, entity in entities.items() if not entity]
        if missing:
            raise RelatedResourceNotFoundError(f"No se encontraron las siguientes entidades relacionadas: {', '.join(missing)}")
        return entities
    
    @staticmethod
    def _build_customer_instance(data, user_id, entities):
        """Construye una instancia de MaestroClientes con los datos y entidades relacionadas."""
        new_customer = MaestroClientes(
            codigo_cliente=data['codigo_cliente'],
            rut_cliente=data['rut_cliente'],
            nombre_cliente=data['nombre_cliente'],
            giro_economico=data.get('giro_economico'),
            descuento_base=data.get('descuento_base'),
            linea_credito=data.get('linea_credito'),
            b2b_habilitado=data.get('b2b_habilitado', False),
            id_tipo_cliente=entities['tipo_cliente'].id_tipo_cliente,
            id_segmento_cliente=entities['segmento_cliente'].id_segmento_cliente,
            id_lista_precios=entities['lista_precios'].id_lista_precios,
            id_condicion_pago=entities['condicion_pago'].id_condicion_pago,
            id_empresa=entities['empresa'].id_empresa,
            id_usuario_creacion=user_id,
            id_usuario_vendedor=user_id
        )

        new_customer.contactos = [Contacto(**c_data) for c_data in data['contactos']]
        new_customer.direcciones = [Direccion(**d_data) for d_data in data['direcciones']]
        
        return new_customer
    
    @staticmethod
    def get_all_customers(page, per_page):
        """
        Obtener una lista paginada de todos los clientes
        """
        paginated_customers = MaestroClientes.query.filter_by(activo=True).paginate(
            page=page, per_page=per_page, error_out=False
        )
        return paginated_customers
    
    @staticmethod
    def get_customer_by_id(customer_id):
        """
        Busca un cliente por su ID primario.
        """
        return MaestroClientes.query.get_or_404(customer_id)

    @staticmethod
    def update_customer(customer_id, data, user_id):
        """
        Actualiza un Cliente existente, manejando actualizaciones parciales y de relaciones.
        """
        customer = MaestroClientes.query.get_or_404(customer_id)

        ClienteService._validate_uniqueness_on_update(data, customer)
        ClienteService._update_simple_fields(data, customer)
        ClienteService._update_foreign_keys(data, customer)
        ClienteService._sync_contacts(data.get('contactos', []), customer)
        ClienteService._sync_direcciones(data.get('direcciones', []), customer)

        try:
            db.session.commit()
            return customer
        except Exception as e:
            db.session.rollback()
            raise Exception("Error inesperado en la base de datos.")

    @staticmethod
    def _validate_uniqueness_on_update(data, customer):
        """Valida que los campos únicos no entren en conflicto con OTROS clientes."""
        if 'rut_cliente' in data and data['rut_cliente'] != customer.rut_cliente:
            if MaestroClientes.query.filter(MaestroClientes.rut_cliente == data['rut_cliente'], MaestroClientes.id_cliente != customer.id_cliente).first():
                raise ResourceConflictError(f"El RUT '{data['rut_cliente']}' ya está en uso por otro cliente.")
        if 'codigo_cliente' in data and data['codigo_cliente'] != customer.codigo_cliente:
            if MaestroClientes.query.filter(MaestroClientes.codigo_cliente == data['codigo_cliente'], MaestroClientes.id_cliente != customer.id_cliente).first():
                raise ResourceConflictError(f"El código '{data['codigo_cliente']}' ya está en uso por otro cliente.")

    @staticmethod
    def _update_simple_fields(data, customer):
        """
        Actualiza los campos directos y simples del modelo principal
        """
        for key in ['nombre_cliente', 'giro_economico', 'descuento_base', 'linea_credito', 'b2b_habilitado']:
            if key in data:
                setattr(customer, key, data[key])

    @staticmethod
    def _update_foreign_keys(data, customer):
        """
        Actualiza las llaves foráneas si se proveen nuevos códigos
        """
        key_map = {
            'codigo_tipo_cliente': ('tipo_cliente', TipoCliente, 'id_tipo_cliente'),
            'codigo_segmento_cliente': ('segmento_cliente', SegmentoCliente, 'id_segmento_cliente'),
            'codigo_lista_precios': ('lista_precios', ListaPrecios, 'id_lista_precios'),
            'codigo_condicion_pago': ('condicion_pago', CondicionPago, 'id_condicion_pago'),
            'codigo_empresa': ('empresa', Empresa, 'id_empresa'),
        }
        for code_key, (relation_name, Model, id_key) in key_map.items():
            if code_key in data:
                new_entity = Model.get_by_codigo(data[code_key])
                if not new_entity:
                    raise RelatedResourceNotFoundError(f"No se encontró la entidad para {code_key} con valor '{data[code_key]}'")
                setattr(customer, id_key, new_entity.id)
    
    @staticmethod
    def _sync_contacts(contacts_data, customer):
        """Sincroniza la colección de contactos."""
        ClienteService._sync_collection(contacts_data, customer.contactos, Contacto, 'id_contacto')

    @staticmethod
    def _sync_direcciones(direcciones_data, customer):
        """Sincroniza la colección de direcciones."""
        ClienteService._sync_collection(direcciones_data, customer.direcciones, Direccion, 'id_direccion')

    @staticmethod
    def _sync_collection(data_list, db_collection, Model, id_field_name):
        """
        Método genérico para sincronizar una colección.
        Identifica items para crear, actualizar y eliminar.
        """
        data_ids = {item[id_field_name] for item in data_list if id_field_name in item}
        db_items_map = {getattr(item, id_field_name): item for item in db_collection}
        
        # Eliminar items que ya no están en la lista de datos
        ids_to_delete = set(db_items_map.keys()) - data_ids
        for item_id in ids_to_delete:
            db.session.delete(db_items_map[item_id])
            
        # Actualizar items existentes y crear nuevos
        for item_data in data_list:
            item_id = item_data.get(id_field_name)
            if item_id is None:
                # Crear nuevo item
                new_item = Model(**item_data)
                db_collection.append(new_item)
            elif item_id in db_items_map:
                # Actualizar item existente
                existing_item = db_items_map[item_id]
                for key, value in item_data.items():
                    setattr(existing_item, key, value)
        