// frontend/src/features/consultas/types/index.ts

export interface Consulta {
    id_consulta: number;
    codigo_consulta: string;
    nombre: string;
    descripcion?: string;
    categoria?: string;
    tags?: string[];
    query_sql: string;
    parametros_defecto?: Record<string, any>;
    version: number;
    activo: boolean;
    tipo: 'LECTURA' | 'ESCRITURA' | 'PROCESO';
    bdd_source: 'RC_CORE' | 'SAPB1' | 'OMSRC';
    fecha_creacion: string;
    fecha_modificacion?: string;
}

export type ConsultaCreate = Omit<Consulta, 'id_consulta' | 'version' | 'fecha_creacion' | 'fecha_modificacion'>;
export type ConsultaUpdate = Omit<ConsultaCreate, 'codigo_consulta'>;