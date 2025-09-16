// src/features/productos/atributos/pages/AtributosPage.tsx

import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, Menu, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { AtributosTable } from '../components/AtributosTable';
import { AtributoForm } from '../components/AtributoForm';
import { getAtributos, createAtributo, updateAtributo, deactivateAtributo, activateAtributo } from '../services/atributoService';
import type { Atributo, AtributoPayload, AtributoFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function AtributosPage() {
    const [atributos, setAtributos] = useState<Atributo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingAtributo, setEditingAtributo] = useState<Atributo | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await getAtributos(includeInactive);
                if (isMounted) {
                    setAtributos(data);
                }
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar los atributos.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchData();
        return () => { isMounted = false; };
    }, [includeInactive]);

    const handleOpenModalForCreate = () => {
        setEditingAtributo(null);
        openModal();
    };

    const handleEdit = (atributo: Atributo) => {
        setEditingAtributo(atributo);
        openModal();
    };

    const handleSubmit = async (formValues: AtributoFormData) => {
        setIsSubmitting(true);
        const payload = {
            nombre: formValues.nombre.trim(),
        };
        try {
            if (editingAtributo) {  
                const updated = await updateAtributo(editingAtributo?.id_atributo || 0, payload);
                setAtributos(current => current.map(a => a.id_atributo === updated.id_atributo ? updated : a));
                notifications.show({ title: 'Éxito', message: 'Atributo actualizado.', color: 'blue' });
            } else {
                const newAtributo = await createAtributo(payload);
                setAtributos(current => [...current, newAtributo]);
                notifications.show({ title: 'Éxito', message: 'Atributo creado.', color: 'green' });
            }
            closeModal();
        } catch (error) {   
            const message = getApiErrorMessage(error, 'No se pudo guardar el atributo.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = (atributo: Atributo) => {
        modals.openConfirmModal({
            title: 'Desactivar Atributo',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar el atributo "{atributo.nombre}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateAtributo(atributo.id_atributo);
                    setAtributos(current => current.map(a => a.id_atributo === updated.id_atributo ? updated : a));
                    notifications.show({ title: 'Éxito', message: 'Atributo desactivado.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar el atributo.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    }

    const handleActivate = (atributo: Atributo) => {
        modals.openConfirmModal({
            title: 'Activar Atributo',
            children: <Text size="sm">¿Estás seguro de que quieres activar el atributo "{atributo.nombre}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateAtributo(atributo.id_atributo);
                    setAtributos(current => current.map(a => a.id_atributo === updated.id_atributo ? updated : a));
                    notifications.show({ title: 'Éxito', message: 'Atributo activado.', color: 'green' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar el atributo.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    }
    
    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <AtributosTable records={atributos} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Atributos de Producto</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            
            {renderContent()}

            <Modal opened={modalOpened} onClose={closeModal} title={editingAtributo ? 'Editar Atributo' : 'Crear Nuevo Atributo'} centered>
                <AtributoForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingAtributo}
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
                            Crear Atributo
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}