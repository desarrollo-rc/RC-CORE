// src/features/productos/atributos/components/AtributosTable.tsx

import { Badge, Group, ActionIcon, Tooltip, Table, Text } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Atributo } from '../types';

interface AtributosTableProps {
    records: Atributo[];
    selectedRecordId: number | null;
    onRowClick: (record: Atributo) => void;
    onEdit: (record: Atributo) => void;
    onDeactivate: (record: Atributo) => void;
    onActivate: (record: Atributo) => void;
}

export function AtributosTable({ records, selectedRecordId, onRowClick, onEdit, onDeactivate, onActivate }: AtributosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_atributo} onClick={() => onRowClick(record)} data-selected={selectedRecordId === record.id_atributo || undefined}>
            <Table.Td>{record.codigo}</Table.Td>
            <Table.Td>{record.nombre}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar"><ActionIcon variant="light" onClick={() => onEdit(record)} data-selected={selectedRecordId === record.id_atributo || undefined}><IconPencil size={16} /></ActionIcon></Tooltip>
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
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Atributo</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">No se encontraron atributos</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}