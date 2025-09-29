// frontend/src/features/vendedores/components/VendedoresTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import type { Vendedor } from '../types';

interface VendedoresTableProps {
    records: Vendedor[];
    onEdit: (record: Vendedor) => void;
    onDeactivate: (record: Vendedor) => void;
    onActivate: (record: Vendedor) => void;
}

export function VendedoresTable({ records, onEdit, onDeactivate, onActivate }: VendedoresTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_vendedor}>
            <Table.Td>{record.usuario.nombre_completo}</Table.Td>
            <Table.Td>{record.usuario.email}</Table.Td>
            <Table.Td>{record.codigo_vendedor_sap || 'N/A'}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Código SAP"><ActionIcon variant="light" onClick={() => onEdit(record)}><IconPencil size={16} /></ActionIcon></Tooltip>
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
                    <Table.Th>Nombre Completo</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Código SAP</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">No se encontraron vendedores.</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}