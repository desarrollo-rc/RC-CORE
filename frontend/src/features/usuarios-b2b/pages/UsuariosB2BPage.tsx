// frontend/src/features/usuarios-b2b/pages/UsuariosB2BPage.tsx
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    Box, 
    Title, 
    Button, 
    Group, 
    Modal, 
    Alert, 
    Center, 
    Loader, 
    TextInput, 
    Select, 
    Collapse, 
    Paper, 
    Text, 
    Pagination,
    Badge
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFilter, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { UsuariosB2BTable } from '../components/UsuariosB2BTable';
import { UsuarioB2BForm } from '../components/UsuarioB2BForm';
import { getUsuariosB2B } from '../services/usuarioB2BService';
import { fetchAllClientes } from '../../clientes/services/clienteService';
import type { UsuarioB2BFilters } from '../types';
import type { Cliente } from '../../clientes/types';

export function UsuariosB2BPage() {
    const [modalOpened, { open, close }] = useDisclosure(false);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [editingUsuario, setEditingUsuario] = useState<any>(null);
    const [filters, setFilters] = useState<UsuarioB2BFilters>({ page: 1, per_page: 15 });
    const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(true);
    const [clienteOptions, setClienteOptions] = useState<{ value: string; label: string }[]>([]);
    const [statsUsuarios, setStatsUsuarios] = useState<{ activos: number; inactivos: number } | null>(null);

    // Cargar opciones de clientes para el filtro (incluyendo inactivos)
    useEffect(() => {
        (async () => {
            try {
                const clientes = await fetchAllClientes(true); // true = incluir inactivos
                setClienteOptions(
                    clientes.map(c => ({ 
                        value: c.id_cliente.toString(), 
                        label: `${c.nombre_cliente} - ${c.rut_cliente}${!c.activo ? ' (Inactivo)' : ''}` 
                    }))
                );
            } catch (e) {
                // Silencio: filtros siguen funcionando
            }
        })();
    }, []);

    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['usuarios-b2b', filters],
        queryFn: () => getUsuariosB2B(filters),
    });

    // Cargar estadísticas de usuarios (activos e inactivos)
    const { data: statsData } = useQuery({
        queryKey: ['usuarios-b2b-stats'],
        queryFn: async () => {
            const [activosResp, inactivosResp] = await Promise.all([
                getUsuariosB2B({ page: 1, per_page: 1, activo: true }),
                getUsuariosB2B({ page: 1, per_page: 1, activo: false }),
            ]);
            return {
                activos: activosResp.pagination?.total || 0,
                inactivos: inactivosResp.pagination?.total || 0,
            };
        },
    });

    useEffect(() => {
        if (statsData) {
            setStatsUsuarios(statsData);
        }
    }, [statsData]);

    // Invalidar stats cuando se invalidan las queries de usuarios (después de activar/desactivar/crear/editar)
    useEffect(() => {
        const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
            if (event?.type === 'removed' && event.query.queryKey[0] === 'usuarios-b2b') {
                // Cuando se invalidan las queries de usuarios, también invalidar stats
                queryClient.invalidateQueries({ queryKey: ['usuarios-b2b-stats'] });
            }
        });
        return () => unsubscribe();
    }, [queryClient]);

    const handlePageChange = (newPage: number) => {
        setFilters(currentFilters => ({ ...currentFilters, page: newPage }));
    };

    const handleEdit = (usuario: any) => {
        setEditingUsuario(usuario);
        openEditModal();
    };

    const handleEditSuccess = () => {
        closeEditModal();
        setEditingUsuario(null);
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Group gap="md">
                    <Title order={2}>Usuarios B2B</Title>
                    {statsUsuarios && (
                        <Group gap="xs">
                            <Badge color="green" size="lg" variant="light">
                                Activos: {statsUsuarios.activos}
                            </Badge>
                            <Badge color="red" size="lg" variant="light">
                                Inactivos: {statsUsuarios.inactivos}
                            </Badge>
                        </Group>
                    )}
                </Group>
                <Group>
                    <Button
                        variant="outline"
                        leftSection={<IconFilter size={16} />}
                        rightSection={filtersOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                        onClick={toggleFilters}
                    >
                        {filtersOpened ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                    </Button>
                    <Button leftSection={<IconPlus size={14} />} onClick={open}>
                        Crear Usuario B2B
                    </Button>
                </Group>
            </Group>

            <Collapse in={filtersOpened}>
                <Paper withBorder p="md" mb="md" style={{ borderColor: '#373a40' }}>
                    <Text size="sm" fw={600} mb="md" c="dimmed">Filtros de Búsqueda</Text>
                    
                    <Group mb="md" grow>
                        <TextInput
                            label="Usuario"
                            placeholder="Ej: usuario1"
                            value={filters.usuario || ''}
                            onChange={(e) => {
                                const val = typeof e === 'string' ? e : e?.currentTarget?.value;
                                setFilters(f => ({ ...f, page: 1, usuario: val || undefined }));
                            }}
                        />
                        <TextInput
                            label="Nombre Completo"
                            placeholder="Ej: Juan Pérez"
                            value={filters.nombre_completo || ''}
                            onChange={(e) => {
                                const val = typeof e === 'string' ? e : e?.currentTarget?.value;
                                setFilters(f => ({ ...f, page: 1, nombre_completo: val || undefined }));
                            }}
                        />
                        <Select
                            label="Cliente"
                            placeholder="Seleccione cliente"
                            data={clienteOptions}
                            searchable
                            clearable
                            value={filters.id_cliente ? String(filters.id_cliente) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, id_cliente: val ? Number(val) : undefined }))}
                        />
                        <Select
                            label="Estado"
                            placeholder="Seleccione estado"
                            data={[
                                { value: 'true', label: 'Activo' },
                                { value: 'false', label: 'Inactivo' }
                            ]}
                            clearable
                            value={filters.activo !== undefined ? String(filters.activo) : null}
                            onChange={(val) => setFilters(f => ({ ...f, page: 1, activo: val ? val === 'true' : undefined }))}
                        />
                    </Group>
                </Paper>
            </Collapse>

            {isLoading ? (
                <Center h={400}>
                    <Loader />
                </Center>
            ) : error ? (
                <Alert color="red" title="Error">
                    No se pudieron cargar los usuarios B2B.
                </Alert>
            ) : (
                <>
                    <UsuariosB2BTable 
                        usuarios={data?.usuarios || []} 
                        onEdit={handleEdit}
                    />
                    {data?.pagination && data.pagination.pages > 1 && (
                        <Group justify="center" mt="md">
                            <Pagination 
                                total={data.pagination.pages} 
                                value={filters.page || 1} 
                                onChange={handlePageChange} 
                            />
                        </Group>
                    )}
                </>
            )}

            <Modal
                opened={modalOpened}
                onClose={close}
                title="Nuevo Usuario B2B"
                size="lg"
                centered
            >
                <UsuarioB2BForm onSuccess={close} />
            </Modal>

            <Modal
                opened={editModalOpened}
                onClose={handleEditSuccess}
                title="Editar Usuario B2B"
                size="lg"
                centered
            >
                {editingUsuario && (
                    <UsuarioB2BForm 
                        usuario={editingUsuario} 
                        onSuccess={handleEditSuccess} 
                    />
                )}
            </Modal>
        </Box>
    );
}

export default UsuariosB2BPage;

