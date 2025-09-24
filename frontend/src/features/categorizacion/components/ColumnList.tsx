import { Title, Table, ScrollArea, Button, Group, ActionIcon, Tooltip, Paper, Badge } from '@mantine/core';
import { IconPlus, IconPencil, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';

export interface ListItem {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
    detalle?: string;
}

interface ColumnListProps {
    title: string;
    items: ListItem[];
    selectedId: number | null;
    onSelect: (item: ListItem) => void;
    onAdd: () => void;
    onEdit: (item: ListItem) => void;
    onDeactivate: (item: ListItem) => void;
    onActivate: (item: ListItem) => void;
    disabled?: boolean;
}

export function ColumnList({ title, items, selectedId, onSelect, onAdd, onEdit, onDeactivate, onActivate, disabled = false }: ColumnListProps) {
    const rows = items.map((item) => (
        <Table.Tr
            key={item.id}
            onClick={() => onSelect(item)}
            bg={item.id === selectedId ? 'var(--mantine-color-blue-light)' : undefined}
            style={{ cursor: 'pointer' }}
        >
            <Table.Td>{item.codigo}</Table.Td>
            <Table.Td>{item.nombre}</Table.Td>
            {items.some(i => i.detalle) && (
                 <Table.Td>
                     {item.detalle && (
                        <Badge variant="light" color={item.detalle === 'Mixto' ? 'grape' : 'blue'}>
                            {item.detalle}
                        </Badge>
                     )}
                 </Table.Td>
            )}
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar"><ActionIcon size="sm" variant="light" onClick={(e) => { e.stopPropagation(); onEdit(item); }}><IconPencil size={14} /></ActionIcon></Tooltip>
                    {item.activo ? (
                        <Tooltip label="Desactivar"><ActionIcon size="sm" variant="light" color="red" onClick={(e) => { e.stopPropagation(); onDeactivate(item); }}><IconPlayerPause size={14} /></ActionIcon></Tooltip>
                    ) : (
                        <Tooltip label="Activar"><ActionIcon size="sm" variant="light" color="green" onClick={(e) => { e.stopPropagation(); onActivate(item); }}><IconPlayerPlay size={14} /></ActionIcon></Tooltip>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const showDetalleHeader = items.some(i => i.detalle);

    return (
        <Paper withBorder p="md" radius="md" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Group justify="space-between" mb="sm">
                <Title order={5}>{title}</Title>
                <Button size="xs" variant="light" onClick={onAdd} disabled={disabled} leftSection={<IconPlus size={14} />}>
                    Añadir
                </Button>
            </Group>
            <ScrollArea style={{ flex: 1 }}>
                <Table striped highlightOnHover verticalSpacing="xs">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Nombre</Table.Th>
                            {showDetalleHeader && <Table.Th>Ámbito</Table.Th>}
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </ScrollArea>
        </Paper>
    );
}