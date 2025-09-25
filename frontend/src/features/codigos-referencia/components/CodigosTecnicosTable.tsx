// frontend/src/features/codigos-referencia/components/CodigosTecnicosTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge, Button } from '@mantine/core';
import { IconPencil, IconTrash, IconLink } from '@tabler/icons-react';
import type { CodigoTecnico } from '../types';

interface CodigosTecnicosTableProps {
    records: CodigoTecnico[];
    onEdit: (codigo: CodigoTecnico) => void;
    onDelete: (codigo: CodigoTecnico) => void;
    onAsociarProducto: (codigo: CodigoTecnico) => void;
}

export function CodigosTecnicosTable({ records, onEdit, onDelete, onAsociarProducto }: CodigosTecnicosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_codigo_tecnico}>
            <Table.Td>{record.codigo}</Table.Td>
            <Table.Td>
                <Badge variant="light">{record.tipo}</Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    {record.tipo === 'SKU' && (
                        record.id_producto ? (
                            <Badge color="green" variant="light">Asociado</Badge>
                        ) : (
                            <Tooltip label="Asociar Producto (SKU)">
                                <Button size="xs" variant="outline" onClick={() => onAsociarProducto(record)} leftSection={<IconLink size={14} />}>
                                    Asociar
                                </Button>
                            </Tooltip>
                        )
                    )}
                    <Tooltip label="Editar Código Técnico">
                        <ActionIcon variant="light" size="sm" onClick={() => onEdit(record)}>
                            <IconPencil size={14} />
                        </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Eliminar Código Técnico">
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
                    <Table.Th>Código</Table.Th>
                    <Table.Th>Tipo</Table.Th>
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
                                No hay códigos técnicos asociados.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}