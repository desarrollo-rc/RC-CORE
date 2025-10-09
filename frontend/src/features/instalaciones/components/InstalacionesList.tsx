// frontend/src/features/instalaciones/components/InstalacionesList.tsx
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Table, Badge, Center, Loader, Alert, Paper, Title, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import { getInstalaciones } from '../services/instalacionService';
import type { Instalacion } from '../types';

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

export function InstalacionesList() {
    const navigate = useNavigate();
    const { data: instalaciones, isLoading, error } = useQuery<Instalacion[]>({
        queryKey: ['instalaciones'],
        queryFn: getInstalaciones,
    });

    if (isLoading) {
        return (
            <Center h={200}>
                <Loader />
            </Center>
        );
    }

    if (error) {
        return (
            <Alert color="red" title="Error">
                No se pudieron cargar las instalaciones.
            </Alert>
        );
    }

    if (!instalaciones || instalaciones.length === 0) {
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
                #{instalacion.id_instalacion}
            </Table.Td>
            <Table.Td onClick={() => navigate(`/instalaciones/${instalacion.id_instalacion}`)}>
                {instalacion.caso?.titulo || `Caso #${instalacion.id_caso}`}
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
        <Paper withBorder>
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>ID</Table.Th>
                        <Table.Th>Caso</Table.Th>
                        <Table.Th>Usuario B2B</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Fecha Solicitud</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Paper>
    );
}

