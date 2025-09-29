// frontend/src/features/clientes/components/ClientesTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Cliente } from '../types';

interface ClientesTableProps {
    records: Cliente[];
    onEdit: (record: Cliente) => void;
    onDeactivate: (record: Cliente) => void;
    onActivate: (record: Cliente) => void;
}

export function ClientesTable({ records, onEdit, onDeactivate, onActivate }: ClientesTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_cliente}>
            <Table.Td>{record.codigo_cliente}</Table.Td>
            <Table.Td>{record.nombre_cliente}</Table.Td>
            <Table.Td>{record.rut_cliente}</Table.Td>
            <Table.Td>{record.vendedor?.usuario.nombre_completo || 'Sin Asignar'}</Table.Td>
            <Table.Td>{record.segmento_cliente.nombre_segmento_cliente}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Cliente"><ActionIcon variant="light" onClick={() => onEdit(record)}><IconPencil size={16} /></ActionIcon></Tooltip>
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
                    <Table.Th>Nombre Cliente</Table.Th>
                    <Table.Th>RUT</Table.Th>
                    <Table.Th>Vendedor</Table.Th>
                    <Table.Th>Segmento</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={7}><Text c="dimmed" ta="center">No se encontraron clientes.</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}