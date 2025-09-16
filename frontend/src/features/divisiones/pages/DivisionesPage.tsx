// src/features/productos/divisiones/pages/DivisionesPage.tsx

import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Text, Affix, Menu, ActionIcon, rem, Modal, Switch } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconCheck } from '@tabler/icons-react';
import { DivisonesTable } from '../components/DivisionesTable';
import { DivisionForm } from '../components/DivisionForm';
import { getDivisiones, createDivision, updateDivision, deactivateDivision, activateDivision } from '../services/divisionService';
import type { Division, DivisionPayload, DivisionFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function DivisionesPage() {
    const [divisiones, setDivisiones] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDivision, setEditingDivision] = useState<Division | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchDivisiones = async () => {
            try {
                setError(null);
                const data = await getDivisiones(includeInactive);
                if (isMounted) {
                    setDivisiones(data);
                    setError(null);
                }
            } catch (err) {
                if (isMounted) {
                    setError('No se pudieron cargar las divisiones. Intente de nuevo más tarde.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDivisiones();

        return () => {
            isMounted = false;
        };
    }, [includeInactive]);

    const handleSubmit = async (formValues: DivisionFormData) => {
        setIsSubmitting(true);
        const payload = {
            codigo_division: formValues.codigo_division.trim(),
            nombre_division: formValues.nombre_division.trim(),
        }

        try {
            if (editingDivision) {
                const updated = await updateDivision(editingDivision.id_division, payload);
                setDivisiones(current => current.map(d => d.id_division === updated.id_division ? updated : d));
                notifications.show({ title: 'Éxito', message: 'División actualizada.', color: 'blue' });
            } else {
                const newDivision = await createDivision(payload);
                setDivisiones(current => [...current, newDivision]);
                notifications.show({ title: 'Éxito', message: 'División creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar la división.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingDivision(null);
        openModal();
    };
    
    const handleEdit = (division: Division) => {
        setEditingDivision(division);
        openModal();
    };
    
    const handleActivate = (division: Division) => {
        modals.openConfirmModal({
            title: 'Activar División',
            children: <Text size="sm">¿Estás seguro de que quieres activar la división "{division.nombre_division}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const activated = await activateDivision(division.id_division);
                    setDivisiones(current => current.map(d => d.id_division === activated.id_division ? activated : d));
                    notifications.show({ title: 'Éxito', message: 'División activada.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar la división.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };
    
    const handleDeactivate = (division: Division) => {
        modals.openConfirmModal({
            title: 'Desactivar División',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar la división "{division.nombre_division}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const deactivated = await deactivateDivision(division.id_division);
                    setDivisiones(current => current.map(d => d.id_division === deactivated.id_division ? deactivated : d));
                    notifications.show({ title: 'Éxito', message: 'División desactivada.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar la división.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <DivisonesTable
            records={divisiones}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
            onActivate={handleActivate}
        />
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Divisiones de Producto</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            
            {renderContent()}

            <Modal opened={modalOpened} onClose={closeModal} title={editingDivision ? 'Editar División' : 'Crear Nueva División'} centered>
                <DivisionForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingDivision}
                />
            </Modal>
            
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <Menu>
                    <Menu.Target>
                        <ActionIcon color="red" size={60} radius="xl" variant="filled">
                            <IconPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Item leftSection={<IconPlus size={14} />} onClick={handleOpenModalForCreate}>
                            Crear División
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}