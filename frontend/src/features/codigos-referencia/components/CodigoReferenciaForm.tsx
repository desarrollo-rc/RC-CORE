// frontend/src/features/codigos-referencia/components/CodigoReferenciaForm.tsx
import { TextInput, Button, Stack, Textarea, Select, Group } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect, useState, useMemo } from 'react';
import type { CodigoReferenciaFormData } from '../types';
import type { Division, Categoria, SubCategoria, DetSubCategoria } from '../../categorizacion/types';
import type { ClasificacionEstadistica } from '../../clasificaciones-estadistica/types';
import type { ClasificacionServicio } from '../../clasificaciones-servicio/types';

interface CodigoReferenciaFormProps {
    onSubmit: (values: CodigoReferenciaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<CodigoReferenciaFormData> | null;
    divisiones: Division[];
    categorias: Categoria[];
    subCategorias: SubCategoria[];
    detSubCategorias: DetSubCategoria[];
    clasificacionesServicio: ClasificacionServicio[];
    clasificacionesEstadistica: ClasificacionEstadistica[]; 
}

export function CodigoReferenciaForm({ onSubmit, isSubmitting, initialValues, divisiones, categorias, subCategorias, detSubCategorias, clasificacionesServicio, clasificacionesEstadistica }: CodigoReferenciaFormProps) {
    // Estados locales para manejar la selección en cascada
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
    const [selectedSubCategoriaId, setSelectedSubCategoriaId] = useState<string | null>(null);

    const form = useForm<CodigoReferenciaFormData>({
        initialValues: {
            codigo: '',
            descripcion: '',
            id_division: null,
            id_categoria: null,
            id_sub_categoria: null,
            id_det_sub_categoria: null,
            id_clasificacion_servicio: null,
            id_clasificacion_estadistica: null,
        },
        validate: {
            codigo: isNotEmpty('El código es requerido'),
            id_sub_categoria: isNotEmpty('Debe seleccionar una subcategoría'),
        },
    });

    // Lógica para filtrar las opciones de los selectores
    const divisionesOptions = useMemo(() => divisiones.map(d => ({ value: d.id_division.toString(), label: d.nombre_division })), [divisiones]);
    const clasServicioOptions = useMemo(() => clasificacionesServicio.map(c => ({ value: c.id.toString(), label: c.nombre })), [clasificacionesServicio]);
    const clasEstadisticaOptions = useMemo(() => clasificacionesEstadistica.map(c => ({ value: c.id.toString(), label: c.nombre })), [clasificacionesEstadistica]);
    
    const categoriasOptions = useMemo(() => {
        if (!selectedDivisionId) return [];
        return categorias
            .filter(c => c.id_division === Number(selectedDivisionId))
            .map(c => ({ value: c.id_categoria.toString(), label: c.nombre_categoria }));
    }, [selectedDivisionId, categorias]);

    const subCategoriasOptions = useMemo(() => {
        if (!selectedCategoriaId) return [];
        return subCategorias
            .filter(sc => sc.id_categoria === Number(selectedCategoriaId))
            .map(sc => ({ value: sc.id_sub_categoria.toString(), label: sc.nombre_sub_categoria }));
    }, [selectedCategoriaId, subCategorias]);

    const detSubCategoriasOptions = useMemo(() => {
        if (!selectedSubCategoriaId) return [];
        return detSubCategorias
            .filter(dsc => dsc.id_sub_categoria === Number(selectedSubCategoriaId))
            .map(dsc => ({ value: dsc.id_det_sub_categoria.toString(), label: dsc.nombre_det_sub_categoria }));
    }, [selectedSubCategoriaId, detSubCategorias]);

    useEffect(() => {
        if (initialValues?.id_sub_categoria) {
            const subCategoria = subCategorias.find(sc => sc.id_sub_categoria.toString() === initialValues.id_sub_categoria);
            const categoria = subCategoria ? categorias.find(c => c.id_categoria === subCategoria.id_categoria) : undefined;
            const division = categoria ? divisiones.find(d => d.id_division === categoria.id_division) : undefined;
            
            if (division) setSelectedDivisionId(division.id_division.toString());
            if (categoria) setSelectedCategoriaId(categoria.id_categoria.toString());
            if (subCategoria) setSelectedSubCategoriaId(subCategoria.id_sub_categoria.toString());

            form.setValues({
                codigo: initialValues.codigo || '',
                descripcion: initialValues.descripcion || '',
                id_sub_categoria: initialValues.id_sub_categoria,
                id_det_sub_categoria: initialValues.id_det_sub_categoria || null,
            });
        } else {
            form.reset();
        }
    }, [initialValues, divisiones, categorias, subCategorias]);

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput
                    withAsterisk
                    label="Código de Referencia"
                    placeholder="Ej: 90915-YZZD2"
                    {...form.getInputProps('codigo')}
                />
                <Textarea
                    label="Descripción"
                    placeholder="Ej: Filtro de aceite para Toyota Yaris 1.5"
                    rows={3}
                    {...form.getInputProps('descripcion')}
                />
                
                <Select
                    withAsterisk
                    label="División"
                    placeholder="Paso 1: Seleccione una división"
                    data={divisionesOptions}
                    searchable
                    clearable
                    value={selectedDivisionId}
                    onChange={(value) => {
                        setSelectedDivisionId(value);
                        setSelectedCategoriaId(null);
                        setSelectedSubCategoriaId(null);
                        form.setFieldValue('id_sub_categoria', null);
                        form.setFieldValue('id_det_sub_categoria', null);
                    }}
                />
                <Select
                    withAsterisk
                    label="Categoría"
                    placeholder={selectedDivisionId ? "Paso 2: Seleccione una categoría" : "Seleccione una división primero"}
                    data={categoriasOptions}
                    disabled={!selectedDivisionId || categoriasOptions.length === 0}
                    searchable
                    clearable
                    value={selectedCategoriaId}
                    onChange={(value) => {
                        setSelectedCategoriaId(value);
                        setSelectedSubCategoriaId(null);
                        form.setFieldValue('id_sub_categoria', null);
                        form.setFieldValue('id_det_sub_categoria', null);
                    }}
                />
                <Select
                    withAsterisk
                    label="Subcategoría"
                    placeholder={selectedCategoriaId ? "Paso 3: Seleccione una subcategoría" : "Seleccione una categoría primero"}
                    data={subCategoriasOptions}
                    disabled={!selectedCategoriaId || subCategoriasOptions.length === 0}
                    searchable
                    clearable
                    value={selectedSubCategoriaId}
                    onChange={(value) => {
                        form.setFieldValue('id_sub_categoria', value);
                        setSelectedSubCategoriaId(value);
                        form.setFieldValue('id_det_sub_categoria', null);
                    }}
                />
                {detSubCategoriasOptions.length > 0 && (
                    <Select
                        label="Detalle Subcategoría (Opcional)"
                        placeholder="Paso 4: Seleccione un detalle si aplica"
                        data={detSubCategoriasOptions}
                        clearable
                        {...form.getInputProps('id_det_sub_categoria')}
                    />
                )}
                <Group align='flex-start' wrap='nowrap'>
                    <Select
                        label="Clasificación de Servicio"
                        placeholder="Seleccione una clasificación"
                        data={clasServicioOptions}
                        clearable
                        searchable
                        flex={1}
                        {...form.getInputProps('id_clasificacion_servicio')}
                    />
                    
                    <Select
                        label="Clasificación Estadística"
                        placeholder="Seleccione una clasificación"
                        data={clasEstadisticaOptions}
                        clearable
                        searchable
                        flex={1}
                        {...form.getInputProps('id_clasificacion_estadistica')}
                    />
                </Group>
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Código de Referencia
                </Button>
            </Stack>
        </form>
    );
}