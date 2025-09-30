// frontend/src/features/pedidos/pages/PedidosPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Group, Alert, Center, Loader, Pagination, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { PedidosTable } from '../components/PedidosTable';
import { getPedidos } from '../services/pedidoService';
import type { PedidoList, PedidoFilters, PaginatedPedidosResponse } from '../types';

const PAGE_SIZE = 15;

export function PedidosPage() {
    const navigate = useNavigate();
    const [response, setResponse] = useState<PaginatedPedidosResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<PedidoFilters>({ page: 1, per_page: PAGE_SIZE });

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
            
            {/* Aquí podrías agregar los componentes de filtro en el futuro */}

            {renderContent()}
        </Box>
    );
}