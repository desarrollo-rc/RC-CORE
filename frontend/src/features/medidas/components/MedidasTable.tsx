// src/features/productos/medidas/components/MedidasTable.tsx

import { Badge, Group, ActionIcon, Tooltip, Table, Text } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Medida } from '../types';

interface MedidasTableProps {
    records: Medida[];
    onEdit: (record: Medida) => void;
    onDeactivate: (record: Medida) => void;
    onActivate: (record: Medida) => void;
}

export function MedidasTable({ records, onEdit, onDeactivate, onActivate }: MedidasTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_medida}>
            <Table.Td>{record.nombre}</Table.Td>
            <Table.Td>{record.unidad}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar"><ActionIcon variant="light" onClick={() => onEdit(record)}><IconPencil size={16} /></ActionIcon></Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar"><ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}><IconPlayerPause size={16} /></ActionIcon></Tooltip>
                    ) : (
                        <Tooltip label="Activar"><ActionIcon variant="light" color="green" onClick={() => onActivate(record)}><IconPlayerPlay size={16} /></ActionIcon></Tooltip>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Nombre de la Medida</Table.Th>
                    <Table.Th>Unidad</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">No se encontraron medidas</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}