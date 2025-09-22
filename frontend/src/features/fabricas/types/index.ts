// frontend/src/features/fabricas/types/index.ts

export interface Fabrica {
    id_fabrica: number;
    nombre_fabrica: string;
    id_pais: number;
    activo: boolean;
}

export type FabricaPayload = Omit<Fabrica, 'id_fabrica' | 'activo'>;

export type FabricaFormData = {
    nombre_fabrica: string;
    id_pais: string | null;
};