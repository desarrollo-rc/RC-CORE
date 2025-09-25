// frontend/src/features/proveedores/components/ProveedoresTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Proveedor } from '../types';

interface ProveedoresTableProps {
    records: Proveedor[];
    onEdit: (record: Proveedor) => void;
    onDeactivate: (record: Proveedor) => void;
    onActivate: (record: Proveedor) => void;
}

export function ProveedoresTable({ records, onEdit, onDeactivate, onActivate }: ProveedoresTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_proveedor}>
            <Table.Td>{record.codigo_proveedor}</Table.Td>
            <Table.Td>{record.nombre_proveedor}</Table.Td>
            <Table.Td>{record.rut_proveedor}</Table.Td>
            <Table.Td>{record.pais?.nombre_pais || 'N/A'}</Table.Td>
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
                    <Table.Th>RUT</Table.Th>
                    <Table.Th>País</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={6}>
                            <Text c="dimmed" ta="center">
                                No se encontraron proveedores.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}