// frontend/src/features/equipos/components/EquiposTable.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Table, 
    Badge, 
    Center, 
    Loader, 
    Alert, 
    Paper, 
    ActionIcon, 
    Tooltip, 
    Group, 
    Text,
    Modal,
    LoadingOverlay
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconX, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getEquipos, activarEquipo, desactivarEquipo } from '../services/equipoService';
import { EquipoForm } from './EquipoForm';
import type { Equipo } from '../types';

const getEstadoAltaColor = (estado: string) => {
    const colorMap: Record<string, string> = {
        'PENDIENTE': 'yellow',
        'APROBADO': 'green',
        'RECHAZADO': 'red',
    };
    return colorMap[estado] || 'gray';
};

interface EquiposTableProps {
    equipos: Equipo[];
    onEdit?: (equipo: Equipo) => void;
}

export function EquiposTable({ equipos, onEdit }: EquiposTableProps) {
    const queryClient = useQueryClient();
    const [loadingEquipoId, setLoadingEquipoId] = useState<number | null>(null);

    const activarMutation = useMutation({
        mutationFn: activarEquipo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
            setLoadingEquipoId(null);
            notifications.show({
                title: 'Equipo Activado',
                message: 'El equipo ha sido activado exitosamente.',
                color: 'green',
            });
        },
        onError: (error: any) => {
            setLoadingEquipoId(null);
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo activar el equipo',
                color: 'red',
            });
        },
    });

    const desactivarMutation = useMutation({
        mutationFn: desactivarEquipo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
            setLoadingEquipoId(null);
            notifications.show({
                title: 'Equipo Desactivado',
                message: 'El equipo ha sido desactivado exitosamente.',
                color: 'orange',
            });
        },
        onError: (error: any) => {
            setLoadingEquipoId(null);
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo desactivar el equipo',
                color: 'red',
            });
        },
    });

    const handleEdit = (equipo: Equipo) => {
        if (onEdit) {
            onEdit(equipo);
        }
    };

    const handleToggleActivo = (equipo: Equipo) => {
        if (loadingEquipoId !== null) {
            return; // Ya hay una operación en curso
        }
        
        if (equipo.activo) {
            if (window.confirm('¿Está seguro de que desea desactivar este equipo?')) {
                setLoadingEquipoId(equipo.id_equipo);
                desactivarMutation.mutate(equipo.id_equipo);
            }
        } else {
            setLoadingEquipoId(equipo.id_equipo);
            activarMutation.mutate(equipo.id_equipo);
        }
    };

    if (!equipos || equipos.length === 0) {
        return (
            <Paper withBorder p="xl">
                <Center>
                    <Text c="dimmed">No hay equipos registrados.</Text>
                </Center>
            </Paper>
        );
    }

    const rows = equipos.map((equipo) => (
        <Table.Tr key={equipo.id_equipo}>
            <Table.Td>#{equipo.id_equipo}</Table.Td>
            <Table.Td>{equipo.nombre_equipo}</Table.Td>
            <Table.Td>{equipo.mac_address}</Table.Td>
            <Table.Td>
                {equipo.usuario_b2b?.usuario || `Usuario #${equipo.id_usuario_b2b}`}
            </Table.Td>
            <Table.Td>
                {equipo.usuario_b2b?.nombre_completo || 'N/A'}
            </Table.Td>
            <Table.Td>
                <Badge color={getEstadoAltaColor(equipo.estado_alta)} variant="light">
                    {equipo.estado_alta}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={equipo.activo ? 'green' : 'red'} variant="light">
                    {equipo.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Editar">
                        <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(equipo)}
                            disabled={loadingEquipoId !== null}
                        >
                            <IconEdit size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={equipo.activo ? 'Desactivar' : 'Activar'}>
                        <ActionIcon
                            variant="subtle"
                            color={equipo.activo ? 'red' : 'green'}
                            onClick={() => handleToggleActivo(equipo)}
                            disabled={loadingEquipoId !== null}
                            loading={loadingEquipoId === equipo.id_equipo}
                        >
                            {equipo.activo ? <IconX size={18} /> : <IconCheck size={18} />}
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Paper withBorder pos="relative">
                <LoadingOverlay 
                    visible={loadingEquipoId !== null} 
                    overlayProps={{ radius: 'sm', blur: 2 }}
                    loaderProps={{ size: 'lg' }}
                    zIndex={1000}
                />
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>MAC Address</Table.Th>
                            <Table.Th>Usuario B2B</Table.Th>
                            <Table.Th>Nombre Usuario</Table.Th>
                            <Table.Th>Estado Alta</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>

        </>
    );
}

