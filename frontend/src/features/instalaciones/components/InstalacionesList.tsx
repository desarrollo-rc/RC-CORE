// frontend/src/features/instalaciones/components/InstalacionesList.tsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Table, Badge, Center, Loader, Alert, Paper, Text, ActionIcon, Tooltip, Pagination, Group } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { getInstalaciones } from '../services/instalacionService';
import type { InstalacionFilters, Instalacion } from '../types';

// Helper para extraer el valor del enum del formato backend
const extractEstadoValue = (estado: string): string => {
    if (!estado) return 'Desconocido';
    
    // Si viene con el prefijo de la clase, extraer solo el valor
    if (estado.includes('EstadoInstalacion.')) {
        const value = estado.replace('EstadoInstalacion.', '');
        // Convertir a formato amigable
        switch (value) {
            case 'PENDIENTE_APROBACION': return 'Pendiente Aprobación';
            case 'PENDIENTE_INSTALACION': return 'Pendiente Instalación';
            case 'AGENDADA': return 'Agendada';
            case 'COMPLETADA': return 'Completada';
            case 'CANCELADA': return 'Cancelada';
            default: return value;
        }
    }
    
    return estado;
};

const getEstadoColor = (estado: string) => {
    const cleanEstado = extractEstadoValue(estado);
    const colorMap: Record<string, string> = {
        'Pendiente Aprobación': 'yellow',
        'Pendiente Instalación': 'blue',
        'Agendada': 'cyan',
        'Completada': 'green',
        'Cancelada': 'red',
    };
    return colorMap[cleanEstado] || 'gray';
};

interface InstalacionesListProps {
    filters?: InstalacionFilters;
    onPageChange?: (page: number) => void;
}

export function InstalacionesList({ filters, onPageChange }: InstalacionesListProps) {
    const navigate = useNavigate();
    const { data: response, isLoading, error } = useQuery({
        queryKey: ['instalaciones', filters],
        queryFn: () => {
            console.log('Fetching instalaciones with filters:', filters);
            return getInstalaciones(filters);
        },
    });

    console.log('InstalacionesList render - isLoading:', isLoading, 'error:', error, 'response:', response);

    if (isLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (error) {
        console.error('Error loading instalaciones:', error);
        return (
            <Alert color="red" title="Error">
                No se pudieron cargar las instalaciones. Error: {error.message}
            </Alert>
        );
    }

    // El backend está devolviendo un array directo, no un objeto con instalaciones
    let instalaciones: Instalacion[] = [];
    let pagination = { page: 1, pages: 1, per_page: 15, total: 0 };
    
    if (Array.isArray(response)) {
        // Si response es un array directo (formato antiguo)
        instalaciones = response;
        pagination = { page: 1, pages: 1, per_page: 15, total: response.length };
    } else if (response && response.instalaciones) {
        // Si response tiene la estructura esperada
        instalaciones = response.instalaciones;
        pagination = response.pagination || { page: 1, pages: 1, per_page: 15, total: 0 };
    }

    if (!instalaciones || instalaciones.length === 0) {
        console.log('No instalaciones found. Response:', response);
        return (
            <Paper withBorder p="xl">
                <Center>
                    <Text c="dimmed">No hay instalaciones registradas.</Text>
                </Center>
            </Paper>
        );
    }

    const rows = instalaciones.map((instalacion) => (
        <Table.Tr key={instalacion.id_instalacion} style={{ cursor: 'pointer' }}>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                {instalacion.caso?.titulo || `Caso #${instalacion.id_caso}`}
            </Table.Td>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                {instalacion.caso?.cliente?.nombre_cliente || instalacion.usuario_b2b?.cliente?.nombre_cliente || 'Sin cliente'}
            </Table.Td>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                {instalacion.caso?.cliente?.vendedor?.usuario?.nombre_completo || instalacion.usuario_b2b?.cliente?.vendedor?.usuario?.nombre_completo || 'Sin vendedor'}
            </Table.Td>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                {instalacion.usuario_b2b?.nombre_completo || 'Sin asignar'}
            </Table.Td>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                <Badge color={getEstadoColor(instalacion.estado)} variant="light">
                    {extractEstadoValue(instalacion.estado)}
                </Badge>
            </Table.Td>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                {instalacion.fecha_solicitud 
                    ? new Date(instalacion.fecha_solicitud).toLocaleDateString('es-CL')
                    : 'Sin fecha'
                }
            </Table.Td>
            <Table.Td>
                <Tooltip label="Ver detalle">
                    <ActionIcon
                        variant="subtle"
                        onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}
                    >
                        <IconEye size={18} />
                    </ActionIcon>
                </Tooltip>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Paper withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Caso</Table.Th>
                            <Table.Th>Cliente</Table.Th>
                            <Table.Th>Vendedor</Table.Th>
                            <Table.Th>Usuario B2B</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Fecha Solicitud</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
            
            {pagination.pages > 1 && (
                <Group justify="center" mt="md">
                    <Pagination
                        total={pagination.pages}
                        value={pagination.page}
                        onChange={onPageChange}
                    />
                </Group>
            )}
        </>
    );
}

