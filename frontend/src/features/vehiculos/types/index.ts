// frontend/src/features/vehiculos/types/index.ts
import { AmbitoMarca } from "../../marcas/types";

export interface MarcaVehiculo {
    id_marca: number;
    codigo_marca: string;
    nombre_marca: string;
    activo: boolean;
    ambito_marca: AmbitoMarca | string;
}

export interface Modelo {
    id_modelo: number;
    codigo_modelo: string | null;
    nombre_modelo: string;
    id_marca: number;
    activo: boolean;
    marca: MarcaVehiculo; 
}

export interface VersionVehiculo {
    id_version: number;
    nombre_version: string;
    detalle_motor: string | null;
    cilindrada: number | null;
    transmision: string | null;
    traccion: string | null;
    combustible: string | null;
    anios_fabricacion: number[];
    activo: boolean;
    id_modelo: number; 
    modelo: Modelo; 
}

export type ModeloPayload = {
    codigo_modelo: string | null;
    nombre_modelo: string;
};
export type ModeloFormData = {
    codigo_modelo: string;
    nombre_modelo: string;
};

export type VersionPayload = Omit<VersionVehiculo, 'id_version' | 'activo' | 'modelo' | 'id_modelo'>;
export type VersionFormData = Omit<VersionVehiculo, 'id_version' | 'activo' | 'modelo' | 'id_modelo'>;