// frontend/src/features/codigos-referencia/components/AtributosAsignadosTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import type { AtributoAsignado } from '../types';

interface AtributosAsignadosTableProps {
    records: AtributoAsignado[];
    onEdit: (record: AtributoAsignado) => void;
    onDelete: (record: AtributoAsignado) => void;
}

export function AtributosAsignadosTable({ records = [], onEdit, onDelete }: AtributosAsignadosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.atributo.id_atributo}>
            <Table.Td>{record.atributo.nombre}</Table.Td>
            <Table.Td>{record.valor_asignado.valor}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Cambiar Valor">
                        <ActionIcon variant="light" size="sm" onClick={() => onEdit(record)}>
                            <IconPencil size={14} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar Atributo">
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
                    <Table.Th>Atributo</Table.Th>
                    <Table.Th>Valor</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : (
                    <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" ta="center" fz="sm">No hay atributos asignados.</Text></Table.Td></Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}