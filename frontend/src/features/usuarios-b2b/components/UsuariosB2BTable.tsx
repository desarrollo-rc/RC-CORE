// frontend/src/features/usuarios-b2b/components/UsuariosB2BTable.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Table, 
    Badge, 
    Paper, 
    ActionIcon, 
    Tooltip, 
    Group, 
    Modal,
    Text
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconX, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { activarUsuarioB2B, desactivarUsuarioB2B } from '../services/usuarioB2BService';
import { UsuarioB2BForm } from './UsuarioB2BForm';
import type { UsuarioB2B } from '../types';

interface UsuariosB2BTableProps {
    usuarios: UsuarioB2B[];
    onEdit?: (usuario: UsuarioB2B) => void;
}

export function UsuariosB2BTable({ usuarios, onEdit }: UsuariosB2BTableProps) {
    const queryClient = useQueryClient();
    const [selectedUsuario, setSelectedUsuario] = useState<UsuarioB2B | null>(null);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);

    const activarMutation = useMutation({
        mutationFn: activarUsuarioB2B,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios-b2b'] });
            queryClient.invalidateQueries({ queryKey: ['usuarios-b2b-stats'] });
            notifications.show({
                title: 'Usuario Activado',
                message: 'El usuario B2B ha sido activado exitosamente.',
                color: 'green',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo activar el usuario',
                color: 'red',
            });
        },
    });

    const desactivarMutation = useMutation({
        mutationFn: desactivarUsuarioB2B,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios-b2b'] });
            queryClient.invalidateQueries({ queryKey: ['usuarios-b2b-stats'] });
            notifications.show({
                title: 'Usuario Desactivado',
                message: 'El usuario B2B ha sido desactivado exitosamente.',
                color: 'orange',
            });
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'No se pudo desactivar el usuario',
                color: 'red',
            });
        },
    });

    const handleEdit = (usuario: UsuarioB2B) => {
        setSelectedUsuario(usuario);
        if (onEdit) {
            onEdit(usuario);
        } else {
            openEditModal();
        }
    };

    const handleToggleActivo = (usuario: UsuarioB2B) => {
        if (usuario.activo) {
            if (window.confirm('¿Está seguro de que desea desactivar este usuario B2B?')) {
                desactivarMutation.mutate(usuario.id_usuario_b2b);
            }
        } else {
            activarMutation.mutate(usuario.id_usuario_b2b);
        }
    };

    const handleEditSuccess = () => {
        closeEditModal();
        setSelectedUsuario(null);
    };

    const rows = usuarios.map((usuario) => {
        const nombreCliente = usuario.cliente?.nombre_cliente || `Cliente #${usuario.id_cliente}`;
        
        return (
            <Table.Tr key={usuario.id_usuario_b2b}>
                <Table.Td>#{usuario.id_usuario_b2b}</Table.Td>
                <Table.Td style={{ maxWidth: 200 }}>
                    <Tooltip label={usuario.nombre_completo} withArrow>
                        <Text truncate style={{ cursor: 'help' }}>
                            {usuario.nombre_completo}
                        </Text>
                    </Tooltip>
                </Table.Td>
                <Table.Td style={{ maxWidth: 150 }}>
                    <Tooltip label={usuario.usuario} withArrow>
                        <Text truncate style={{ cursor: 'help' }}>
                            {usuario.usuario}
                        </Text>
                    </Tooltip>
                </Table.Td>
                <Table.Td style={{ maxWidth: 200 }}>
                    <Tooltip label={usuario.email} withArrow>
                        <Text truncate style={{ cursor: 'help' }}>
                            {usuario.email}
                        </Text>
                    </Tooltip>
                </Table.Td>
                <Table.Td style={{ maxWidth: 200 }}>
                    <Tooltip label={nombreCliente} withArrow>
                        <Text truncate style={{ cursor: 'help' }}>
                            {nombreCliente}
                        </Text>
                    </Tooltip>
                </Table.Td>
                <Table.Td>
                    <Badge color={usuario.activo ? 'green' : 'red'} variant="light">
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    {new Date(usuario.fecha_creacion).toLocaleDateString('es-CL')}
                </Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Tooltip label="Editar">
                            <ActionIcon
                                variant="subtle"
                                color="blue"
                                onClick={() => handleEdit(usuario)}
                            >
                                <IconEdit size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={usuario.activo ? 'Desactivar' : 'Activar'}>
                            <ActionIcon
                                variant="subtle"
                                color={usuario.activo ? 'red' : 'green'}
                                onClick={() => handleToggleActivo(usuario)}
                            >
                                {usuario.activo ? <IconX size={18} /> : <IconCheck size={18} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    return (
        <>
            <Paper withBorder>
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>Usuario</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Cliente</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Fecha Creación</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>

            <Modal
                opened={editModalOpened}
                onClose={() => {
                    closeEditModal();
                    setSelectedUsuario(null);
                }}
                title="Editar Usuario B2B"
                size="lg"
                centered
            >
                {selectedUsuario && <UsuarioB2BForm usuario={selectedUsuario} onSuccess={handleEditSuccess} />}
            </Modal>
        </>
    );
}

