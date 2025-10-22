// frontend/src/features/compras/types/index.ts

// Tipos para Compras Realizadas
export interface CompraRealizada {
  id: number;
  numero_compra: string;
  fecha_compra: string;
  proveedor: string;
  total: number;
  estado: 'pendiente' | 'procesada' | 'cancelada';
  items: ItemCompra[];
  created_at: string;
  updated_at: string;
}

export interface ItemCompra {
  id: number;
  producto_id: number;
  codigo_producto: string;
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Tipos para el Cotizador
export interface CotizacionItem {
  numero_articulo: string;
  descripcion_articulo: string;
  nombre_extranjero: string;
  nombre_chino: string;
  marca: string;
  modelo: string;
  modelo_chino: string;
  volumen_unidad_compra: number;
  oem_part: string;
  pedido: number;
  fob: number;
  last_fob: number;
  // Campos calculados
  subtotal?: number;
  observaciones?: string;
  // Campo para imágenes (hasta 5 imágenes)
  imagenes?: string[];
}

export interface CotizacionData {
  items: CotizacionItem[];
  total_items: number;
  total_estimado?: number;
}

export interface ExcelUploadResult {
  success: boolean;
  data?: CotizacionData;
  error?: string;
  filename?: string;
  uploaded_at?: string;
}

// Tipos para formularios
export interface CotizadorFormData {
  archivo: File | null;
  nombre_cotizacion?: string;
  observaciones?: string;
}

// Tipos para filtros y búsquedas
export interface CompraFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  proveedor?: string;
  estado?: string;
  numero_compra?: string;
}

export interface CotizadorFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  nombre_cotizacion?: string;
}
