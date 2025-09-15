// src/features/permisos/components/PermisosTable.tsx

import { Group, ActionIcon, Tooltip, Table, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { Permiso } from '../types';

interface PermisosTableProps {
    records: Permiso[];
    onEdit: (permiso: Permiso) => void;
    onDelete: (permiso: Permiso) => void;
}

export function PermisosTable({ records, onEdit, onDelete }: PermisosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_permiso}>
            <Table.Td>{record.nombre_permiso}</Table.Td>
            <Table.Td>{record.descripcion_permiso || 'N/A'}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Permiso">
                        <ActionIcon variant="light" onClick={() => onEdit(record)}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar Permiso">
                        <ActionIcon variant="light" color="red" onClick={() => onDelete(record)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Nombre del Permiso (Clave)</Table.Th>
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={3}>
                            <Text c="dimmed" ta="center">
                                No se encontraron permisos.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}