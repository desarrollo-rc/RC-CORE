// frontend/src/features/condiciones-pago/components/CondicionesPagoTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { CondicionPago } from '../types';

interface CondicionesPagoTableProps {
    records: CondicionPago[];
    onEdit: (record: CondicionPago) => void;
    onDeactivate: (record: CondicionPago) => void;
    onActivate: (record: CondicionPago) => void;
}

export function CondicionesPagoTable({ records, onEdit, onDeactivate, onActivate }: CondicionesPagoTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_condicion_pago}>
            <Table.Td>{record.codigo_condicion_pago}</Table.Td>
            <Table.Td>{record.nombre_condicion_pago}</Table.Td>
            <Table.Td>{record.dias_credito}</Table.Td>
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
                    <Table.Th>Días Crédito</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">No se encontraron condiciones de pago.</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}