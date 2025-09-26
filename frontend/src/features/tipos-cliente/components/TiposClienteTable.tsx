// frontend/src/features/tipos-cliente/components/TiposClienteTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { TipoCliente } from '../types';

interface TiposClienteTableProps {
    records: TipoCliente[];
    onEdit: (record: TipoCliente) => void;
    onDeactivate: (record: TipoCliente) => void;
    onActivate: (record: TipoCliente) => void;
}

export function TiposClienteTable({ records, onEdit, onDeactivate, onActivate }: TiposClienteTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_tipo_cliente}>
            <Table.Td>{record.codigo_tipo_cliente}</Table.Td>
            <Table.Td>{record.nombre_tipo_cliente}</Table.Td>
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
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">No se encontraron tipos de cliente.</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}