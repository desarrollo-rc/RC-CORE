// frontend/src/features/origenes/pages/OrigenesPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Modal, Affix, Menu, ActionIcon, rem, Text, Button, Table, Tooltip, Paper } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { OrigenForm } from '../components/OrigenForm';
import { getOrigenes, createOrigen, deleteOrigen } from '../services/origenService';
import { getPaises } from '../../paises/services/paisService';
import type { Origen, OrigenFormData } from '../types';
import type { Pais } from '../../paises/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function OrigenesPage() {
    const [origenes, setOrigenes] = useState<Origen[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [origenesData, paisesData] = await Promise.all([getOrigenes(), getPaises()]);
                setOrigenes(origenesData);
                setPaises(paisesData);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Memoizamos la lista de países disponibles para no recalcularla en cada render
    const paisesDisponibles = useMemo(() => {
        const idsOrigenes = new Set(origenes.map(o => o.id_pais));
        return paises.filter(p => !idsOrigenes.has(p.id_pais));
    }, [origenes, paises]);

    const handleSubmit = async (formValues: OrigenFormData) => {
        if (!formValues.id_pais) return;
        setIsSubmitting(true);
        try {
            const nuevoOrigen = await createOrigen({ id_pais: Number(formValues.id_pais) });
            setOrigenes(current => [...current, nuevoOrigen].sort((a, b) => a.pais.nombre_pais.localeCompare(b.pais.nombre_pais)));
            notifications.show({ title: 'Éxito', message: 'Origen añadido.', color: 'green' });
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo añadir el origen.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (origen: Origen) => {
        modals.openConfirmModal({
            title: 'Eliminar Origen',
            children: <Text size="sm">¿Estás seguro de que quieres eliminar a "{origen.pais.nombre_pais}" como origen?</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deleteOrigen(origen.id_origen);
                    setOrigenes(current => current.filter(o => o.id_origen !== origen.id_origen));
                    notifications.show({ title: 'Éxito', message: 'Origen eliminado.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo eliminar el origen.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };
    
    const rows = origenes.map((record) => (
        <Table.Tr key={record.id_origen}>
            <Table.Td>{record.pais.nombre_pais}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Eliminar Origen">
                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(record)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return (
            <Paper withBorder p="md" radius="md">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>País de Origen</Table.Th>
                            <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={2}><Text c="dimmed" ta="center">No se han definido orígenes.</Text></Table.Td></Table.Tr>}
                    </Table.Tbody>
                </Table>
            </Paper>
        );
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Origenes de Producto</Title>
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title="Añadir Nuevo Origen" centered>
                <OrigenForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    paisesDisponibles={paisesDisponibles}
                />
            </Modal>
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                 <Button
                    leftSection={<IconPlus size={16} />}
                    color="red"
                    radius="xl"
                    style={{ height: rem(60), width: rem(60), padding: 0 }}
                    onClick={openModal}
                    disabled={paisesDisponibles.length === 0}
                >
                </Button>
            </Affix>
        </Box>
    );
}