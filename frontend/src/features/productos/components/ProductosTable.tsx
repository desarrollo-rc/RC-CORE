// frontend/src/features/productos/components/ProductosTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Producto } from '../types';

interface ProductosTableProps {
    records: Producto[];
    onEdit: (record: Producto) => void;
    onDeactivate: (record: Producto) => void;
    onActivate: (record: Producto) => void;
}

export function ProductosTable({ records, onEdit, onDeactivate, onActivate }: ProductosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_producto}>
            <Table.Td>{record.sku}</Table.Td>
            <Table.Td>{record.nombre_producto}</Table.Td>
            <Table.Td>{record.marca.nombre_marca}</Table.Td>
            <Table.Td>{record.calidad.nombre_calidad}</Table.Td>
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
                    <Table.Th>SKU</Table.Th>
                    <Table.Th>Nombre</Table.Th>
                    <Table.Th>Marca</Table.Th>
                    <Table.Th>Calidad</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={6}><Text c="dimmed" ta="center">No se encontraron productos.</Text></Table.Td></Table.Tr>}
            </Table.Tbody>
        </Table>
    );
}