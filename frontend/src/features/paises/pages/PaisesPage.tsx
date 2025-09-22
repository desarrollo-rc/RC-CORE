// frontend/src/features/paises/pages/PaisesPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { PaisesTable } from '../components/PaisesTable';
import { PaisForm } from '../components/PaisForm';
import { getPaises, createPais, updatePais, deletePais } from '../services/paisService';
import type { Pais, PaisPayload, PaisFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function PaisesPage() {
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPais, setEditingPais] = useState<Pais | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getPaises();
                if (isMounted) setPaises(data);
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar los países.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, []);

    const handleSubmit = async (formValues: PaisFormData) => {
        setIsSubmitting(true);
        const payload: PaisPayload = {
            nombre_pais: formValues.nombre_pais
        };
        try {
            if (editingPais) {
                const updated = await updatePais(editingPais.id_pais, payload);
                setPaises(current => current.map(p => p.id_pais === updated.id_pais ? updated : p));
                notifications.show({ title: 'Éxito', message: 'País actualizado.', color: 'blue' });
            } else {
                const newPais = await createPais(payload);
                setPaises(current => [...current, newPais]);
                notifications.show({ title: 'Éxito', message: 'País creado.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar el país.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingPais(null);
        openModal();
    };

    const handleEdit = (pais: Pais) => {
        setEditingPais(pais);
        openModal();
    };

    const handleDelete = (pais: Pais) => {
        modals.openConfirmModal({
            title: 'Eliminar País',
            children: <Text size="sm">¿Estás seguro de que quieres eliminar el país "{pais.nombre_pais}"? Esta acción es permanente.</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deletePais(pais.id_pais);
                    setPaises(current => current.filter(p => p.id_pais !== pais.id_pais));
                    notifications.show({ title: 'Éxito', message: 'País eliminado.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo eliminar el país.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <PaisesTable records={paises} onEdit={handleEdit} onDelete={handleDelete} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Países</Title>
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingPais ? 'Editar País' : 'Crear Nuevo País'} centered>
                <PaisForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingPais}
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
                            Crear País
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}