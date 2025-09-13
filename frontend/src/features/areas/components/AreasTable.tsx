// src/features/areas/components/AreasTable.tsx

import { Badge, Group, ActionIcon, Tooltip, Table, UnstyledButton, Center, Text } from '@mantine/core';
import { IconPencil, IconTrash, IconPlayerPlay, IconSelector, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type { Area } from '../types';
import type { DataTableSortStatus } from 'mantine-datatable';
import classes from './AreasTable.module.css';

interface AreasTableProps {
    records: Area[];
    sortStatus: DataTableSortStatus;
    selectedRecord: Area | null;
    onSortStatusChange: (status: DataTableSortStatus) => void;
    onRecordClick: (area: Area) => void;
    onEdit: (area: Area) => void;
    onDeactivate: (area: Area) => void;
    onActivate: (area: Area) => void;
}

function Th({ children, reversed, sorted, onSort }: { children: React.ReactNode; reversed: boolean; sorted: boolean; onSort: () => void }) {
    const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
    return (
        <Table.Th className={classes.th}>
            <UnstyledButton onClick={onSort} className={classes.control}>
                <Group justify="space-between">
                    <Text fw={500} fz="sm">{children}</Text>
                    <Center className={classes.icon}><Icon size={14} stroke={1.5} /></Center>
                </Group>
            </UnstyledButton>
        </Table.Th>
    );
}

export function AreasTable({ records, sortStatus, selectedRecord, onSortStatusChange, onRecordClick, onEdit, onDeactivate, onActivate }: AreasTableProps) {
    const handleSort = (accessor: string) => {
        onSortStatusChange({
            columnAccessor: accessor,
            direction: sortStatus.columnAccessor === accessor && sortStatus.direction === 'asc' ? 'desc' : 'asc',
        });
    };

    const rows = records.map((record) => (
        <Table.Tr 
            key={record.id_area} 
            className={classes.tr} 
            data-selected={selectedRecord?.id_area === record.id_area || undefined}
            onClick={() => onRecordClick(record)}
        >
            <Table.Td>{record.codigo_area}</Table.Td>
            <Table.Td>{record.nombre_area}</Table.Td>
            <Table.Td>{record.descripcion_area || 'N/A'}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    {record.activo ? (
                        <>
                            <Tooltip label="Editar"><ActionIcon variant="light" onClick={() => onEdit(record)}><IconPencil size={16} /></ActionIcon></Tooltip>
                            <Tooltip label="Desactivar"><ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}><IconTrash size={16} /></ActionIcon></Tooltip>
                        </>
                    ) : (
                        <Tooltip label="Activar"><ActionIcon variant="light" color="green" onClick={() => onActivate(record)}><IconPlayerPlay size={16} /></ActionIcon></Tooltip>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Table striped highlightOnHover withTableBorder>
            <Table.Thead className={classes.thead}>
                <Table.Tr>
                    <Th sorted={sortStatus.columnAccessor === 'codigo_area'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('codigo_area')}>Código</Th>
                    <Th sorted={sortStatus.columnAccessor === 'nombre_area'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('nombre_area')}>Nombre</Th>
                    <Table.Th>Descripción</Table.Th>
                    <Th sorted={sortStatus.columnAccessor === 'activo'} reversed={sortStatus.direction === 'desc'} onSort={() => handleSort('activo')}>Estado</Th>
                    <Table.Th>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">No se encontraron áreas</Text></Table.Td></Table.Tr>}</Table.Tbody>
        </Table>
    );
}