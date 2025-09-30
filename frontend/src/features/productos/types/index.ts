// frontend/src/features/productos/types/index.ts
import type { CodigoReferencia, CodigoTecnico } from "../../codigos-referencia/types";
import type { Marca } from "../../marcas/types";
import type { Calidad } from "../../calidades/types";
import type { Origen } from "../../origenes/types";
import type { Fabrica } from "../../fabricas/types";
import type { Proveedor } from "../../proveedores/types";

// Interfaz para la relación N-M con Proveedor
export interface ProductoProveedor {
    id_proveedor: number;
    costo_proveedor: number;
    codigo_producto_proveedor: string;
    es_proveedor_principal: boolean;
    proveedor?: Proveedor; // Para mostrar datos en la tabla
}

// Interfaz principal para el Producto (SKU)
export interface Producto {
    id_producto: number;
    sku: string;
    nombre_producto: string;
    costo_base: number;
    es_kit: boolean;
    activo: boolean;

    // Relaciones (objetos anidados en la respuesta)
    codigo_referencia: CodigoReferencia;
    marca: Marca;
    calidad: Calidad;
    origen: Origen;
    fabrica: Fabrica | null;
    proveedores: ProductoProveedor[];
    codigo_tecnico_sku: CodigoTecnico | null; // Puede ser nulo si no está asociado
}

// Payload para crear/actualizar un producto
export type ProductoPayload = {
    sku: string;
    nombre_producto: string;
    id_codigo_referencia: number;
    id_marca: number;
    id_calidad: number;
    id_origen: number;
    id_fabrica: number | null;
    costo_base: number;
    es_kit: boolean;
    proveedores: Omit<ProductoProveedor, 'proveedor'>[];
};

// Datos que maneja el formulario
export type ProveedorFormSection = {
    id_proveedor: string | null;
    costo_proveedor: number | '';
    codigo_producto_proveedor: string;
    es_proveedor_principal: boolean;
};

export type ProductoFormData = {
    sku: string;
    nombre_producto: string;
    id_codigo_referencia: string | null;
    id_marca: string | null;
    id_calidad: string | null;
    id_origen: string | null;
    id_fabrica: string | null;
    costo_base: number | '';
    es_kit: boolean;
    proveedores: ProveedorFormSection[];
};

export interface PaginatedProductosResponse {
    items: Producto[];
    pagination: {
        total: number;
        pages: number;
        page: number;
        per_page: number;
    };
}