// frontend/src/features/condiciones-pago/types/index.ts

export interface CondicionPago {
    id_condicion_pago: number;
    codigo_condicion_pago: string;
    nombre_condicion_pago: string;
    descripcion_condicion_pago: string | null;
    dias_credito: number;
    ambito: string;
    activo: boolean;
}

export type CondicionPagoPayload = Omit<CondicionPago, 'id_condicion_pago' | 'activo'>;

export type CondicionPagoFormData = {
    codigo_condicion_pago: string;
    nombre_condicion_pago: string;
    descripcion_condicion_pago: string;
    dias_credito: number | '';
    ambito: string;
};