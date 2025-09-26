// frontend/src/features/tipos-negocio/components/TiposNegocioTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { TipoNegocio } from '../types';

interface TiposNegocioTableProps {
    records: TipoNegocio[];
    onEdit: (record: TipoNegocio) => void;
    onDeactivate: (record: TipoNegocio) => void;
    onActivate: (record: TipoNegocio) => void;
}

export function TiposNegocioTable({ records, onEdit, onDeactivate, onActivate }: TiposNegocioTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_tipo_negocio}>
            <Table.Td>{record.codigo_tipo_negocio}</Table.Td>
            <Table.Td>{record.nombre_tipo_negocio}</Table.Td>
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
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={4}><Text c="dimmed" ta="center">No se encontraron tipos de negocio.</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}