// src/features/productos/atributos/types/index.ts

export interface Atributo {
    id_atributo: number;
    nombre: string;
    activo: boolean;
    fecha_creacion: string;
    fecha_modificacion: string | null;
}

export type AtributoPayload = Pick<Atributo, 'nombre'>;

export type AtributoFormData = {
    nombre: string;
};