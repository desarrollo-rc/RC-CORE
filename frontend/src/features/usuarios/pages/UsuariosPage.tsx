// src/features/usuarios/pages/UsuariosPage.tsx

import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Text, Affix, Menu, ActionIcon, rem, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { UsuariosTable } from '../components/UsuariosTable';
import { UsuarioForm } from '../components/UsuarioForm';
import { getUsuarios, createUsuario, updateUsuario } from '../services/usuarioService';
import { deactivateUsuario, activateUsuario } from '../services/usuarioService';
import { getAreas } from '../../areas/services/areaService';
import { getRoles } from '../../roles/services/rolService';
import type { Usuario, UsuarioPayload, UsuarioFormData } from '../types';
import type { Area } from '../../areas/types';
import type { Rol } from '../../roles/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [availableAreas, setAvailableAreas] = useState<Area[]>([]);
    const [availableRoles, setAvailableRoles] = useState<Rol[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            try {
                // Cargamos todos los datos necesarios en paralelo
                const [usuariosData, areasData, rolesData] = await Promise.all([
                    getUsuarios(),
                    getAreas(),
                    getRoles()
                ]);

                if (isMounted) {
                    setUsuarios(usuariosData);
                    setAvailableAreas(areasData);
                    setAvailableRoles(rolesData);
                }
            } catch (err) {
                if (isMounted) setError('No se pudieron cargar los datos para la página de usuarios.');
                console.error(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        return () => { isMounted = false; };
    }, []);

    const handleOpenModalForCreate = () => {
        setEditingUsuario(null);
        openModal();
    };

    const handleEdit = (usuario: Usuario) => {
        setEditingUsuario(usuario);
        openModal();
    };

    const handleSubmit = async (formValues: UsuarioFormData) => {
        setIsSubmitting(true);
        const payload: Partial<UsuarioPayload> = {
            ...formValues,
            id_area: Number(formValues.id_area),
            roles_ids: formValues.roles_ids.map(id => Number(id)),
            id_jefe_directo: formValues.id_jefe_directo ? Number(formValues.id_jefe_directo) : null,
        };

        // Si el password está vacío en modo edición, no lo enviamos en el payload
        if (editingUsuario && !payload.password) {
            delete payload.password;
        }

        try {
            if (editingUsuario) {
                const updated = await updateUsuario(editingUsuario.id_usuario, payload);
                setUsuarios(current => current.map(u => u.id_usuario === updated.id_usuario ? updated : u));
                notifications.show({ title: 'Éxito', message: 'Usuario actualizado.', color: 'blue', icon: <IconCheck /> });
            } else {
                const newUser = await createUsuario(payload as UsuarioPayload);
                setUsuarios(current => [...current, newUser]);
                notifications.show({ title: 'Éxito', message: 'Usuario creado.', color: 'green', icon: <IconCheck /> });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar el usuario.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivate = (usuario: Usuario) => {
        modals.openConfirmModal({
            title: 'Desactivar Usuario',
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de que quieres desactivar al usuario "<b>{usuario.nombre_completo}</b>"?
                </Text>
            ),
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateUsuario(usuario.id_usuario);
                    setUsuarios(current => current.map(u => u.id_usuario === usuario.id_usuario ? updated : u));
                    notifications.show({ title: 'Éxito', message: 'Usuario desactivado.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    // 2. USAR LA UTILIDAD PARA OBTENER EL MENSAJE
                    const message = getApiErrorMessage(error, 'No se pudo desactivar el usuario.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    };

    const handleActivate = (usuario: Usuario) => {
        modals.openConfirmModal({
            title: 'Activar Usuario',
            centered: true,
            children: (
                <Text size="sm">
                    ¿Estás seguro de que quieres activar al usuario "<b>{usuario.nombre_completo}</b>"?
                </Text>
            ),
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateUsuario(usuario.id_usuario);
                    setUsuarios(current => current.map(u => u.id_usuario === usuario.id_usuario ? updated : u));
                    notifications.show({ title: 'Éxito', message: 'Usuario activado.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    // 2. USAR LA UTILIDAD PARA OBTENER EL MENSAJE
                    const message = getApiErrorMessage(error, 'No se pudo activar el usuario.');
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
            <UsuariosTable
                records={usuarios}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
                onActivate={handleActivate}
            />
        );
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Usuarios</Title>
            </Group>
            
            {renderContent()}

            <Modal opened={modalOpened} onClose={closeModal} title={editingUsuario ? 'Editar Usuario' : 'Crear Nuevo Usuario'} centered>
                <UsuarioForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    availableAreas={availableAreas}
                    availableRoles={availableRoles}
                    availableUsuarios={usuarios}
                    editingUserId={editingUsuario?.id_usuario}
                    initialValues={editingUsuario ? {
                        nombre_completo: editingUsuario.nombre_completo,
                        email: editingUsuario.email,
                        telefono: editingUsuario.telefono || '',
                        id_area: editingUsuario.area.id_area.toString(),
                        roles_ids: editingUsuario.roles.map(r => r.id_rol.toString()),
                        id_jefe_directo: editingUsuario.jefe_directo?.id_usuario.toString() || null,
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
                            Crear Usuario
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>

        </Box>
    );
}