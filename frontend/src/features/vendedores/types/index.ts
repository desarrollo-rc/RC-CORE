// frontend/src/features/vendedores/types/index.ts
import type { Usuario } from "../../usuarios/types";

export interface Vendedor {
    id_vendedor: number;
    codigo_vendedor_sap: string | null;
    id_usuario: number;
    usuario: Pick<Usuario, 'id_usuario' | 'nombre_completo' | 'email'>;
    activo: boolean;
}

//payload
export type VendedorPayload = {
    id_usuario: number;
    codigo_vendedor_sap: string | null;
}

// formulario
export type VendedorFormData = {
    id_usuario: string | null;
    codigo_vendedor_sap: string;
}