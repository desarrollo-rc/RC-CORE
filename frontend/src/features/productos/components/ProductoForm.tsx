// frontend/src/features/productos/components/ProductoForm.tsx
// (Este es un componente complejo, presta atención a su estructura)
import { TextInput, Button, Stack, Select, Group, NumberInput, Checkbox, Paper, ActionIcon, Text } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { IconTrash } from '@tabler/icons-react';
import type { ProductoFormData } from '../types';
// Importa todos los tipos de los maestros que necesitarás
import type { CodigoReferencia } from '../../codigos-referencia/types';
import type { Marca } from '../../marcas/types';
import type { Calidad } from '../../calidades/types';
import type { Origen } from '../../origenes/types';
import type { Fabrica } from '../../fabricas/types';
import type { Proveedor } from '../../proveedores/types';

interface ProductoFormProps {
    onSubmit: (values: ProductoFormData) => void;
    isSubmitting: boolean;
    initialValues?: Partial<ProductoFormData> | null;
    // Pasamos todos los datos de los maestros como props
    codigosRef: CodigoReferencia[];
    marcas: Marca[];
    calidades: Calidad[];
    origenes: Origen[];
    fabricas: Fabrica[];
    proveedores: Proveedor[];
}

export function ProductoForm({ onSubmit, isSubmitting, initialValues, ...maestros }: ProductoFormProps) {
    const defaults: ProductoFormData = {
        sku: '', nombre_producto: '', id_codigo_referencia: null, id_marca: null,
        id_calidad: null, id_origen: null, id_fabrica: null, costo_base: '',
        es_kit: false, proveedores: [{ id_proveedor: null, costo_proveedor: '', codigo_producto_proveedor: '', es_proveedor_principal: true }]
    };
    const form = useForm<ProductoFormData>({
        initialValues: initialValues ? { 
            ...defaults, 
            ...initialValues, 
            proveedores: initialValues.proveedores ?? defaults.proveedores 
        } : defaults,
        validate: {
            sku: isNotEmpty('El SKU es requerido'),
            nombre_producto: isNotEmpty('El nombre es requerido'),
            id_codigo_referencia: isNotEmpty('El código de referencia es requerido'),
            id_marca: isNotEmpty('La marca es requerida'),
            id_calidad: isNotEmpty('La calidad es requerida'),
            id_origen: isNotEmpty('El origen es requerido'),
            costo_base: (value) => (Number(value) > 0 ? null : 'El costo debe ser mayor a 0'),
            proveedores: {
                id_proveedor: isNotEmpty('Debe seleccionar un proveedor'),
                costo_proveedor: (value) => (Number(value) > 0 ? null : 'El costo debe ser mayor a 0'),
                codigo_producto_proveedor: isNotEmpty('El código es requerido'),
            }
        },
    });
    
    // Convertir datos de maestros a formato de opciones para Select
    const codigosRefOptions = maestros.codigosRef.map(c => ({ value: c.id_codigo_referencia.toString(), label: c.codigo }));
    const marcasOptions = maestros.marcas.map(m => ({ value: m.id_marca.toString(), label: m.nombre_marca }));
    const calidadesOptions = maestros.calidades.map(c => ({ value: c.id_calidad.toString(), label: c.nombre_calidad }));
    const origenesOptions = maestros.origenes.map(o => ({ value: o.id_origen.toString(), label: o.pais.nombre_pais }));
    const fabricasOptions = maestros.fabricas.map(f => ({ value: f.id_fabrica.toString(), label: f.nombre_fabrica }));
    const proveedoresOptions = maestros.proveedores.map(p => ({ value: p.id_proveedor.toString(), label: p.nombre_proveedor }));

    const proveedorFields = form.values.proveedores.map((_, index) => (
        <Paper withBorder p="sm" mt="sm" key={index}>
            <Group justify="space-between"><Text fw={500}>Proveedor #{index + 1}</Text> <ActionIcon color="red" onClick={() => form.removeListItem('proveedores', index)}><IconTrash size={16} /></ActionIcon></Group>
            <Select withAsterisk label="Proveedor" data={proveedoresOptions} {...form.getInputProps(`proveedores.${index}.id_proveedor`)} />
            <NumberInput withAsterisk label="Costo del Proveedor" {...form.getInputProps(`proveedores.${index}.costo_proveedor`)} />
            <TextInput withAsterisk label="Código Producto (Proveedor)" {...form.getInputProps(`proveedores.${index}.codigo_producto_proveedor`)} />
            <Checkbox mt="xs" label="Es proveedor principal" {...form.getInputProps(`proveedores.${index}.es_proveedor_principal`, { type: 'checkbox' })} />
        </Paper>
    ));

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Stack>
                <TextInput withAsterisk label="SKU" {...form.getInputProps('sku')} />
                <TextInput withAsterisk label="Nombre del Producto" {...form.getInputProps('nombre_producto')} />
                <Select withAsterisk label="Código de Referencia (Padre)" data={codigosRefOptions} searchable {...form.getInputProps('id_codigo_referencia')} />
                <Select withAsterisk label="Marca" data={marcasOptions} searchable {...form.getInputProps('id_marca')} />
                <Select withAsterisk label="Calidad" data={calidadesOptions} searchable {...form.getInputProps('id_calidad')} />
                <Select withAsterisk label="Origen" data={origenesOptions} searchable {...form.getInputProps('id_origen')} />
                <Select label="Fábrica (Opcional)" data={fabricasOptions} searchable clearable {...form.getInputProps('id_fabrica')} />
                <NumberInput withAsterisk label="Costo Base" {...form.getInputProps('costo_base')} />
                <Checkbox label="Es un Kit" {...form.getInputProps('es_kit', { type: 'checkbox' })} />
                
                {proveedorFields}
                <Button fullWidth onClick={() => form.insertListItem('proveedores', { id_proveedor: null, costo_proveedor: '', codigo_producto_proveedor: '', es_proveedor_principal: false })}>
                    Añadir Proveedor
                </Button>
                
                <Button type="submit" mt="md" loading={isSubmitting}>Guardar Producto</Button>
            </Stack>
        </form>
    );
}