// src/features/categorizacion/types/index.ts

export interface Division {
    id_division: number;
    codigo_division: string;
    nombre_division: string;
    activo: boolean;
}

// Tipos para Categoría
export interface Categoria {
    id_categoria: number;
    codigo_categoria: string;
    nombre_categoria: string;
    id_division: number;
    activo: boolean;
}

export type CategoriaPayload = Pick<Categoria, 'codigo_categoria' | 'nombre_categoria' | 'id_division'>;

export type CategoriaFormData = {
    codigo_categoria: string;
    nombre_categoria: string;
};

// --- Tipos para SubCategoría ---
export interface SubCategoria {
    id_sub_categoria: number;
    codigo_sub_categoria: string;
    nombre_sub_categoria: string;
    id_categoria: number;
    activo: boolean;
}
export type SubCategoriaPayload = Pick<SubCategoria, 'codigo_sub_categoria' | 'nombre_sub_categoria' | 'id_categoria'>;
export type SubCategoriaFormData = Pick<SubCategoria, 'codigo_sub_categoria' | 'nombre_sub_categoria'>;

// --- Tipos para Detalle Subcategoría ---
export interface DetSubCategoria {
    id_det_sub_categoria: number;
    codigo_det_sub_categoria: string;
    nombre_det_sub_categoria: string;
    id_sub_categoria: number;
    activo: boolean;
}
export type DetSubCategoriaPayload = Pick<DetSubCategoria, 'codigo_det_sub_categoria' | 'nombre_det_sub_categoria' | 'id_sub_categoria'>;
export type DetSubCategoriaFormData = Pick<DetSubCategoria, 'codigo_det_sub_categoria' | 'nombre_det_sub_categoria'>;