// frontend/src/features/codigos-referencia/components/MedidasAsignadasTable.tsx

import { Table, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { MedidaAsignada } from '../types';

interface MedidasAsignadasTableProps {
    records: MedidaAsignada[];
    onEdit: (record: MedidaAsignada) => void;
    onDelete: (record: MedidaAsignada) => void;
}

export function MedidasAsignadasTable({ records = [], onEdit, onDelete }: MedidasAsignadasTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.medida.id_medida}>
            <Table.Td>{record.medida.nombre}</Table.Td>
            <Table.Td>{record.valor} {record.medida.unidad}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Valor">
                        <ActionIcon variant="light" size="sm" onClick={() => onEdit(record)}>
                            <IconPencil size={14} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar Medida">
                        <ActionIcon variant="light" color="red" size="sm" onClick={() => onDelete(record)}>
                            <IconTrash size={14} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>Medida</Table.Th>
                    <Table.Th>Valor</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={3}>
                            <Text c="dimmed" ta="center" fz="sm">
                                No hay medidas asignadas.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}