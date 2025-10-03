// frontend/src/features/vehiculos/components/VehiculosTable.tsx
import { Table, Group, Text, ActionIcon, Tooltip, Badge, Paper, Title, Button } from '@mantine/core';
import { IconPencil, IconPlayerPlay, IconPlayerPause, IconPlus } from '@tabler/icons-react';
import type { VersionVehiculo, Modelo, MarcaVehiculo } from '../types';

interface VehiculosTableProps {
    marca: MarcaVehiculo | null;
    modelo: Modelo | null;
    versiones: VersionVehiculo[];
    marcas: MarcaVehiculo[];
    modelos: Modelo[];
    selectedVersionId: number | null;
    onAdd: () => void;
    onEdit: (version: VersionVehiculo) => void;
    onToggleActive: (version: VersionVehiculo) => void;
    onRowClick: (version: VersionVehiculo) => void;
    paginationSlot?: React.ReactNode;
}

export function VehiculosTable({ marca, modelo, versiones, marcas, modelos, selectedVersionId, onAdd, onEdit, onToggleActive, onRowClick, paginationSlot }: VehiculosTableProps) {
    const rows = versiones.map((version) => {
        const resolvedMarcaId = version.modelo?.id_marca ?? version.modelo?.marca?.id_marca
            ?? modelos.find(md => md.id_modelo === version.id_modelo)?.id_marca;
        const resolvedMarcaNombre = version.modelo?.marca?.nombre_marca
            || marcas.find(m => m.id_marca === resolvedMarcaId)?.nombre_marca
            || marca?.nombre_marca
            || '—';
        const resolvedModeloNombre = version.modelo?.nombre_modelo
            || modelos.find(md => md.id_modelo === version.id_modelo)?.nombre_modelo
            || modelo?.nombre_modelo
            || '—';
        return (
            <Table.Tr 
                key={version.id_version}
                onClick={() => onRowClick(version)}
                bg={version.id_version === selectedVersionId ? 'var(--mantine-color-blue-light)' : undefined}
                style={{ cursor: 'pointer' }}
            >
                <Table.Td>{resolvedMarcaNombre} {resolvedModeloNombre} {version.nombre_version}</Table.Td>
                <Table.Td>{version.anios_fabricacion.join(', ')}</Table.Td>
                <Table.Td><Badge variant="outline">{version.transmision || 'N/A'}</Badge></Table.Td>
                <Table.Td>{version.traccion || '—'}</Table.Td>
                <Table.Td>{version.combustible || '—'}</Table.Td>
                <Table.Td>
                    <Badge color={version.activo ? 'green' : 'gray'}>
                        {version.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Group gap="xs" justify="flex-end">
                        <Tooltip label="Editar Versión">
                            <ActionIcon variant="light" onClick={(e) => { e.stopPropagation(); onEdit(version); }}>
                                <IconPencil size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={version.activo ? 'Desactivar' : 'Activar'}>
                            <ActionIcon 
                                variant="light" 
                                color={version.activo ? 'red' : 'green'} 
                                onClick={(e) => { e.stopPropagation(); onToggleActive(version); }}
                            >
                                {version.activo ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    const title = modelo && marca 
        ? `Detalle de Versiones para ${marca.nombre_marca} ${modelo.nombre_modelo}`
        : 'Detalle de Versiones';

    return (
        <Paper withBorder p="md" radius="md">
            <Group justify="space-between" mb="md">
                <Title order={5}>{title}</Title>
                <Button 
                    size="xs" 
                    variant="light" 
                    onClick={onAdd} 
                    disabled={!modelo} 
                    leftSection={<IconPlus size={14} />}
                >
                    Añadir Versión
                </Button>
            </Group>
            <Table striped highlightOnHover withTableBorder verticalSpacing="sm">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Marca</Table.Th>
                        <Table.Th>Años</Table.Th>
                        <Table.Th>Transmisión</Table.Th>
                        <Table.Th>Tracción</Table.Th>
                        <Table.Th>Combustible</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? rows : (
                        <Table.Tr>
                            <Table.Td colSpan={9}>
                                <Text c="dimmed" ta="center">
                                    {modelo ? 'No se encontraron versiones para este modelo.' : 'Seleccione una Marca y un Modelo para ver el detalle.'}
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    )}
                </Table.Tbody>
            </Table>
            {paginationSlot}
        </Paper>
    );
}