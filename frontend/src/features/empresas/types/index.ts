// frontend/src/features/empresas/types/index.ts

export interface Empresa {
    id_empresa: number;
    codigo_empresa: string;
    nombre_empresa: string;
    rut_empresa: string;
    activo: boolean;
}

export type EmpresaPayload = Omit<Empresa, 'id_empresa' | 'activo'>;

export type EmpresaFormData = {
    codigo_empresa: string;
    nombre_empresa: string;
    rut_empresa: string;
};