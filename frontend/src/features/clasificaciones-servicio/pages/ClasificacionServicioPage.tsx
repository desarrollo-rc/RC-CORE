// frontend/src/features/clasificaciones-servicio/pages/ClasificacionServicioPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { ClasificacionServicioTable } from '../components/ClasificacionServicioTable';
import { ClasificacionServicioForm } from '../components/ClasificacionServicioForm';
import { getClasificacionesServicio, createClasificacionServicio, updateClasificacionServicio, deactivateClasificacionServicio, activateClasificacionServicio } from '../services/clasificacionServicioService';
import type { ClasificacionServicio, ClasificacionServicioPayload, ClasificacionServicioFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function ClasificacionServicioPage() {
    const [clasificaciones, setClasificaciones] = useState<ClasificacionServicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ClasificacionServicio | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getClasificacionesServicio(includeInactive);
                setClasificaciones(data);
            } catch (err) {
                setError('No se pudieron cargar las clasificaciones.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: ClasificacionServicioFormData) => {
        setIsSubmitting(true);
        const payload: ClasificacionServicioPayload = { ...formValues };
        try {
            if (editingRecord) {
                const updated = await updateClasificacionServicio(editingRecord.id, payload);
                setClasificaciones(current => current.map(item => item.id === updated.id ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Clasificación actualizada.', color: 'blue' });
            } else {
                const newData = await createClasificacionServicio(payload);
                setClasificaciones(current => [...current, newData]);
                notifications.show({ title: 'Éxito', message: 'Clasificación creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar la clasificación.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingRecord(null);
        openModal();
    };

    const handleEdit = (record: ClasificacionServicio) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: ClasificacionServicio) => {
        modals.openConfirmModal({
            title: 'Desactivar Clasificación',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar "{record.nombre}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateClasificacionServicio(record.id);
                    setClasificaciones(current => current.map(item => item.id === updated.id ? updated : item));
                    notifications.show({ title: 'Éxito', message: 'Clasificación desactivada.', color: 'orange' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar.'), color: 'red' });
                }
            },
        });
    };

    const handleActivate = (record: ClasificacionServicio) => {
        modals.openConfirmModal({
            title: 'Activar Clasificación',
            children: <Text size="sm">¿Estás seguro de que quieres activar "{record.nombre}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await activateClasificacionServicio(record.id);
                    setClasificaciones(current => current.map(item => item.id === updated.id ? updated : item));
                    notifications.show({ title: 'Éxito', message: 'Clasificación activada.', color: 'green' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar.'), color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <ClasificacionServicioTable records={clasificaciones} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Clasificaciones de Servicio</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Clasificación' : 'Crear Nueva Clasificación'} centered>
                <ClasificacionServicioForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord}
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
                        <Menu.Item leftSection={<IconPlus size={14} />} onClick={handleOpenModalForCreate}>
                            Crear Clasificación
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}