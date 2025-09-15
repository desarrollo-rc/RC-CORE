// src/features/usuarios/components/UsuariosTable.tsx

import { Badge, Group, ActionIcon, Tooltip, Table, Text } from '@mantine/core';
import { IconPencil, IconTrash, IconPlayerPlay } from '@tabler/icons-react';
import type { Usuario } from '../types';

interface UsuariosTableProps {
    records: Usuario[];
    onEdit: (usuario: Usuario) => void;
    onDeactivate: (usuario: Usuario) => void;
    onActivate: (usuario: Usuario) => void;
}

export function UsuariosTable({ records, onEdit, onDeactivate, onActivate }: UsuariosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_usuario}>
            <Table.Td>{record.nombre_completo}</Table.Td>
            <Table.Td>{record.email}</Table.Td>
            <Table.Td>{record.area?.nombre_area || 'N/A'}</Table.Td>
            <Table.Td>
                {record.roles && record.roles.length > 0 ? (
                    <Group gap="xs">
                        {record.roles.map((rol) => (
                            <Badge key={rol.id_rol} variant="light" color="blue">
                                {rol.nombre_rol}
                            </Badge>
                        ))}
                    </Group>
                ) : (
                    <Text c="dimmed" fz="sm">Sin roles</Text>
                )}
            </Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Usuario">
                        <ActionIcon variant="light" onClick={() => onEdit(record)}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar Usuario">
                            <ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}>
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    ) : (
                        <Tooltip label="Activar Usuario">
                            <ActionIcon variant="light" color="green" onClick={() => onActivate(record)}>
                                <IconPlayerPlay size={16} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Nombre Completo</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Área</Table.Th>
                    <Table.Th>Roles</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={6}>
                            <Text c="dimmed" ta="center">
                                No se encontraron usuarios.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}