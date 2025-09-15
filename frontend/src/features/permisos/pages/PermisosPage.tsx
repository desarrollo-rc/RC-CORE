// src/features/permisos/pages/PermisosPage.tsx

import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Text, Affix, Menu, ActionIcon, rem, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconAlertCircle, IconFilesOff, IconCheck } from '@tabler/icons-react';
import { PermisosTable } from '../components/PermisosTable';
import { PermisoForm } from '../components/PermisoForm';
import { getPermisos, createPermiso, updatePermiso, deletePermiso } from '../services/permisoService';
import type { Permiso, PermisoPayload } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function PermisosPage() {
    const [permisos, setPermisos] = useState<Permiso[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPermiso, setEditingPermiso] = useState<Permiso | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchPermisos = async () => {
            try {
                const data = await getPermisos();
                if (isMounted) {
                    setPermisos(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError('No se pudieron cargar los permisos.');
                }
                console.error(err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchPermisos();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleOpenModalForCreate = () => {
        setEditingPermiso(null);
        openModal();
    };

    const handleOpenModalForEdit = (permiso: Permiso) => {
        setEditingPermiso(permiso);
        openModal();
    };

    const handleSubmit = async (values: PermisoPayload) => {
        setIsSubmitting(true);
        try {
            if (editingPermiso) {
                const updated = await updatePermiso(editingPermiso.id_permiso, values);
                setPermisos(current => current.map(p => p.id_permiso === updated.id_permiso ? updated : p));
                notifications.show({ title: 'Éxito', message: 'Permiso actualizado.', color: 'blue', icon: <IconCheck /> });
            } else {
                const newPermiso = await createPermiso(values);
                setPermisos(current => [...current, newPermiso]);
                notifications.show({ title: 'Éxito', message: 'Permiso creado.', color: 'green', icon: <IconCheck /> });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar el permiso.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (permiso: Permiso) => {
        modals.openConfirmModal({
            title: 'Eliminar Permiso',
            children: <Text size="sm">¿Estás seguro de que quieres eliminar el permiso "{permiso.nombre_permiso}"? Esta acción es permanente.</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deletePermiso(permiso.id_permiso);
                    setPermisos(current => current.filter(p => p.id_permiso !== permiso.id_permiso));
                    notifications.show({ title: 'Éxito', message: 'Permiso eliminado.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo eliminar el permiso.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) {
            return <Center h={200}><Loader /></Center>;
        }

        if (error) {
            return <Alert color="red" title="Error" icon={<IconAlertCircle />}>{error}</Alert>;
        }

        if (permisos.length === 0) {
            return (
                <Center h={200}>
                    <Box style={{ textAlign: 'center' }}>
                        <IconFilesOff size={48} color="gray" />
                        <Text c="dimmed" mt="sm">No se encontraron permisos.</Text>
                    </Box>
                </Center>
            );
        }

        return (
            <PermisosTable
                records={permisos}
                onEdit={handleOpenModalForEdit}
                onDelete={handleDelete}
            />
        );
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Permisos</Title>
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingPermiso ? 'Editar Permiso' : 'Crear Nuevo Permiso'} centered>
                <PermisoForm 
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingPermiso}
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
                            Crear Permiso
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}