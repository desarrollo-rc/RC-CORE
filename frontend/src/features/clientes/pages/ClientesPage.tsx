// frontend/src/features/clientes/pages/ClientesPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Modal, Button, Text, Stack, TextInput, Pagination } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';

import { getClientes, createCliente, updateCliente, deactivateCliente, activateCliente } from '../services/clienteService';
import { getTiposCliente } from '../../tipos-cliente/services/tipoClienteService';
import { getSegmentosCliente } from '../../segmentos-cliente/services/segmentoClienteService';
import { getTiposNegocio } from '../../tipos-negocio/services/tipoNegocioService';
import { getListasPrecios } from '../../listas-precios/services/listaPreciosService';
import { getCondicionesPago } from '../../condiciones-pago/services/condicionPagoService';
import { getEmpresas } from '../../empresas/services/empresaService';
import { getVendedores } from '../../vendedores/services/vendedorService';
import { getMarcas } from '../../marcas/services/marcaService';
import { getCategorias } from '../../categorizacion/services/categorizacionService';

import { ClientesTable } from '../components/ClientesTable';
import { DetalleClienteModal } from '../components/DetalleClienteModal';
import { ClienteForm } from '../components/ClienteForm';
import type { Cliente, ClientePayload, ClienteFormData } from '../types';
import type { TipoCliente } from '../../tipos-cliente/types';
import type { SegmentoCliente } from '../../segmentos-cliente/types';
import type { TipoNegocio } from '../../tipos-negocio/types';
import type { ListaPrecios } from '../../listas-precios/types';
import type { CondicionPago } from '../../condiciones-pago/types';
import type { Empresa } from '../../empresas/types';
import type { Vendedor } from '../../vendedores/types';
import type { Marca } from '../../marcas/types';
import type { Categoria } from '../../categorizacion/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export interface MaestrosData {
    tiposCliente: TipoCliente[];
    segmentosCliente: SegmentoCliente[];
    tiposNegocio: TipoNegocio[];
    listasPrecios: ListaPrecios[];
    condicionesPago: CondicionPago[];
    empresas: Empresa[];
    vendedores: Vendedor[];
    marcas: Marca[];
    categorias: Categoria[];
}

const emptyFormValues: ClienteFormData = {
    codigo_cliente: '', rut_cliente: '', nombre_cliente: '', giro_economico: '',
    descuento_base: '', linea_credito: '', b2b_habilitado: false,
    id_tipo_cliente: null, id_segmento_cliente: null, id_tipo_negocio: null,
    id_lista_precios: null, id_condicion_pago: null, id_vendedor: null,
    ids_empresa: [],
    contactos: [],
    direcciones: [],
    definir_afinidad: false, marcas_afinidad_ids: [], categorias_afinidad_ids: []
};


