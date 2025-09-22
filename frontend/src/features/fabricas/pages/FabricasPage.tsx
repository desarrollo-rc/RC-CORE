// frontend/src/features/fabricas/pages/FabricasPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { FabricasTable } from '../components/FabricasTable';
import { FabricaForm } from '../components/FabricaForm';
import { getFabricas, createFabrica, updateFabrica, deactivateFabrica, activateFabrica } from '../services/fabricaService';
import { getPaises } from '../../paises/services/paisService';
import type { Fabrica, FabricaPayload, FabricaFormData } from '../types';
import type { Pais } from '../../paises/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function FabricasPage() {
    const [fabricas, setFabricas] = useState<Fabrica[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingFabrica, setEditingFabrica] = useState<Fabrica | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [fabricasData, paisesData] = await Promise.all([
                    getFabricas(includeInactive),
                    getPaises()
                ]);
                if (isMounted) {
                    setFabricas(fabricasData);
                    setPaises(paisesData);
                }
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar los datos necesarios.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [includeInactive]);

    const handleSubmit = async (formValues: FabricaFormData) => {
        setIsSubmitting(true);
        const payload: FabricaPayload = {
            nombre_fabrica: formValues.nombre_fabrica,
            id_pais: Number(formValues.id_pais),
        };
        try {
            if (editingFabrica) {
                const updated = await updateFabrica(editingFabrica.id_fabrica, payload);
                setFabricas(current => current.map(f => f.id_fabrica === updated.id_fabrica ? updated : f));
                notifications.show({ title: 'Éxito', message: 'Fábrica actualizada.', color: 'blue' });
            } else {
                const newFabrica = await createFabrica(payload);
                setFabricas(current => [...current, newFabrica]);
                notifications.show({ title: 'Éxito', message: 'Fábrica creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar la fábrica.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingFabrica(null);
        openModal();
    };

    const handleEdit = (fabrica: Fabrica) => {
        setEditingFabrica(fabrica);
        openModal();
    };

    const handleDeactivate = (fabrica: Fabrica) => {
        modals.openConfirmModal({
            title: 'Desactivar Fábrica',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar la fábrica "{fabrica.nombre_fabrica}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateFabrica(fabrica.id_fabrica);
                    setFabricas(current => current.map(f => f.id_fabrica === updated.id_fabrica ? updated : f));
                    notifications.show({ title: 'Éxito', message: 'Fábrica desactivada.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar la fábrica.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const handleActivate = (fabrica: Fabrica) => {
        modals.openConfirmModal({
            title: 'Activar Fábrica',
            children: <Text size="sm">¿Estás seguro de que quieres activar la fábrica "{fabrica.nombre_fabrica}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateFabrica(fabrica.id_fabrica);
                    setFabricas(current => current.map(f => f.id_fabrica === updated.id_fabrica ? updated : f));
                    notifications.show({ title: 'Éxito', message: 'Fábrica activada.', color: 'green' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar la fábrica.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <FabricasTable 
                    records={fabricas} 
                    paises={paises}
                    onEdit={handleEdit} 
                    onDeactivate={handleDeactivate} 
                    onActivate={handleActivate} 
                />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Fábricas</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingFabrica ? 'Editar Fábrica' : 'Crear Nueva Fábrica'} centered>
                <FabricaForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingFabrica ? {
                        nombre_fabrica: editingFabrica.nombre_fabrica,
                        id_pais: editingFabrica.id_pais.toString()
                    } : null}
                    paises={paises}
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
                            Crear Fábrica
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}