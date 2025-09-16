// src/features/productos/divisiones/components/DivisonesTable.tsx

import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconEdit, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Division } from '../types';

interface DivisonesTableProps {
    records: Division[];
    onEdit: (division: Division) => void;
    onDeactivate: (division: Division) => void;
    onActivate: (division: Division) => void;
}

export function DivisonesTable({ records, onEdit, onDeactivate, onActivate }: DivisonesTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_division}>
            <Table.Td>{record.codigo_division}</Table.Td>
            <Table.Td>{record.nombre_division}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar División">
                        <ActionIcon variant="light" onClick={() => onEdit(record)}>
                            <IconEdit size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar División">
                        <ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}>
                            <IconPlayerPause size={16} />
                        </ActionIcon>
                    </Tooltip>
                    ) : (
                    <Tooltip label="Activar División">
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
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={4}>
                            <Text c="dimmed" ta="center">
                                No se encontraron divisiones.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}

