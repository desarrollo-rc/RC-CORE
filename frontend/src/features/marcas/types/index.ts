// frontend/src/features/marcas/types/index.ts

export const AmbitoMarca = {
    VEHICULO: 'Vehículo',
    REPUESTO: 'Repuesto',
    MIXTO: 'Mixto',
} as const;
export type AmbitoMarca = typeof AmbitoMarca[keyof typeof AmbitoMarca];

export interface Marca {
    id_marca: number;
    codigo_marca: string;
    nombre_marca: string;
    ambito_marca: AmbitoMarca;
    descripcion?: string | null;
    tier_marca?: string | null;
    id_pais_origen?: number | null;
    url_imagen?: string | null;
    activo: boolean;
}

export type MarcaPayload = Omit<Marca, 'id_marca' | 'activo'>;

export type MarcaFormData = {
    codigo_marca: string;
    nombre_marca: string;
    ambito_marca: AmbitoMarca | string;
    descripcion: string;
};