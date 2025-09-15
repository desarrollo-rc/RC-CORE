// src/features/roles/components/RolesTable.tsx

import { Group, ActionIcon, Tooltip, Table, Text, Badge } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { Rol } from '../types';

interface RolesTableProps {
    records: Rol[];
    onEdit: (rol: Rol) => void;
    onDelete: (rol: Rol) => void;
}

export function RolesTable({ records, onEdit, onDelete }: RolesTableProps) {
    const rows = records.map((record) => {
        const isDeleteDisabled = record.nombre_rol.toLowerCase() === 'administrador';

        return (
            <Table.Tr key={record.id_rol}>
                <Table.Td>{record.nombre_rol}</Table.Td>
                <Table.Td>{record.descripcion_rol || 'N/A'}</Table.Td>
                <Table.Td>
                    {/* Lógica para mostrar los permisos como Badges */}
                    {record.permisos && record.permisos.length > 0 ? (
                        <Group gap="xs">
                            {record.permisos.slice(0, 3).map((permiso) => (
                                <Badge key={permiso.id_permiso} variant="light">
                                    {permiso.nombre_permiso}
                                </Badge>
                            ))}
                            {record.permisos.length > 3 && (
                                <Badge variant="outline">
                                    +{record.permisos.length - 3} más
                                </Badge>
                            )}
                        </Group>
                    ) : (
                        <Text c="dimmed" fz="sm">Sin permisos asignados</Text>
                    )}
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end">
                        <Tooltip label="Editar Rol">
                            <ActionIcon variant="light" onClick={() => onEdit(record)}>
                                <IconPencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={isDeleteDisabled ? "El rol de Administrador no se puede eliminar" : "Eliminar Rol"}>
                            <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => onDelete(record)}
                                disabled={isDeleteDisabled}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        )
    });

    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Nombre del Rol</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th>Permisos Asignados</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={4}>
                            <Text c="dimmed" ta="center">
                                No se encontraron roles.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}