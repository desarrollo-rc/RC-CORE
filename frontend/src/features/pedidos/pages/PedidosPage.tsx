// frontend/src/features/pedidos/pages/PedidosPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Group, Alert, Center, Loader, Pagination, Button, Text, TextInput, Select, NumberInput, Affix, ActionIcon, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { fetchAllClientes } from '../../clientes/services/clienteService';
import { getVendedores } from '../../vendedores/services/vendedorService';
import { IconPlus, IconMail } from '@tabler/icons-react';
import { PedidosTable } from '../components/PedidosTable';
import { GmailExtractionModal } from '../components/GmailExtractionModal';
import { getPedidos, exportPedidosCutoff } from '../services/pedidoService';
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
    const [exportDate, setExportDate] = useState<string>('');
    const [cutoffHour, setCutoffHour] = useState<number>(12);
    const [gmailModalOpened, { open: openGmailModal, close: closeGmailModal }] = useDisclosure(false);

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
        // cargar todas las opciones de clientes y vendedores para filtros
        (async () => {
            try {
                const [clientesResp, vendedoresResp] = await Promise.all([
                    // usamos fetchAllClientes para traer todos
                    fetchAllClientes().then(c => ({ clientes: c } as any)),
                    getVendedores(),
                ]);
                setClienteOptions((clientesResp.clientes || []).map((c: any) => ({ value: c.id_cliente.toString(), label: `${c.codigo_cliente} - ${c.nombre_cliente}` })));
                setVendedorOptions(
                    (vendedoresResp || []).map(v => ({ value: v.id_vendedor.toString(), label: v.usuario.nombre_completo }))
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
                <Button 
                    leftSection={<IconPlus size={14} />} 
                    onClick={() => navigate('/pedidos/crear')} // Navegar a una futura página de creación
                >
                    Crear Seguimiento
                </Button>
            </Group>
            
            <Group mb="md" grow>
                {/* helper para parsear YYYY-MM-DD a Date local sin shift */}
                {null}
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

            <Group mt="md" align="end">
                <TextInput
                    type="date"
                    label="Fecha objetivo informe"
                    value={exportDate}
                    onChange={(e: any) => setExportDate(e.currentTarget.value)}
                    style={{ maxWidth: 220 }}
                />
                <NumberInput
                    label="Hora de corte"
                    min={0}
                    max={23}
                    value={cutoffHour}
                    onChange={(v) => setCutoffHour(Number(v) || 0)}
                    style={{ maxWidth: 180 }}
                />
                <Button
                    variant="outline"
                    onClick={async () => {
                        if (!exportDate) return;
                        const blob = await exportPedidosCutoff(exportDate, cutoffHour);
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `pedidos_${exportDate}_cutoff_${cutoffHour}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                    }}
                >
                    Descargar informe (corte)
                </Button>
            </Group>

            {renderContent()}

            <GmailExtractionModal
                opened={gmailModalOpened}
                onClose={closeGmailModal}
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