// frontend/src/features/paises/components/PaisesTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { Pais } from '../types';

interface PaisesTableProps {
    records: Pais[];
    onEdit: (pais: Pais) => void;
    onDelete: (pais: Pais) => void;
}

export function PaisesTable({ records, onEdit, onDelete }: PaisesTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_pais}>
            <Table.Td>{record.nombre_pais}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar País">
                        <ActionIcon variant="light" onClick={() => onEdit(record)}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar País">
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
                    <Table.Th>Nombre del País</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">
                                No se encontraron países.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}