export function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [page, setPage] = useState(1);
    const [perPage] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [maestros, setMaestros] = useState<MaestrosData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Cliente | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [
                clientesResponse, tiposClienteData, segmentosClienteData, tiposNegocioData,
                listasPreciosData, condicionesPagoData, empresasData, vendedoresData,
                marcasData, categoriasData
            ] = await Promise.all([
                getClientes({ page, per_page: perPage }), getTiposCliente(), getSegmentosCliente(), getTiposNegocio(),
                getListasPrecios(), getCondicionesPago(), getEmpresas(), getVendedores(),
                getMarcas(true), getCategorias(true) // Obtenemos todos, activos e inactivos
            ]);
            
            setClientes(clientesResponse.clientes);
            setTotalPages(clientesResponse.pagination?.pages || 1);
            setMaestros({
                tiposCliente: tiposClienteData, segmentosCliente: segmentosClienteData,
                tiposNegocio: tiposNegocioData, listasPrecios: listasPreciosData,
                condicionesPago: condicionesPagoData, empresas: empresasData,
                vendedores: vendedoresData, marcas: marcasData, categorias: categoriasData
            });
        } catch (err) {
            setError('No se pudieron cargar los datos necesarios para la página de clientes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [page, perPage]);

    const handleSubmit = async (formValues: ClienteFormData) => {
        if (!maestros) return;
        setIsSubmitting(true);

        const findCodeById = (id: string | null, list: any[], idField: string, codeField: string) => {
            const item = list.find(i => i[idField].toString() === id);
            return item ? item[codeField] : '';
        };

        const transformedDirecciones = formValues.direcciones.map(dir => {
            // Creamos un nuevo objeto solo con las propiedades que la API espera
            return {
                id_direccion: dir.id_direccion,
                calle: dir.calle,
                numero: dir.numero,
                id_comuna: Number(dir.id_comuna), // Aseguramos que sea un número
                codigo_postal: dir.codigo_postal,
                es_facturacion: dir.es_facturacion,
                es_despacho: dir.es_despacho
            };
        });

        const payload: ClientePayload = {
            codigo_cliente: formValues.codigo_cliente,
            rut_cliente: formValues.rut_cliente,
            nombre_cliente: formValues.nombre_cliente,
            giro_economico: formValues.giro_economico || null,
            descuento_base: Number(formValues.descuento_base) || 0,
            linea_credito: Number(formValues.linea_credito) || 0,
            b2b_habilitado: formValues.b2b_habilitado,
            id_vendedor: formValues.id_vendedor ? Number(formValues.id_vendedor) : null,
            contactos: formValues.contactos,
            direcciones: transformedDirecciones,
            codigo_tipo_cliente: findCodeById(formValues.id_tipo_cliente, maestros.tiposCliente, 'id_tipo_cliente', 'codigo_tipo_cliente'),
            codigo_segmento_cliente: findCodeById(formValues.id_segmento_cliente, maestros.segmentosCliente, 'id_segmento_cliente', 'codigo_segmento_cliente'),
            codigo_tipo_negocio: findCodeById(formValues.id_tipo_negocio, maestros.tiposNegocio, 'id_tipo_negocio', 'codigo_tipo_negocio'),
            codigo_lista_precios: findCodeById(formValues.id_lista_precios, maestros.listasPrecios, 'id_lista_precios', 'codigo_lista_precios'),
            codigo_condicion_pago: findCodeById(formValues.id_condicion_pago, maestros.condicionesPago, 'id_condicion_pago', 'codigo_condicion_pago'),
            codigos_empresa: formValues.ids_empresa.map(id => findCodeById(id, maestros.empresas, 'id_empresa', 'codigo_empresa')),
        };

        if (formValues.definir_afinidad) {
            payload.marcas_afinidad_ids = formValues.marcas_afinidad_ids.map(Number);
            payload.categorias_afinidad_ids = formValues.categorias_afinidad_ids.map(Number);
        }

        try {
            if (editingRecord) {
                await updateCliente(editingRecord.id_cliente, payload);
                console.log('Cliente actualizado:', payload);
                notifications.show({ title: 'Éxito', message: 'Cliente actualizado.', color: 'blue' });
            } else {
                await createCliente(payload);
                console.log('Cliente creado:', payload);
                notifications.show({ title: 'Éxito', message: 'Cliente creado.', color: 'green' });
            }
            await fetchData();
            closeModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el cliente.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingRecord(null);
        openModal();
    };

    const handleEdit = (record: Cliente) => {
        setEditingRecord(record);
        openModal();
    };

    const [viewModalOpened, { open: openViewModal, close: closeViewModal }] = useDisclosure(false);
    const [viewRecord, setViewRecord] = useState<Cliente | null>(null);
    const handleView = (record: Cliente) => {
        setViewRecord(record);
        openViewModal();
    };

    const handleDeactivate = (record: Cliente) => {
        let motivo = '';
        modals.open({
            title: `Desactivar Cliente: ${record.nombre_cliente}`,
            children: (
                <Stack>
                    <Text size="sm">Para desactivar un cliente, debes ingresar un motivo.</Text>
                    <TextInput
                        label="Motivo de bloqueo"
                        placeholder="Ej: Cliente con deuda pendiente."
                        required
                        onChange={(event) => (motivo = event.currentTarget.value)}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => modals.closeAll()}>Cancelar</Button>
                        <Button
                            color="red"
                            onClick={async () => {
                                if (!motivo.trim()) {
                                    notifications.show({ title: 'Error', message: 'El motivo es obligatorio.', color: 'red' });
                                    return;
                                }
                                try {
                                    await deactivateCliente(record.id_cliente, motivo);
                                    await fetchData();
                                    notifications.show({ title: 'Éxito', message: 'Cliente desactivado.', color: 'orange' });
                                    modals.closeAll();
                                } catch (error) {
                                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar.'), color: 'red' });
                                }
                            }}
                        >
                            Desactivar Cliente
                        </Button>
                    </Group>
                </Stack>
            ),
        });
    };

    const handleActivate = (record: Cliente) => {
        modals.openConfirmModal({
            title: 'Activar Cliente',
            children: <Text size="sm">¿Estás seguro de que quieres activar a "{record.nombre_cliente}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await activateCliente(record.id_cliente);
                    await fetchData();
                    notifications.show({ title: 'Éxito', message: 'Cliente activado.', color: 'green' });
                } catch(error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar.'), color: 'red' });
                }
            },
        });
    };

    const formInitialValues = editingRecord && maestros ? {
        ...emptyFormValues,
        codigo_cliente: editingRecord.codigo_cliente,
        rut_cliente: editingRecord.rut_cliente,
        nombre_cliente: editingRecord.nombre_cliente,
        giro_economico: editingRecord.giro_economico || '',
        descuento_base: editingRecord.descuento_base,
        linea_credito: editingRecord.linea_credito,
        b2b_habilitado: editingRecord.b2b_habilitado,
        id_tipo_cliente: editingRecord.tipo_cliente.id_tipo_cliente.toString(),
        id_segmento_cliente: editingRecord.segmento_cliente.id_segmento_cliente.toString(),
        id_tipo_negocio: editingRecord.tipo_negocio.id_tipo_negocio.toString(),
        id_lista_precios: editingRecord.lista_precios.id_lista_precios.toString(),
        id_condicion_pago: editingRecord.condicion_pago.id_condicion_pago.toString(),
        id_vendedor: editingRecord.vendedor?.id_vendedor.toString() || null,
        ids_empresa: editingRecord.empresas.map(e => e.id_empresa.toString()),
        contactos: editingRecord.contactos || [],
        direcciones: editingRecord.direcciones || [],
        definir_afinidad: (editingRecord.marcas_afinidad.length > 0 || editingRecord.categorias_afinidad.length > 0),
        marcas_afinidad_ids: editingRecord.marcas_afinidad.map(m => m.id_marca.toString()),
        categorias_afinidad_ids: editingRecord.categorias_afinidad.map(c => c.id_categoria.toString()),
    } : emptyFormValues;

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Clientes</Title>
                <Button leftSection={<IconPlus size={14} />} onClick={handleOpenModalForCreate}>
                    Crear Cliente
                </Button>
            </Group>
            {loading ? <Center h={400}><Loader /></Center> : error ? <Alert color="red" title="Error">{error}</Alert> : <>
                <ClientesTable records={clientes} onView={handleView} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />
                <Group justify="center" mt="md">
                    <Pagination total={totalPages} value={page} onChange={setPage} />
                </Group>
            </>}
            <DetalleClienteModal opened={viewModalOpened} onClose={closeViewModal} record={viewRecord} />
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Cliente' : 'Crear Nuevo Cliente'} size="80%">
                {maestros && (
                    <ClienteForm
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        initialValues={formInitialValues}
                        maestros={maestros}
                    />
                )}
            </Modal>
        </Box>
    );
}