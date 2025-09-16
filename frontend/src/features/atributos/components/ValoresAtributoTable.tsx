// src/features/valores-atributo/components/ValoresAtributoTable.tsx
import { Table, Group, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import type { ValorAtributo } from '../types';

interface ValoresAtributoTableProps {
    records: ValorAtributo[];
    onEdit: (record: ValorAtributo) => void;
    onDeactivate: (record: ValorAtributo) => void;
    onActivate: (record: ValorAtributo) => void;
}

export function ValoresAtributoTable({ records, onEdit, onDeactivate, onActivate }: ValoresAtributoTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_valor}>
            <Table.Td>{record.codigo}</Table.Td>
            <Table.Td>{record.valor}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Valor"><ActionIcon variant="light" onClick={() => onEdit(record)}><IconPencil size={16} /></ActionIcon></Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar Valor"><ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}><IconPlayerPause size={16} /></ActionIcon></Tooltip>
                    ) : (
                        <Tooltip label="Activar Valor"><ActionIcon variant="light" color="green" onClick={() => onActivate(record)}><IconPlayerPlay size={16} /></ActionIcon></Tooltip>
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
                    <Table.Th>Valor</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={4} align="center">No hay valores para este atributo.</Table.Td></Table.Tr>}</Table.Tbody>
        </Table>
    );
}