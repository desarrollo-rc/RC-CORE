// frontend/src/features/codigos-referencia/components/CodigosReferenciaTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { CodigoReferencia } from '../types';

interface CodigosReferenciaTableProps {
    records: CodigoReferencia[];
    selectedRecordId: number | null;
    onRowClick: (record: CodigoReferencia) => void;
    onEdit: (record: CodigoReferencia) => void;
    onDeactivate: (record: CodigoReferencia) => void;
    onActivate: (record: CodigoReferencia) => void;
}

export function CodigosReferenciaTable({ records, selectedRecordId, onRowClick, onEdit, onDeactivate, onActivate }: CodigosReferenciaTableProps) {
    const rows = records.map((record) => (
        <Table.Tr 
            key={record.id_codigo_referencia}
            onClick={() => onRowClick(record)}
            bg={selectedRecordId === record.id_codigo_referencia ? 'var(--mantine-color-blue-light)' : undefined}
            style={{ cursor: 'pointer' }}
        >
            <Table.Td>{record.codigo}</Table.Td>
            <Table.Td style={{ maxWidth: 300 }}>
                <Text truncate>{record.descripcion || 'N/A'}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar">
                        <ActionIcon variant="light" onClick={(e) => { e.stopPropagation(); onEdit(record); }}>
                            <IconPencil size={16} />
                        </ActionIcon>
                    </Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar">
                        <ActionIcon variant="light" color="red" onClick={(e) => { e.stopPropagation(); onDeactivate(record); }}>
                            <IconPlayerPause size={16} />
                        </ActionIcon>
                    </Tooltip>
                    ) : (
                    <Tooltip label="Activar">
                        <ActionIcon variant="light" color="green" onClick={(e) => { e.stopPropagation(); onActivate(record); }}>
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
                    <Table.Th>Descripción</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={4}>
                            <Text c="dimmed" ta="center">
                                No se encontraron códigos de referencia.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}