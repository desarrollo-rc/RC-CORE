// frontend/src/features/clientes/types/index.ts

// Tipos para las entidades anidadas que no hemos creado antes
export interface Contacto {
    id_contacto?: number;
    nombre: string;
    cargo: string;
    email: string;
    telefono: string;
    es_principal: boolean;
}

export interface Direccion {
    id_direccion?: number;
    calle: string;
    numero: string;
    id_comuna: number | null;
    id_ciudad: number | null;
    id_region: number | null;
    codigo_postal: string;
    es_facturacion: boolean;
    es_despacho: boolean;
}

// Tipo de Dirección para el PAYLOAD de la API (solo los campos que el backend espera)
export type DireccionPayload = Omit<Direccion, 'id_ciudad' | 'id_region'>;

// Interfaz principal del Cliente (lo que recibimos de la API)
export interface Cliente {
    id_cliente: number;
    codigo_cliente: string;
    rut_cliente: string;
    nombre_cliente: string;
    giro_economico: string | null;
    descuento_base: number;
    linea_credito: number;
    b2b_habilitado: boolean;
    activo: boolean;
    // --- Relaciones anidadas ---
    tipo_cliente: { id_tipo_cliente: number; nombre_tipo_cliente: string; };
    segmento_cliente: { id_segmento_cliente: number; nombre_segmento_cliente: string; };
    tipo_negocio: { id_tipo_negocio: number; nombre_tipo_negocio: string; };
    lista_precios: { id_lista_precios: number; nombre_lista_precios: string; };
    condicion_pago: { id_condicion_pago: number; nombre_condicion_pago: string; };
    vendedor: { id_vendedor: number; usuario: { nombre_completo: string } } | null;
    empresas: { id_empresa: number; nombre_empresa: string; }[];
    contactos: Contacto[];
    direcciones: Direccion[];
    marcas_afinidad: { id_marca: number; nombre_marca: string; }[];
    categorias_afinidad: { id_categoria: number; nombre_categoria: string; }[];
}

// Payload para la API
export type ClientePayload = {
    codigo_cliente: string;
    rut_cliente: string;
    nombre_cliente: string;
    giro_economico: string | null;
    descuento_base: number;
    linea_credito: number;
    b2b_habilitado: boolean;
    
    // Usamos los códigos para crear/actualizar
    codigo_tipo_cliente: string;
    codigo_segmento_cliente: string;
    codigo_tipo_negocio: string;
    codigo_lista_precios: string;
    codigo_condicion_pago: string;
    codigos_empresa: string[];

    id_vendedor: number | null;
    
    // Listas completas de objetos para las relaciones
    contactos: Contacto[];
    direcciones: DireccionPayload[];
    
    // Listas de IDs para las afinidades
    marcas_afinidad_ids?: number[];
    categorias_afinidad_ids?: number[];
};

// Datos que maneja el formulario de Mantine
export type ClienteFormData = {
    codigo_cliente: string;
    rut_cliente: string;
    nombre_cliente: string;
    giro_economico: string;
    descuento_base: number | '';
    linea_credito: number | '';
    b2b_habilitado: boolean;
    
    // IDs como strings para los Selects
    id_tipo_cliente: string | null;
    id_segmento_cliente: string | null;
    id_tipo_negocio: string | null;
    id_lista_precios: string | null;
    id_condicion_pago: string | null;
    id_vendedor: string | null;
    ids_empresa: string[];

    contactos: Contacto[];
    direcciones: Direccion[];
    
    // Para el switch y los MultiSelects de afinidad
    definir_afinidad: boolean;
    marcas_afinidad_ids: string[];
    categorias_afinidad_ids: string[];
};