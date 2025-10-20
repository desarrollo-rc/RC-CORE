// frontend/src/features/pedidos/pages/PedidosPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Group, Alert, Center, Loader, Pagination, Button, Text, TextInput, Select, Affix, ActionIcon, rem, Collapse, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { fetchAllClientes } from '../../clientes/services/clienteService';
import { getVendedores } from '../../vendedores/services/vendedorService';
import { IconPlus, IconMail, IconChevronDown, IconChevronUp, IconFilter } from '@tabler/icons-react';
import { PedidosTable } from '../components/PedidosTable';
import { GmailExtractionModal } from '../components/GmailExtractionModal';
import { InformesModal } from '../components/InformesModal';
import { getPedidos, getEstadosGenerales, getEstadosCredito, getEstadosLogisticos } from '../services/pedidoService';
import type { PedidoList, PedidoFilters, PaginatedPedidosResponse } from '../types';

const PAGE_SIZE = 15;

export function PedidosPage() {
    const navigate = useNavigate();
    const [response, setResponse] = useState<PaginatedPedidosResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<PedidoFilters>({ page: 1, per_page: PAGE_SIZE });
    const [clienteOptions, setClienteOptions] = useState<{ value: string; label: string }[]>([]);
    const [vendedorOptions, setVendedorOptions] = useState<{ value: string; label: string }[]>([]);
    const [estadoGeneralOptions, setEstadoGeneralOptions] = useState<{ value: string; label: string }[]>([]);
    const [estadoCreditoOptions, setEstadoCreditoOptions] = useState<{ value: string; label: string }[]>([]);
    const [estadoLogisticoOptions, setEstadoLogisticoOptions] = useState<{ value: string; label: string }[]>([]);
    const [gmailModalOpened, { open: openGmailModal, close: closeGmailModal }] = useDisclosure(false);
    const [informesModalOpened, { open: openInformesModal, close: closeInformesModal }] = useDisclosure(false);
    const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getPedidos(filters);
                setResponse(data);
                setError(null);
            } catch (err) {
                setError('No se pudieron cargar los pedidos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    useEffect(() => {
        // cargar todas las opciones de clientes, vendedores y estados para filtros
        (async () => {
            try {
                const [clientesResp, vendedoresResp, estadosGenerales, estadosCredito, estadosLogisticos] = await Promise.all([
                    // usamos fetchAllClientes para traer todos
                    fetchAllClientes().then(c => ({ clientes: c } as any)),
                    getVendedores(),
                    getEstadosGenerales(),
                    getEstadosCredito(),
                    getEstadosLogisticos(),
                ]);
                setClienteOptions((clientesResp.clientes || []).map((c: any) => ({ value: c.id_cliente.toString(), label: `${c.codigo_cliente} - ${c.nombre_cliente}` })));
                setVendedorOptions(
                    (vendedoresResp || []).map(v => ({ value: v.id_vendedor.toString(), label: v.usuario.nombre_completo }))
                );
                setEstadoGeneralOptions(
                    estadosGenerales.map(e => ({ value: e.id_estado.toString(), label: e.nombre_estado }))
                );
                setEstadoCreditoOptions(
                    estadosCredito.map(e => ({ value: e.id_estado.toString(), label: e.nombre_estado }))
                );
                setEstadoLogisticoOptions(
                    estadosLogisticos.map(e => ({ value: e.id_estado.toString(), label: e.nombre_estado }))
                );
            } catch (e) {
                // silencio: filtros siguen funcionando manualmente
            }
        })();
    }, []);

    const handleViewDetails = (record: PedidoList) => {
        // Navegaremos a una futura página de detalle
        navigate(`/pedidos/${record.id_pedido}`);
    };
    
    const handlePageChange = (newPage: number) => {
        setFilters(currentFilters => ({ ...currentFilters, page: newPage }));
    };


    const renderContent = () => {
        if (loading) return <Center h={400}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        if (!response || response.pedidos.length === 0) return <Center h={200}><Text>No se encontraron pedidos.</Text></Center>;
        
        return (
            <>
                <PedidosTable records={response.pedidos} onView={handleViewDetails} />
                <Group justify="center" mt="xl">
                    <Pagination
                        total={response.pagination.pages}
                        value={response.pagination.page}
                        onChange={handlePageChange}
                    />
                </Group>
            </>
        );
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Seguimiento de Pedidos</Title>
                <Group>
                    <Button
                        variant="outline"
                        leftSection={<IconFilter size={16} />}
                        rightSection={filtersOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        onClick={toggleFilters}
                    >
                        {filtersOpened ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                    <Button 
                        leftSection={<IconPlus size={14} />} 
                        onClick={() => navigate('/pedidos/crear')} // Navegar a una futura página de creación
                    >
                        Crear Seguimiento
                    </Button>
                </Group>
            </Group>
            
            <Collapse in={filtersOpened}>
                <Paper withBorder p="md" mb="md" style={{ borderColor: '#373a40' }}>
                    <Text size="sm" fw={600} mb="md" c="dimmed">Filtros de Búsqueda</Text>
                    
                    <Group mb="md" grow>
                        <TextInput
                            label="Código B2B"
                            placeholder="Ej: B2B-1234"
                            value={filters.codigo_b2b || ''}
                            onChange={(e: any) => {
                                const val = typeof e === 'string' ? e : e?.currentTarget?.value;
                                setFilters(f => ({ ...f, page: 1, codigo_b2b: val || undefined }));
                            }}
                        />
                        <Select
                            label="Cliente"
                            placeholder="Seleccione cliente"
                            data={clienteOptions}
                            searchable
                            clearable
                            value={filters.cliente_id ? String(filters.cliente_id) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, cliente_id: val ? Number(val) : undefined }))}
                        />
                        <Select
                            label="Vendedor"
                            placeholder="Seleccione vendedor"
                            data={vendedorOptions}
                            searchable
                            clearable
                            value={filters.vendedor_id ? String(filters.vendedor_id) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, vendedor_id: val ? Number(val) : undefined }))}
                        />
                    </Group>

                    <Group mb="md" grow>
                        <Select
                            label="Estado General"
                            placeholder="Seleccione estado"
                            data={estadoGeneralOptions}
                            searchable
                            clearable
                            value={filters.estado_general_id ? String(filters.estado_general_id) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, estado_general_id: val ? Number(val) : undefined }))}
                        />
                        <Select
                            label="Estado de Cobranza"
                            placeholder="Seleccione estado"
                            data={estadoCreditoOptions}
                            searchable
                            clearable
                            value={filters.estado_credito_id ? String(filters.estado_credito_id) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, estado_credito_id: val ? Number(val) : undefined }))}
                        />
                        <Select
                            label="Estado Logístico"
                            placeholder="Seleccione estado"
                            data={estadoLogisticoOptions}
                            searchable
                            clearable
                            value={filters.estado_logistico_id ? String(filters.estado_logistico_id) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, estado_logistico_id: val ? Number(val) : undefined }))}
                        />
                    </Group>

                    <Group grow>
                        <TextInput
                            type="date"
                            label="Fecha desde"
                            value={(filters.fecha_desde as string) || ''}
                            onChange={(e: any) => {
                                const val = e?.currentTarget?.value ?? e?.target?.value ?? '';
                                setFilters(f => ({ ...f, page: 1, fecha_desde: val || undefined }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                        <TextInput
                            type="date"
                            label="Fecha hasta"
                            value={(filters.fecha_hasta as string) || ''}
                            onChange={(e: any) => {
                                const val = e?.currentTarget?.value ?? e?.target?.value ?? '';
                                setFilters(f => ({ ...f, page: 1, fecha_hasta: val || undefined }));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </Group>
                </Paper>
            </Collapse>

            <Group mb="md" justify="flex-end">
                <Button
                    variant="outline"
                    leftSection={<IconPlus size={16} />}
                    onClick={openInformesModal}
                >
                    Informes
                </Button>
            </Group>

            {renderContent()}

            <GmailExtractionModal
                opened={gmailModalOpened}
                onClose={closeGmailModal}
            />

            <InformesModal
                opened={informesModalOpened}
                onClose={closeInformesModal}
            />

            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <ActionIcon 
                    color="blue" 
                    size={60} 
                    radius="xl" 
                    onClick={openGmailModal}
                    title="Extraer pedidos desde Gmail"
                >
                    <IconMail style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </Affix>
        </Box>
    );
}