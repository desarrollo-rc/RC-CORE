// frontend/src/features/tipos-caso/components/TiposCasoTable.tsx
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
    Code
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconX, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { getTiposCaso, activarTipoCaso, desactivarTipoCaso } from '../services/tipoCasoService';
import { TipoCasoForm } from './TipoCasoForm';
import type { TipoCaso } from '../types';

// Helper para extraer el valor del enum del formato backend
const extractEnumValue = (value: string | null): string | null => {
    if (!value) return null;
    
    // Si viene con el prefijo de la clase, extraer solo el valor
    if (value.includes('CategoriaTipoCaso.')) {
        return value.replace('CategoriaTipoCaso.', '');
    }
    
    return value;
};

// Helper para obtener label amigable de la categoría
const getCategoriaLabel = (categoria: string | null): string => {
    const cleanCategoria = extractEnumValue(categoria);
    
    const labels: Record<string, string> = {
        'INSTALACION_CLIENTE_NUEVO': '🆕 Instalación Cliente Nuevo',
        'INSTALACION_USUARIO_NUEVO': '👤 Instalación Usuario Nuevo',
        'INSTALACION_USUARIO_ADICIONAL': '➕ Instalación Usuario Adicional',
        'INSTALACION_CAMBIO_EQUIPO': '🔄 Instalación Cambio de Equipo',
        'SOPORTE_TECNICO': '🔧 Soporte Técnico',
        'CONSULTA': '💬 Consulta',
        'BLOQUEO': '🔒 Bloqueo',
        'OTRO': '📋 Otro',
    };
    return cleanCategoria ? labels[cleanCategoria] || cleanCategoria : 'Sin categoría';
};

export function TiposCasoTable() {
    const queryClient = useQueryClient();
    const [selectedTipo, setSelectedTipo] = useState<TipoCaso | null>(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

    const { data: tiposCaso, isLoading, error } = useQuery<TipoCaso[]>({
        queryKey: ['tipos-caso'],
        queryFn: getTiposCaso,
    });


    const activarMutation = useMutation({
        mutationFn: activarTipoCaso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tipos-caso'] });
            notifications.show({
                title: 'Tipo Activado',
                message: 'El tipo de caso ha sido activado exitosamente.',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo activar el tipo de caso',
                color: 'red',
            });
        },
    });

    const desactivarMutation = useMutation({
        mutationFn: desactivarTipoCaso,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tipos-caso'] });
            notifications.show({
                title: 'Tipo Desactivado',
                message: 'El tipo de caso ha sido desactivado.',
                color: 'orange',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo desactivar el tipo de caso',
                color: 'red',
            });
        },
    });

    const handleEdit = (tipo: TipoCaso) => {
        setSelectedTipo(tipo);
        openEditModal();
    };

    const handleToggleActivo = (tipo: TipoCaso) => {
        if (tipo.activo) {
            if (window.confirm('¿Está seguro de que desea desactivar este tipo de caso?')) {
                desactivarMutation.mutate(tipo.id_tipo_caso);
            }
        } else {
            activarMutation.mutate(tipo.id_tipo_caso);
        }
    };

    const handleEditSuccess = () => {
        closeEditModal();
        setSelectedTipo(null);
    };

    if (isLoading) {
        return <Center h={200}><Loader /></Center>;
    }

    if (error) {
        return (
            <Alert color="red" title="Error">
                No se pudieron cargar los tipos de caso.
            </Alert>
        );
    }

    if (!tiposCaso || tiposCaso.length === 0) {
        return (
            <Paper withBorder p="xl">
                <Center>
                    <Text c="dimmed">No hay tipos de caso registrados. Cree el primero.</Text>
                </Center>
            </Paper>
        );
    }

    const rows = tiposCaso.map((tipo) => (
        <Table.Tr key={tipo.id_tipo_caso}>
            <Table.Td>#{tipo.id_tipo_caso}</Table.Td>
            <Table.Td><Code>{tipo.codigo_tipo_caso}</Code></Table.Td>
            <Table.Td>{tipo.nombre_tipo_caso}</Table.Td>
            <Table.Td>
                {tipo.categoria_uso ? (
                    <Badge variant="dot" size="sm">
                        {getCategoriaLabel(tipo.categoria_uso)}
                    </Badge>
                ) : (
                    <Text size="sm" c="dimmed">Sin categoría</Text>
                )}
            </Table.Td>
            <Table.Td>
                <Text size="sm" c="dimmed" lineClamp={2}>
                    {tipo.descripcion_tipo_caso || '-'}
                </Text>
            </Table.Td>
            <Table.Td>
                <Badge color={tipo.activo ? 'green' : 'red'} variant="light">
                    {tipo.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Tooltip label="Editar">
                        <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(tipo)}
                        >
                            <IconEdit size={18} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label={tipo.activo ? 'Desactivar' : 'Activar'}>
                        <ActionIcon
                            variant="subtle"
                            color={tipo.activo ? 'red' : 'green'}
                            onClick={() => handleToggleActivo(tipo)}
                        >
                            {tipo.activo ? <IconX size={18} /> : <IconCheck size={18} />}
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
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>Categoría</Table.Th>
                            <Table.Th>Descripción</Table.Th>
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
                    setSelectedTipo(null);
                }}
                title="Editar Tipo de Caso"
                size="lg"
                centered
            >
                {selectedTipo && <TipoCasoForm tipoCaso={selectedTipo} onSuccess={handleEditSuccess} />}
            </Modal>
        </>
    );
}

