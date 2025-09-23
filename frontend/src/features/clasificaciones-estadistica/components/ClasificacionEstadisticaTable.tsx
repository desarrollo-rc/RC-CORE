// frontend/src/features/clasificaciones-estadistica/components/ClasificacionEstadisticaTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { ClasificacionEstadistica } from '../types';

interface ClasificacionEstadisticaTableProps {
    records: ClasificacionEstadistica[];
    onEdit: (record: ClasificacionEstadistica) => void;
    onDeactivate: (record: ClasificacionEstadistica) => void;
    onActivate: (record: ClasificacionEstadistica) => void;
}

export function ClasificacionEstadisticaTable({ records, onEdit, onDeactivate, onActivate }: ClasificacionEstadisticaTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id}>
            <Table.Td>{record.codigo}</Table.Td>
            <Table.Td>{record.nombre}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" onClick={() => onEdit(record)}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar">
                        <ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}>
                            <IconPlayerPause size={16} />
                        </ActionIcon>
                    </Tooltip>
                    ) : (
                    <Tooltip label="Activar">
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
                    <Table.Th>Estado</Table.Th>
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
                                No se encontraron clasificaciones estadísticas.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}