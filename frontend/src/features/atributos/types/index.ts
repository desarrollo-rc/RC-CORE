// src/features/productos/atributos/types/index.ts

export interface ValorAtributo {
    id_valor: number;
    codigo: string;
    valor: string;
    activo: boolean;
}

export interface Atributo {
    id_atributo: number;
    codigo: string;
    nombre: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string | null;
    valores: ValorAtributo[]; // <-- AÑADIR ESTA LÍNEA
}

export type AtributoPayload = Pick<Atributo, 'codigo' | 'nombre'>;

export type AtributoFormData = {
    codigo: string;
    nombre: string;
};

export type ValorAtributoPayload = Pick<ValorAtributo, 'codigo' | 'valor'>;

export type ValorAtributoFormData = {
    codigo: string;
    valor: string;
};