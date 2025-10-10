# backend/app/api/v1/services/cliente_service.py
from app.models.entidades import (
    MaestroClientes, Contacto, Direccion, TipoCliente, SegmentoCliente,
    ListaPrecios, CondicionPago, Empresa, Usuario, TipoNegocio
)
from app.models.productos import Marca, Categoria
from app.models.negocio import Vendedor
from app.extensions import db
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

        if data.get('id_vendedor') is not None:
            # Coerce to int if it comes as string
            try:
                data['id_vendedor'] = int(data['id_vendedor'])
            except (TypeError, ValueError):
                pass
            if not Vendedor.query.get(data['id_vendedor']):
                raise RelatedResourceNotFoundError(f"El vendedor con ID {data['id_vendedor']} no existe.")
        
        new_customer = ClienteService._build_customer_instance(data, user_id, related_entities)
        ClienteService._sync_afinidades(data, new_customer)


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
            'tipo_negocio': TipoNegocio.get_by_codigo(data['codigo_tipo_negocio']),
            'lista_precios': ListaPrecios.get_by_codigo(data['codigo_lista_precios']),
            'condicion_pago': CondicionPago.get_by_codigo(data['codigo_condicion_pago']),
        }
        empresas = []
        for codigo in data['codigos_empresa']:
            empresa = Empresa.get_by_codigo(codigo)
            if not empresa:
                raise RelatedResourceNotFoundError(f"La empresa con código '{codigo}' no fue encontrada.")
            empresas.append(empresa)
        entities['empresas'] = empresas

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
            id_tipo_negocio=entities['tipo_negocio'].id_tipo_negocio,
            id_lista_precios=entities['lista_precios'].id_lista_precios,
            id_condicion_pago=entities['condicion_pago'].id_condicion_pago,
            id_usuario_creacion=user_id,
            id_vendedor=data.get('id_vendedor')
        )

        new_customer.empresas = entities['empresas']

        # Crear contactos y direcciones solo si existen en los datos
        new_customer.contactos = [Contacto(**c_data) for c_data in data.get('contactos', [])]
        new_customer.direcciones = [Direccion(**d_data) for d_data in data.get('direcciones', [])]
        
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
        if 'id_vendedor' in data:
            vendedor_id = data.get('id_vendedor')
            # Coerce to int if it comes as string
            try:
                vendedor_id = int(vendedor_id) if vendedor_id is not None else None
            except (TypeError, ValueError):
                pass
            print(f"DEBUG: Actualizando vendedor - ID recibido: {vendedor_id}")
            if vendedor_id is not None:
                if not Vendedor.query.get(vendedor_id):
                    raise RelatedResourceNotFoundError(f"El vendedor con ID {vendedor_id} no existe.")
            customer.id_vendedor = vendedor_id
            print(f"DEBUG: Vendedor asignado al cliente: {customer.id_vendedor}")

        if 'codigos_empresa' in data:
            empresas = []
            for codigo in data['codigos_empresa']:
                empresa = Empresa.get_by_codigo(codigo)
                if not empresa:
                    raise RelatedResourceNotFoundError(f"La empresa con código '{codigo}' no fue encontrada.")
                empresas.append(empresa)
            customer.empresas = empresas

        ClienteService._sync_afinidades(data, customer)

        if 'contactos' in data:
            ClienteService._sync_contacts(data.get('contactos', []), customer)
        
        if 'direcciones' in data:
            ClienteService._sync_direcciones(data.get('direcciones', []), customer)

        try:
            print(f"DEBUG: Antes del commit - Vendedor del cliente: {customer.id_vendedor}")
            db.session.commit()
            print(f"DEBUG: Después del commit - Vendedor del cliente: {customer.id_vendedor}")
            return customer
        except Exception as e:
            db.session.rollback()
            print(f"DEBUG: Error en commit: {e}")
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
            'codigo_tipo_negocio': ('tipo_negocio', TipoNegocio, 'id_tipo_negocio'),
            'codigo_lista_precios': ('lista_precios', ListaPrecios, 'id_lista_precios'),
            'codigo_condicion_pago': ('condicion_pago', CondicionPago, 'id_condicion_pago'),
        }
        for code_key, (relation_name, Model, id_key) in key_map.items():
            if code_key in data:
                if hasattr(Model, 'get_by_codigo'):
                    new_entity = Model.get_by_codigo(data[code_key])
                else: # Fallback para modelos sin get_by_codigo como TipoNegocio
                    new_entity = Model.query.filter_by(**{'codigo_' + relation_name: data[code_key].upper().strip()}).first()

                if not new_entity:
                    raise RelatedResourceNotFoundError(f"No se encontró la entidad para {code_key} con valor '{data[code_key]}'")
                setattr(customer, id_key, getattr(new_entity, id_key))
    
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
    
    @staticmethod
    def deactivate_customer(customer_id, data):
        """
        Desactiva un cliente y registra el motivo del bloqueo.
        """
        customer = ClienteService.get_customer_by_id(customer_id)
        customer.activo = False
        customer.motivo_bloqueo = data['motivo_bloqueo']
        db.session.commit()
        return customer

    @staticmethod
    def activate_customer(customer_id):
        """
        Reactiva un cliente y limpia el motivo del bloqueo.
        """
        customer = ClienteService.get_customer_by_id(customer_id)
        customer.activo = True
        customer.motivo_bloqueo = None
        db.session.commit()
        return customer
    
    @staticmethod
    def get_clientes_para_seleccion_libre():
        """
        Obtiene todos los clientes con información extendida para selección en instalaciones.
        Incluye: datos B2B, vendedor, contacto principal.
        """
        from app.models.entidades.usuarios_b2b import UsuarioB2B
        from sqlalchemy import case
        
        # Query con LEFT JOIN a usuarios_b2b para ver si tiene usuarios
        clientes = MaestroClientes.query.outerjoin(
            UsuarioB2B, MaestroClientes.id_cliente == UsuarioB2B.id_cliente
        ).all()
        
        result = []
        for cliente in clientes:
            # Verificar si tiene usuarios B2B
            tiene_usuarios = len(cliente.usuarios_b2b) > 0
            es_b2b = cliente.b2b_habilitado
            
            contacto_principal = cliente.contacto_principal
            
            cliente_dict = {
                'value': cliente.id_cliente,
                'label': f"{cliente.nombre_cliente} - {cliente.rut_cliente}",
                'es_b2b': es_b2b,
                'tiene_usuarios': tiene_usuarios,
                'b2b_habilitado': cliente.b2b_habilitado,
                'vendedor_id': cliente.id_vendedor,
                'vendedor_nombre': cliente.vendedor.nombre_completo if cliente.vendedor else None,
                'rut': cliente.rut_cliente,
                'contacto': contacto_principal.nombre if contacto_principal else None,
                'num_contacto': contacto_principal.telefono if contacto_principal else None,
                'activo': cliente.activo
            }
            
            result.append(cliente_dict)
        
        # Ordenar por nombre
        result.sort(key=lambda x: x['label'])
        
        return result

    @staticmethod
    def _sync_afinidades(data, customer):
        """Sincroniza las afinidades de marcas y categorías para un cliente."""
        
        if 'marcas_afinidad_ids' in data:
            marcas_ids = data['marcas_afinidad_ids']
            customer.marcas_afinidad.clear()
            if marcas_ids:
                marcas = Marca.query.filter(Marca.id_marca.in_(marcas_ids)).all()
                if len(marcas) != len(marcas_ids):
                    raise RelatedResourceNotFoundError("Una o más marcas de afinidad no fueron encontradas.")
                customer.marcas_afinidad = marcas

        if 'categorias_afinidad_ids' in data:
            categorias_ids = data['categorias_afinidad_ids']
            customer.categorias_afinidad.clear()
            if categorias_ids:
                categorias = Categoria.query.filter(Categoria.id_categoria.in_(categorias_ids)).all()
                if len(categorias) != len(categorias_ids):
                    raise RelatedResourceNotFoundError("Una o más categorías de afinidad no fueron encontradas.")
                customer.categorias_afinidad = categorias