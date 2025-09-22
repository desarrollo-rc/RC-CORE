// frontend/src/features/paises/types/index.ts
export interface Pais {
    id_pais: number;
    nombre_pais: string;
}

export type PaisPayload = Omit<Pais, 'id_pais'>;

export type PaisFormData = {
    nombre_pais: string;
};