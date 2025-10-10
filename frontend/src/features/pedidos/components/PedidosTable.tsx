// frontend/src/features/pedidos/components/PedidosTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import type { PedidoList } from '../types';

function formatDateTime(input: string | number | Date): string {
	const date = new Date(input);
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	return `${day}-${month}-${year}, ${hours}:${minutes}`;
}

function formatCLP(value: number | string): string {
	const numericValue = Number(value);
	if (Number.isNaN(numericValue)) return '';
	return `$${Math.round(numericValue).toLocaleString('es-CL')}`;
}

interface PedidosTableProps {
    records: PedidoList[];
    onView: (record: PedidoList) => void;
}

export function PedidosTable({ records, onView }: PedidosTableProps) {
    const rows = records.map((record) => (
        <Table.Tr key={record.id_pedido}>
            <Table.Td>
                <Group gap="xs">
                    <Text>{record.numero_pedido_sap || record.codigo_pedido_origen || record.id_pedido}</Text>
                    {record.numero_pedido_sap && record.codigo_pedido_origen && (
                        <Badge color="blue" size="sm" variant="light">
                            B2B: {record.codigo_pedido_origen}
                        </Badge>
                    )}
                </Group>
            </Table.Td>
            <Table.Td>{record.cliente_nombre}</Table.Td>
            <Table.Td>{formatDateTime(record.fecha_creacion)}</Table.Td>
            <Table.Td>
                <Badge color={record.estado_general?.nombre_estado === 'COMPLETADO' ? 'green' : 'blue'}>
                    {record.estado_general?.nombre_estado || 'N/A'}
                </Badge>
            </Table.Td>
            <Table.Td style={{ textAlign: 'right' }}>{formatCLP(record.monto_total)}</Table.Td>
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