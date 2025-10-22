// frontend/src/features/productos/pages/ProductosPage.tsx
import { useState, useEffect } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Modal, Affix, ActionIcon, rem, Text, Pagination, Select, Collapse, Paper, TextInput, Button } from '@mantine/core';
import { useDisclosure, useDebouncedValue } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconFilter, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { ProductosTable } from '../components/ProductosTable';
import { ProductoForm } from '../components/ProductoForm';
import { getProductos, createProducto, updateProducto, deactivateProducto, activateProducto } from '../services/productoService';
// Importar todos los servicios de los maestros
import { getCodigosReferencia } from '../../codigos-referencia/services/codigoReferenciaService';
import { getMarcas } from '../../marcas/services/marcaService';
import { getCalidades } from '../../calidades/services/calidadService';
import { getOrigenes } from '../../origenes/services/origenService';
import { getFabricas } from '../../fabricas/services/fabricaService';
import { getProveedores } from '../../proveedores/services/proveedorService';
// Importar todos los tipos necesarios
import type { Producto, ProductoFormData, ProductoPayload, ProductoFilters } from '../types';
//import type { ProveedorFormSection } from '../types';
/* import type { CodigoReferencia } from '../../codigos-referencia/types';
import type { Marca } from '../../marcas/types';
import type { Calidad } from '../../calidades/types';
import type { Origen } from '../../origenes/types';
import type { Fabrica } from '../../fabricas/types';
import type { Proveedor } from '../../proveedores/types'; */
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function ProductosPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [maestros, setMaestros] = useState<any>(null); // Contendrá todos los datos de los maestros
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Producto | null>(null);
    const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(true);

    const [filters, setFilters] = useState<ProductoFilters>({ page: 1, per_page: 15 });
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);
    const [marcaOptions, setMarcaOptions] = useState<{ value: string; label: string }[]>([]);
    
    // Estados locales para los inputs de texto (sin debounce)
    const [skuInput, setSkuInput] = useState('');
    const [nombreInput, setNombreInput] = useState('');
    
    // Valores con debounce para los filtros de texto
    const [debouncedSku] = useDebouncedValue(skuInput, 500);
    const [debouncedNombre] = useDebouncedValue(nombreInput, 500);

    useEffect(() => {
        const fetchMasters = async () => {
            try {
                const [codigosRefData, marcasData, calidadesData, origenesData, fabricasData, proveedoresData] = await Promise.all([
                    getCodigosReferencia(), getMarcas(), getCalidades(), getOrigenes(), getFabricas(), getProveedores()
                ]);
                setMaestros({
                    codigosRef: codigosRefData,
                    marcas: marcasData,
                    calidades: calidadesData,
                    origenes: origenesData,
                    fabricas: fabricasData,
                    proveedores: proveedoresData
                });
            } catch (err) {
                setError('No se pudieron cargar los datos necesarios para la página.');
            }
        };
        fetchMasters();
    }, []);

    // Sincronizar los valores con debounce a los filtros
    useEffect(() => {
        setFilters(current => ({
            ...current,
            page: 1,
            sku: debouncedSku || undefined,
            nombre_producto: debouncedNombre || undefined
        }));
    }, [debouncedSku, debouncedNombre]);

    useEffect(() => {
        const fetchProductosList = async () => {
            try {
                setLoading(true);
                const { items, pagination } = await getProductos(filters);
                setProductos(items);
                setTotal(pagination.total);
                setPages(pagination.pages);
            } catch (err) {
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProductosList();
    }, [filters]);

    // Cargar opciones para los filtros
    useEffect(() => {
        (async () => {
            try {
                const marcasResp = await getMarcas();
                setMarcaOptions(
                    (marcasResp || []).map(m => ({ value: m.id_marca.toString(), label: m.nombre_marca }))
                );
            } catch (e) {
                // silencio: filtros siguen funcionando manualmente
            }
        })();
    }, []);

    const handleSubmit = async (formValues: ProductoFormData) => {
        setIsSubmitting(true);
        // Transformar datos del formulario al payload de la API
        const payload: ProductoPayload = {
            ...formValues,
            id_codigo_referencia: Number(formValues.id_codigo_referencia),
            id_marca: Number(formValues.id_marca),
            id_calidad: Number(formValues.id_calidad),
            id_origen: Number(formValues.id_origen),
            id_fabrica: formValues.id_fabrica ? Number(formValues.id_fabrica) : null,
            costo_base: Number(formValues.costo_base),
            proveedores: formValues.proveedores.map(p => ({
                id_proveedor: Number(p.id_proveedor),
                costo_proveedor: Number(p.costo_proveedor),
                codigo_producto_proveedor: p.codigo_producto_proveedor,
                es_proveedor_principal: p.es_proveedor_principal
            })),
        };

        try {
            if (editingRecord) {
                const updated = await updateProducto(editingRecord.id_producto, payload);
                setProductos(current => current.map(p => p.id_producto === updated.id_producto ? updated : p));
                notifications.show({ title: 'Éxito', message: 'Producto actualizado.' });
            } else {
                await createProducto(payload);
                // Refrescar la página actual para reflejar el nuevo registro
                const { items, pagination } = await getProductos(filters);
                setProductos(items);
                setTotal(pagination.total);
                setPages(pagination.pages);
                notifications.show({ title: 'Éxito', message: 'Producto creado.' });
            }
            closeModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el producto.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = (record: Producto) => {
        modals.openConfirmModal({
            title: 'Desactivar Producto',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar el SKU "{record.sku}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            // Asumimos que la API pedirá un motivo, pero lo dejamos simple por ahora
            onConfirm: async () => {
                try {
                    const updated = await deactivateProducto(record.id_producto, "Desactivado desde RC CORE");
                    setProductos(current => current.map(p => p.id_producto === updated.id_producto ? updated : p));
                    notifications.show({ title: 'Éxito', message: 'Producto desactivado.', color: 'orange' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar.'), color: 'red' });
                }
            },
        });
    };

    const handleActivate = (record: Producto) => {
        modals.openConfirmModal({
            title: 'Activar Producto',
            children: <Text size="sm">¿Estás seguro de que quieres activar el SKU "{record.sku}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await activateProducto(record.id_producto);
                    setProductos(current => current.map(p => p.id_producto === updated.id_producto ? updated : p));
                    notifications.show({ title: 'Éxito', message: 'Producto activado.', color: 'green' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar.'), color: 'red' });
                }
            },
        });
    };

    const handlePageChange = (newPage: number) => {
        setFilters(currentFilters => ({ ...currentFilters, page: newPage }));
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Productos (SKUs)</Title>
                <Button
                    variant="outline"
                    leftSection={<IconFilter size={16} />}
                    rightSection={filtersOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    onClick={toggleFilters}
                >
                    {filtersOpened ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </Button>
            </Group>
            
            <Collapse in={filtersOpened}>
                <Paper withBorder p="md" mb="md" style={{ borderColor: '#373a40' }}>
                    <Text size="sm" fw={600} mb="md" c="dimmed">Filtros de Búsqueda</Text>
                    
                    <Group grow>
                        <TextInput
                            label="SKU"
                            placeholder="Ej: ABC123"
                            value={skuInput}
                            onChange={(e) => setSkuInput(e.currentTarget.value)}
                        />
                        <TextInput
                            label="Nombre Producto"
                            placeholder="Ej: Filtro de aceite"
                            value={nombreInput}
                            onChange={(e) => setNombreInput(e.currentTarget.value)}
                        />
                        <Select
                            label="Marca"
                            placeholder="Seleccione marca"
                            data={marcaOptions}
                            searchable
                            clearable
                            value={filters.id_marca ? String(filters.id_marca) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, id_marca: val ? Number(val) : undefined }))}
                        />
                    </Group>
                </Paper>
            </Collapse>

            <ProductosTable records={productos} onEdit={(r) => { setEditingRecord(r); openModal(); }} onDeactivate={handleDeactivate} onActivate={handleActivate} />
            <Group justify="center" mt="md">
                <Pagination total={pages} value={filters.page || 1} onChange={handlePageChange} withEdges />
                <Text size="sm" c="dimmed">{total} registros</Text>
            </Group>
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Producto' : 'Crear Producto'} size="xl" centered>
                <ProductoForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        sku: editingRecord.sku,
                        nombre_producto: editingRecord.nombre_producto,
                        costo_base: editingRecord.costo_base,
                        es_kit: editingRecord.es_kit,
                        id_codigo_referencia: editingRecord.codigo_referencia?.id_codigo_referencia.toString() || null,
                        id_marca: editingRecord.marca?.id_marca.toString() || null,
                        id_calidad: editingRecord.calidad?.id_calidad.toString() || null,
                        id_origen: editingRecord.origen?.id_origen.toString() || null,
                        id_fabrica: editingRecord.fabrica?.id_fabrica.toString() || null,
                        proveedores: editingRecord.proveedores.map(p => ({
                            id_proveedor: p.id_proveedor.toString(),
                            costo_proveedor: p.costo_proveedor,
                            codigo_producto_proveedor: p.codigo_producto_proveedor,
                            es_proveedor_principal: p.es_proveedor_principal,
                        }))
                    } : null}
                    {...maestros}
                />
            </Modal>
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <ActionIcon color="red" size={60} radius="xl" onClick={() => { setEditingRecord(null); openModal(); }}>
                    <IconPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </Affix>
        </Box>
    );
}