// frontend/src/features/origenes/types/index.ts
import type { Pais } from '../../paises/types';

export interface Origen {
    id_origen: number;
    id_pais: number;
    pais: Pais;
}

export type OrigenPayload = {
    id_pais: number;
};

export type OrigenFormData = {
    id_pais: string | null;
};