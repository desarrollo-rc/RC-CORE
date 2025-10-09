// frontend/src/features/casos/components/CasosTable.tsx
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
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getCasos, desactivarCaso } from '../services/casoService';
import { CasoForm } from './CasoForm';
import type { Caso } from '../types';

const getEstadoColor = (estado: string) => {
    const colorMap: Record<string, string> = {
        'Abierto': 'blue',
        'En Progreso': 'cyan',
        'Resuelto': 'green',
        'Cerrado': 'gray',
    };
    return colorMap[estado] || 'gray';
};

const getPrioridadColor = (prioridad: string) => {
    const colorMap: Record<string, string> = {
        'Baja': 'gray',
        'Media': 'blue',
        'Alta': 'orange',
        'Urgente': 'red',
    };
    return colorMap[prioridad] || 'gray';
};

export function CasosTable() {
    const queryClient = useQueryClient();
    const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

    const { data: casos, isLoading, error } = useQuery<Caso[]>({
        queryKey: ['casos'],
        queryFn: getCasos,
    });

    const deleteMutation = useMutation({
        mutationFn: desactivarCaso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['casos'] });
            notifications.show({
                title: 'Caso Desactivado',
                message: 'El caso ha sido desactivado exitosamente.',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo desactivar el caso',
                color: 'red',
            });
        },
    });

    const handleEdit = (caso: Caso) => {
        setSelectedCaso(caso);
        openEditModal();
    };

    const handleDelete = (id: number) => {
        if (window.confirm('¿Está seguro de que desea desactivar este caso?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEditSuccess = () => {
        closeEditModal();
        setSelectedCaso(null);
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
                No se pudieron cargar los casos.
            </Alert>
        );
    }

    if (!casos || casos.length === 0) {
        return (
            <Paper withBorder p="xl">
                <Center>
                    <Text c="dimmed">No hay casos registrados.</Text>
                </Center>
            </Paper>
        );
    }

    const rows = casos.map((caso) => (
        <Table.Tr key={caso.id_caso}>
            <Table.Td>#{caso.id_caso}</Table.Td>
            <Table.Td>{caso.titulo}</Table.Td>
            <Table.Td>
                {caso.cliente?.nombre_cliente || `Cliente #${caso.id_cliente}`}
            </Table.Td>
            <Table.Td>
                <Badge color={getEstadoColor(caso.estado)} variant="light">
                    {caso.estado}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={getPrioridadColor(caso.prioridad)} variant="light">
                    {caso.prioridad}
                </Badge>
            </Table.Td>
            <Table.Td>
                {new Date(caso.fecha_creacion).toLocaleDateString('es-CL')}
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Editar">
                        <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(caso)}
                        >
                            <IconEdit size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Desactivar">
                        <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(caso.id_caso)}
                        >
                            <IconTrash size={18} />
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
                            <Table.Th>Título</Table.Th>
                            <Table.Th>Cliente</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Prioridad</Table.Th>
                            <Table.Th>Fecha Creación</Table.Th>
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
                    setSelectedCaso(null);
                }}
                title="Editar Caso"
                size="lg"
                centered
            >
                {selectedCaso && <CasoForm caso={selectedCaso} onSuccess={handleEditSuccess} />}
            </Modal>
        </>
    );
}

