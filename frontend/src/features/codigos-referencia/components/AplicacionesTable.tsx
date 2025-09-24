// frontend/src/features/codigos-referencia/components/AplicacionesTable.tsx

import { Table, Group, Text, ActionIcon, Tooltip, Paper, Title, Button } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import type { Aplicacion } from '../types';

interface AplicacionesTableProps {
    records: Aplicacion[];
    onAdd: () => void;
    onDelete: (record: Aplicacion) => void;
}

export function AplicacionesTable({ records, onAdd, onDelete }: AplicacionesTableProps) {
    const rows = records.map((ap) => (
        <Table.Tr key={`${ap.id_codigo_referencia}-${ap.id_version || ap.version_vehiculo?.id_version || Math.random()}`}>
            <Table.Td>{
                ap.version?.modelo?.marca?.nombre_marca
                || ap.modelo_info?.marca?.nombre_marca
                || '—'
            }</Table.Td>
            <Table.Td>{
                ap.version?.modelo?.nombre_modelo
                || ap.modelo_info?.nombre_modelo
                || '—'
            }</Table.Td>
            <Table.Td>{
                ap.version?.nombre_version
                || ap.version_vehiculo?.nombre_version
                || '—'
            }</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Eliminar">
                        <ActionIcon variant="light" color="red" onClick={() => onDelete(ap)}>
                            <IconTrash size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
                <Title order={5}>Aplicaciones (Vehículos asociados)</Title>
                <Button size="xs" variant="light" onClick={onAdd} leftSection={<IconPlus size={14} />}>Asociar Vehículo</Button>
            </Group>
            <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Marca</Table.Th>
                        <Table.Th>Modelo</Table.Th>
                        <Table.Th>Versión</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? rows : (
                        <Table.Tr>
                            <Table.Td colSpan={4}>
                                <Text c="dimmed" ta="center">Sin aplicaciones asignadas.</Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
        </Paper>
    );
}


