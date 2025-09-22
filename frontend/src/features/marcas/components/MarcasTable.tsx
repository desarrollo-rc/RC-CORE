// frontend/src/features/marcas/components/MarcasTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';
import type { Marca } from '../types';

interface MarcasTableProps {
    records: Marca[];
    onEdit: (marca: Marca) => void;
    onDeactivate: (marca: Marca) => void;
    onActivate: (marca: Marca) => void;
}

export function MarcasTable({ records, onEdit, onDeactivate, onActivate }: MarcasTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_marca}>
            <Table.Td>{record.codigo_marca}</Table.Td>
            <Table.Td>{record.nombre_marca}</Table.Td>
            <Table.Td>
                <Badge 
                    variant="light"
                    color={
                        record.ambito_marca === 'Vehículo' ? 'blue' :
                        record.ambito_marca === 'Repuesto' ? 'teal' : 'grape'
                    }
                >
                    {record.ambito_marca}
                </Badge>
            </Table.Td>
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
                    <Table.Th>Ámbito</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? (
                    rows
                ) : (
                    <Table.Tr>
                        <Table.Td colSpan={5}>
                            <Text c="dimmed" ta="center">
                                No se encontraron marcas.
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}