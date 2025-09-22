// frontend/src/features/marcas/pages/MarcasPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { MarcasTable } from '../components/MarcasTable';
import { MarcaForm } from '../components/MarcaForm';
import { getMarcas, createMarca, updateMarca, deactivateMarca, activateMarca } from '../services/marcaService';
import type { Marca, MarcaPayload, MarcaFormData, AmbitoMarca } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function MarcasPage() {
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getMarcas(includeInactive);
                if (isMounted) setMarcas(data);
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar las marcas.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [includeInactive]);

    const handleSubmit = async (formValues: MarcaFormData) => {
        setIsSubmitting(true);
        const payload: MarcaPayload = {
            codigo_marca: formValues.codigo_marca,
            nombre_marca: formValues.nombre_marca,
            descripcion: formValues.descripcion || null,
            ambito_marca: formValues.ambito_marca as AmbitoMarca,
            
            tier_marca: null,
            id_pais_origen: null,
            url_imagen: null,
        };
        try {
            if (editingMarca) {
                const updated = await updateMarca(editingMarca.id_marca, payload);
                setMarcas(current => current.map(m => m.id_marca === updated.id_marca ? updated : m));
                notifications.show({ title: 'Éxito', message: 'Marca actualizada.', color: 'blue' });
            } else {
                const newMarca = await createMarca(payload);
                setMarcas(current => [...current, newMarca]);
                notifications.show({ title: 'Éxito', message: 'Marca creada.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar la marca.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingMarca(null);
        openModal();
    };

    const handleEdit = (marca: Marca) => {
        setEditingMarca(marca);
        openModal();
    };

    const handleDeactivate = (marca: Marca) => {
        modals.openConfirmModal({
            title: 'Desactivar Marca',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar la marca "{marca.nombre_marca}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateMarca(marca.id_marca);
                    setMarcas(current => current.map(m => m.id_marca === updated.id_marca ? updated : m));
                    notifications.show({ title: 'Éxito', message: 'Marca desactivada.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar la marca.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const handleActivate = (marca: Marca) => {
        modals.openConfirmModal({
            title: 'Activar Marca',
            children: <Text size="sm">¿Estás seguro de que quieres activar la marca "{marca.nombre_marca}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateMarca(marca.id_marca);
                    setMarcas(current => current.map(m => m.id_marca === updated.id_marca ? updated : m));
                    notifications.show({ title: 'Éxito', message: 'Marca activada.', color: 'green' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar la marca.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <MarcasTable records={marcas} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Marcas de Producto</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingMarca ? 'Editar Marca' : 'Crear Nueva Marca'} centered>
                <MarcaForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingMarca ? {
                        ...editingMarca,
                        descripcion: editingMarca.descripcion || ''
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
                            Crear Marca
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}