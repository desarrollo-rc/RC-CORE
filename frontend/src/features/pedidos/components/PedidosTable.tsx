// frontend/src/features/pedidos/components/PedidosTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import type { PedidoList } from '../types';

interface PedidosTableProps {
    records: PedidoList[];
    onView: (record: PedidoList) => void;
}

export function PedidosTable({ records, onView }: PedidosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_pedido}>
            <Table.Td>{record.codigo_pedido_origen || record.id_pedido}</Table.Td>
            <Table.Td>{record.cliente_nombre}</Table.Td>
            <Table.Td>{new Date(record.fecha_creacion).toLocaleDateString('es-CL')}</Table.Td>
            <Table.Td>
                <Badge color={record.estado_general?.nombre_estado === 'COMPLETADO' ? 'green' : 'blue'}>
                    {record.estado_general?.nombre_estado || 'N/A'}
                </Badge>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>{`$${Number(record.monto_total).toLocaleString('es-CL')}`}</Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Ver Detalle del Pedido">
                        <ActionIcon variant="light" onClick={() => onView(record)}>
                            <IconEye size={16} />
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
                    <Table.Th>N° Pedido</Table.Th>
                    <Table.Th>Cliente</Table.Th>
                    <Table.Th>Fecha Creación</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Monto Total</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {rows.length > 0 ? rows : (
                    <Table.Tr>
                        <Table.Td colSpan={6}>
                            <Text c="dimmed" ta="center">No se encontraron pedidos.</Text>
                        </Table.Td>
                    </Table.Tr>
                )}
            </Table.Tbody>
        </Table>
    );
}