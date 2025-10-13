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
    Modal 
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

export function EquiposTable() {
    const queryClient = useQueryClient();
    const [selectedEquipo, setSelectedEquipo] = useState<Equipo | null>(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

    const { data: equipos, isLoading, error } = useQuery<Equipo[]>({
        queryKey: ['equipos'],
        queryFn: getEquipos,
    });

    const activarMutation = useMutation({
        mutationFn: activarEquipo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['equipos'] });
            notifications.show({
                title: 'Equipo Activado',
                message: 'El equipo ha sido activado exitosamente.',
                color: 'green',
            });
        },
        onError: (error: any) => {
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
            notifications.show({
                title: 'Equipo Desactivado',
                message: 'El equipo ha sido desactivado exitosamente.',
                color: 'orange',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo desactivar el equipo',
                color: 'red',
            });
        },
    });

    const handleEdit = (equipo: Equipo) => {
        setSelectedEquipo(equipo);
        openEditModal();
    };

    const handleToggleActivo = (equipo: Equipo) => {
        if (equipo.activo) {
            if (window.confirm('¿Está seguro de que desea desactivar este equipo?')) {
                desactivarMutation.mutate(equipo.id_equipo);
            }
        } else {
            activarMutation.mutate(equipo.id_equipo);
        }
    };

    const handleEditSuccess = () => {
        closeEditModal();
        setSelectedEquipo(null);
    };

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
                No se pudieron cargar los equipos.
            </Alert>
        );
    }

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
                        >
                            <IconEdit size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={equipo.activo ? 'Desactivar' : 'Activar'}>
                        <ActionIcon
                            variant="subtle"
                            color={equipo.activo ? 'red' : 'green'}
                            onClick={() => handleToggleActivo(equipo)}
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
            <Paper withBorder>
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

            <Modal
                opened={editModalOpened}
                onClose={() => {
                    closeEditModal();
                    setSelectedEquipo(null);
                }}
                title="Editar Equipo"
                size="lg"
                centered
            >
                {selectedEquipo && <EquipoForm equipo={selectedEquipo} onSuccess={handleEditSuccess} />}
            </Modal>
        </>
    );
}

