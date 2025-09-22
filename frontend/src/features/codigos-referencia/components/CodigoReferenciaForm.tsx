// frontend/src/features/codigos-referencia/components/CodigoReferenciaForm.tsx
import { TextInput, Button, Stack, Textarea, Select } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useEffect, useState, useMemo } from 'react';
import type { CodigoReferenciaFormData } from '../types';
import type { Division, Categoria, SubCategoria, DetSubCategoria } from '../../categorizacion/types';

interface CodigoReferenciaFormProps {
    onSubmit: (values: CodigoReferenciaFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<CodigoReferenciaFormData> | null;
    // Recibimos todas las listas de la página principal
    divisiones: Division[];
    categorias: Categoria[];
    subCategorias: SubCategoria[];
    detSubCategorias: DetSubCategoria[];
}

export function CodigoReferenciaForm({ onSubmit, isSubmitting, initialValues, divisiones, categorias, subCategorias, detSubCategorias }: CodigoReferenciaFormProps) {
    // Estados locales para manejar la selección en cascada
    const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);
    const [selectedCategoriaId, setSelectedCategoriaId] = useState<string | null>(null);
    const [selectedSubCategoriaId, setSelectedSubCategoriaId] = useState<string | null>(null);
    const [selectedDetSubCategoriaId, setSelectedDetSubCategoriaId] = useState<string | null>(null);

    const form = useForm<CodigoReferenciaFormData>({
        initialValues: {
            codigo: '',
            descripcion: '',
            id_sub_categoria: null,
        },
        validate: {
            codigo: isNotEmpty('El código es requerido'),
            id_sub_categoria: isNotEmpty('Debe seleccionar una subcategoría'),
        },
    });

    // Lógica para filtrar las opciones de los selectores
    const divisionesOptions = useMemo(() => divisiones.map(d => ({ value: d.id_division.toString(), label: d.nombre_division })), [divisiones]);
    
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
        if (initialValues) {
            form.setValues(initialValues);
            // Lógica para pre-cargar los selectores si estamos editando (requiere un poco más de trabajo)
        } else {
            form.reset();
        }
    }, [initialValues]);

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
                        setSelectedCategoriaId(null); // Resetear selección hija
                        form.setFieldValue('id_sub_categoria', null); // Resetear selección final
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
                        form.setFieldValue('id_sub_categoria', null); // Resetear selección final
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
                        setSelectedSubCategoriaId(value);
                    }}
                />
                {detSubCategoriasOptions.length > 0 && (
                    <Select
                        label="Detalle Subcategoría (Opcional)"
                        placeholder="Paso 4: Seleccione un detalle si aplica"
                        data={detSubCategoriasOptions}
                        searchable
                        clearable
                        value={selectedDetSubCategoriaId}
                        onChange={(value) => {
                            setSelectedDetSubCategoriaId(value);
                        }}
                    />
                )}
                
                <Button type="submit" mt="md" loading={isSubmitting}>
                    Guardar Código de Referencia
                </Button>
            </Stack>
        </form>
    );
}