// frontend/src/features/fabricas/components/FabricasTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Fabrica } from '../types';
import type { Pais } from '../../paises/types';

interface FabricasTableProps {
    records: Fabrica[];
    paises: Pais[];
    onEdit: (fabrica: Fabrica) => void;
    onDeactivate: (fabrica: Fabrica) => void;
    onActivate: (fabrica: Fabrica) => void;
}

export function FabricasTable({ records, paises, onEdit, onDeactivate, onActivate }: FabricasTableProps) {
    const paisesMap = new Map(paises.map(p => [p.id_pais, p.nombre_pais]));

    const rows = records.map((record) => (
        <Table.Tr key={record.id_fabrica}>
            <Table.Td>{record.nombre_fabrica}</Table.Td>
            <Table.Td>{paisesMap.get(record.id_pais) || 'N/A'}</Table.Td>
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
                    <Table.Th>Nombre de la Fábrica</Table.Th>
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
                        <Table.Td colSpan={4}>
                            <Text c="dimmed" ta="center">
                                No se encontraron fábricas.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}