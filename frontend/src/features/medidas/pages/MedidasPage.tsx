// src/features/productos/medidas/pages/MedidasPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { MedidasTable } from '../components/MedidasTable';
import { MedidaForm } from '../components/MedidaForm';
import { getMedidas, createMedida, updateMedida, deactivateMedida, activateMedida } from '../services/medidaService';
import type { Medida, MedidaPayload, MedidaFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function MedidasPage() {
    const [medidas, setMedidas] = useState<Medida[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMedida, setEditingMedida] = useState<Medida | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getMedidas(includeInactive);
                if (isMounted) setMedidas(data);
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar las medidas.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [includeInactive]);

    const handleSubmit = async (formValues: MedidaFormData) => {
        setIsSubmitting(true);
        const payload: MedidaPayload = {
            codigo: formValues.codigo.trim(),
            nombre: formValues.nombre.trim(),
            unidad: formValues.unidad.trim(),
        };
        try {
            if (editingMedida) {
            const updated = await updateMedida(editingMedida?.id_medida || 0, payload);
                setMedidas(current => current.map(m => m.id_medida === updated.id_medida ? updated : m));
                notifications.show({ title: 'Éxito', message: 'Medida actualizada.', color: 'blue' });
            } else {
                const newMedida = await createMedida(payload);
                setMedidas(current => [...current, newMedida]);
                notifications.show({ title: 'Éxito', message: 'Medida creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar la medida.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingMedida(null);
        openModal();
    };

    const handleEdit = (medida: Medida) => {
        setEditingMedida(medida);
        openModal();
    };

    const handleDeactivate = (medida: Medida) => {
        modals.openConfirmModal({
            title: 'Desactivar Medida',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar la medida "{medida.codigo}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateMedida(medida.id_medida);
                    setMedidas(current => current.map(m => m.id_medida === updated.id_medida ? updated : m));
                    notifications.show({ title: 'Éxito', message: 'Medida desactivada.', color: 'blue' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar la medida.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const handleActivate = (medida: Medida) => {
        modals.openConfirmModal({
            title: 'Activar Medida',
            children: <Text size="sm">¿Estás seguro de que quieres activar la medida "{medida.codigo}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateMedida(medida.id_medida);
                    setMedidas(current => current.map(m => m.id_medida === updated.id_medida ? updated : m));
                    notifications.show({ title: 'Éxito', message: 'Medida activada.', color: 'blue' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar la medida.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <MedidasTable records={medidas} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Medidas de Producto</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingMedida ? 'Editar Medida' : 'Crear Nueva Medida'} centered>
                <MedidaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={editingMedida} />
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
                            Crear Medida
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}