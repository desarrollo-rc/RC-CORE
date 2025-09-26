// frontend/src/features/listas-precios/types/index.ts

export interface ListaPrecios {
    id_lista_precios: number;
    codigo_lista_precios: string;
    nombre_lista_precios: string;
    descripcion_lista_precios: string | null;
    moneda: string;
    activo: boolean;
}

export type ListaPreciosPayload = Omit<ListaPrecios, 'id_lista_precios' | 'activo'>;

export type ListaPreciosFormData = {
    codigo_lista_precios: string;
    nombre_lista_precios: string;
    descripcion_lista_precios: string;
    moneda: string;
};