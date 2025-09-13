// src/features/areas/pages/AreasPage.tsx

import { useEffect, useState, useMemo } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Pagination, Stack, Text, Affix, Menu, ActionIcon, rem, Modal, Switch, Flex } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks'; // Hook para el modal
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconCheck } from '@tabler/icons-react';
import { AreasTable } from '../components/AreasTable';
import { getAreas, createArea, updateArea, deactivateArea, activateArea } from '../services/areaService'; // Importar todos los servicios
import { AreaForm } from '../components/AreaForm';
import type { Area, AreaPayload } from '../types';
import type { DataTableSortStatus } from 'mantine-datatable';
import { orderBy } from 'lodash';

const PAGE_SIZE = 10;

export function AreasPage() {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'nombre_area', direction: 'asc' });
    const [selectedRecord, setSelectedRecord] = useState<Area | null>(null); // NUEVO ESTADO
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null); // Estado para saber si estamos editando
    const [includeInactive, setIncludeInactive] = useState(false); 

    useEffect(() => {
        let isMounted = true;
        const fetchAreas = async () => {
            try {
                setError(null);
                const data = await getAreas(includeInactive);
                if (isMounted) {
                    setAreas(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError('No se pudieron cargar las áreas. Intente de nuevo más tarde.');
                }
                console.error(err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchAreas();

        return () => {
            isMounted = false;
        };
    }, [includeInactive]);

    const handleOpenModalForCreate = () => {
        setEditingArea(null); // Nos aseguramos que no haya un área en modo edición
        openModal();
    };

    const handleOpenModalForEdit = (area: Area) => {
        setEditingArea(area); // Guardamos el área a editar
        openModal();
    };

    const handleRecordClick = (area: Area) => {
        // Si el usuario vuelve a hacer clic en la misma fila, la deseleccionamos
        if (selectedRecord?.id_area === area.id_area) {
            setSelectedRecord(null);
        } else {
            setSelectedRecord(area);
        }
    };

    const sortedAndPaginatedRecords = useMemo(() => {
        const sorted = orderBy(areas, sortStatus.columnAccessor, sortStatus.direction);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        return sorted.slice(from, to);
    }, [areas, page, sortStatus]);

    const handleSubmit = async (values: AreaPayload) => {
        setIsSubmitting(true);
        try {
            if (editingArea) { // MODO EDICIÓN
                const updatedArea = await updateArea(editingArea.id_area, values);
                setAreas((current) => current.map((item) => (item.id_area === updatedArea.id_area ? updatedArea : item)));
                notifications.show({ title: 'Éxito', message: 'Área actualizada.', color: 'blue' });
            } else { // MODO CREACIÓN
                const newArea = await createArea(values);
                setAreas((current) => [...current, newArea]);
                notifications.show({ title: 'Éxito', message: 'Área creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'No se pudo guardar el área.', color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = (area: Area) => {
        modals.openConfirmModal({
            title: 'Desactivar Área',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar el área "{area.nombre_area}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deactivateArea(area.id_area);
                    setAreas((current) => current.map((item) => (item.id_area === area.id_area ? { ...item, activo: false } : item)));
                    notifications.show({ title: 'Éxito', message: 'Área desactivada.', color: 'orange' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: 'No se pudo desactivar el área.', color: 'red' });
                }
            },
        });
    };

    const handleActivate = (area: Area) => {
        modals.openConfirmModal({
            title: 'Activar Área',
            children: <Text size="sm">¿Estás seguro de que quieres activar el área "{area.nombre_area}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const activatedArea = await activateArea(area.id_area);
                    // Actualizamos el estado local para reflejar el cambio al instante
                    setAreas((current) => current.map((item) => (item.id_area === area.id_area ? activatedArea : item)));
                    notifications.show({ title: 'Éxito', message: 'Área activada correctamente.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: 'No se pudo activar el área.', color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        if (areas.length === 0) return <Center h={200}><Text>No se encontraron áreas.</Text></Center>;

        return (
            <Stack>
                <AreasTable
                    records={sortedAndPaginatedRecords}
                    sortStatus={sortStatus}
                    selectedRecord={selectedRecord}
                    onRecordClick={handleRecordClick}
                    onSortStatusChange={setSortStatus}
                    onEdit={handleOpenModalForEdit}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                />
                <Group justify="center">
                    <Pagination
                        total={Math.ceil(areas.length / PAGE_SIZE)}
                        value={page}
                        onChange={setPage}
                        mt="sm"
                    />
                </Group>
            </Stack>
        );
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Áreas</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title="Crear Nueva Área" centered>
                <AreaForm 
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingArea}
                />
            </Modal>
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <Menu shadow="md" width={200}>
                    <Menu.Target>
                        <ActionIcon color="red" size={60} radius="xl" variant="filled">
                            <IconPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Acciones</Menu.Label>
                        <Menu.Item leftSection={<IconPlus size={14} />} onClick={handleOpenModalForCreate}>
                            Crear Área
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}