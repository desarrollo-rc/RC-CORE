// frontend/src/features/calidades/pages/CalidadesPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { CalidadesTable } from '../components/CalidadesTable';
import { CalidadForm } from '../components/CalidadForm';
import { getCalidades, createCalidad, updateCalidad, deactivateCalidad, activateCalidad } from '../services/calidadService';
import type { Calidad, CalidadPayload, CalidadFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function CalidadesPage() {
    const [calidades, setCalidades] = useState<Calidad[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingCalidad, setEditingCalidad] = useState<Calidad | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getCalidades(includeInactive);
                if (isMounted) setCalidades(data);
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar las calidades.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [includeInactive]);

    const handleSubmit = async (formValues: CalidadFormData) => {
        setIsSubmitting(true);
        const payload: CalidadPayload = {
            ...formValues,
            descripcion: formValues.descripcion || null,
        };
        try {
            if (editingCalidad) {
                const updated = await updateCalidad(editingCalidad.id_calidad, payload);
                setCalidades(current => current.map(c => c.id_calidad === updated.id_calidad ? updated : c));
                notifications.show({ title: 'Éxito', message: 'Calidad actualizada.', color: 'blue' });
            } else {
                const newCalidad = await createCalidad(payload);
                setCalidades(current => [...current, newCalidad]);
                notifications.show({ title: 'Éxito', message: 'Calidad creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar la calidad.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingCalidad(null);
        openModal();
    };

    const handleEdit = (calidad: Calidad) => {
        setEditingCalidad(calidad);
        openModal();
    };

    const handleDeactivate = (calidad: Calidad) => {
        modals.openConfirmModal({
            title: 'Desactivar Calidad',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar la calidad "{calidad.nombre_calidad}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateCalidad(calidad.id_calidad);
                    setCalidades(current => current.map(c => c.id_calidad === updated.id_calidad ? updated : c));
                    notifications.show({ title: 'Éxito', message: 'Calidad desactivada.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar la calidad.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const handleActivate = (calidad: Calidad) => {
        modals.openConfirmModal({
            title: 'Activar Calidad',
            children: <Text size="sm">¿Estás seguro de que quieres activar la calidad "{calidad.nombre_calidad}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateCalidad(calidad.id_calidad);
                    setCalidades(current => current.map(c => c.id_calidad === updated.id_calidad ? updated : c));
                    notifications.show({ title: 'Éxito', message: 'Calidad activada.', color: 'green' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar la calidad.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <CalidadesTable records={calidades} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Calidades de Producto</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingCalidad ? 'Editar Calidad' : 'Crear Nueva Calidad'} centered>
                <CalidadForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingCalidad ? {
                        ...editingCalidad,
                        descripcion: editingCalidad.descripcion || ''
                    } : null}
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
                            Crear Calidad
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}