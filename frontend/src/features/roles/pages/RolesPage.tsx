// src/features/roles/pages/RolesPage.tsx

import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Affix, Menu, ActionIcon, rem, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { RolesTable } from '../components/RolesTable';
import { RolForm } from '../components/RolForm';
import { getRoles, createRol, updateRol, deleteRol } from '../services/rolService';
import { getPermisos } from '../../permisos/services/permisoService';
import type { Rol, RolPayload, RolFormData } from '../types';
import type { Permiso } from '../../permisos/types';
import { modals } from '@mantine/modals';
import { getApiErrorMessage } from '../../../utils/errorHandler'; // Importar la utilidad


export function RolesPage() {
    const [roles, setRoles] = useState<Rol[]>([]);
    const [availablePermisos, setAvailablePermisos] = useState<Permiso[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRol, setEditingRol] = useState<Rol | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                // Hacemos ambas llamadas a la API en paralelo
                const [rolesData, permisosData] = await Promise.all([
                    getRoles(),
                    getPermisos()
                ]);

                if (isMounted) {
                    setRoles(rolesData);
                    setAvailablePermisos(permisosData);
                }
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar los datos.');
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, []);

    const handleOpenModalForCreate = () => {
        setEditingRol(null);
        openModal();
    };

    const handleEdit = (rol: Rol) => {
        setEditingRol(rol);
        openModal();
    };
    
    const handleSubmit = async (formValues: RolFormData) => { // 1. Recibe datos del formulario (RolFormData)
        setIsSubmitting(true);
        
        // 2. Transforma los datos al formato que la API espera (RolPayload)
        const payload: RolPayload = {
            ...formValues,
            permisos_ids: formValues.permisos_ids.map(id => Number(id)),
        };

        try {
            if (editingRol) {
                const updated = await updateRol(editingRol.id_rol, payload);
                setRoles(current => current.map(r => r.id_rol === updated.id_rol ? updated : r));
                notifications.show({ title: 'Éxito', message: 'Rol actualizado.', color: 'blue', icon: <IconCheck /> });
            } else {
                const newRol = await createRol(payload);
                setRoles(current => [...current, newRol]);
                notifications.show({ title: 'Éxito', message: 'Rol creado.', color: 'green', icon: <IconCheck /> });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar el rol.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (rol: Rol) => {
        modals.openConfirmModal({
            title: 'Eliminar Rol',
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de que quieres eliminar el rol "<b>{rol.nombre_rol}</b>"? 
                    Esta acción es permanente.
                </Text>
            ),
            labels: { confirm: 'Eliminar Rol', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deleteRol(rol.id_rol);
                    setRoles(current => current.filter(r => r.id_rol !== rol.id_rol));
                    notifications.show({ title: 'Éxito', message: 'Rol eliminado.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo eliminar el rol.');
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

        return (
            <RolesTable
                records={roles}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Roles</Title>
            </Group>
            
            {renderContent()}

            <Modal opened={modalOpened} onClose={closeModal} title={editingRol ? 'Editar Rol' : 'Crear Nuevo Rol'} centered>
                <RolForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    availablePermisos={availablePermisos}
                    // 3. Transformamos los datos del rol a editar al formato del formulario
                    initialValues={editingRol ? {
                        nombre_rol: editingRol.nombre_rol,
                        descripcion_rol: editingRol.descripcion_rol || '',
                        permisos_ids: editingRol.permisos.map(p => p.id_permiso.toString())
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
                        <Menu.Label>Acciones</Menu.Label>
                        <Menu.Item leftSection={<IconPlus size={14} />} onClick={handleOpenModalForCreate}>
                            Crear Rol
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}