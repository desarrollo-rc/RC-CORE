// frontend/src/features/equipos/pages/EquiposPage.tsx
import { useState } from 'react';
import { Box, Title, Button, Group, Modal, Center, Loader, Alert, Pagination } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { EquiposTable } from '../components/EquiposTable';
import { EquipoForm } from '../components/EquipoForm';
import { getEquipos } from '../services/equipoService';
import type { EquipoFilters } from '../types';

export function EquiposPage() {
    const [modalOpened, { open, close }] = useDisclosure(false);
    const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
    const [editingEquipo, setEditingEquipo] = useState<any>(null);
    const [filters, setFilters] = useState<EquipoFilters>({ page: 1, per_page: 15 });

    const { data, isLoading, error } = useQuery({
        queryKey: ['equipos', filters],
        queryFn: () => getEquipos(filters),
    });

    const handlePageChange = (newPage: number) => {
        setFilters(currentFilters => ({ ...currentFilters, page: newPage }));
    };

    const handleEdit = (equipo: any) => {
        setEditingEquipo(equipo);
        openEditModal();
    };

    const handleEditSuccess = () => {
        closeEditModal();
        setEditingEquipo(null);
    };

    return (
        <Box>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Equipos</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={open}>
                    Nuevo Equipo
                </Button>
            </Group>

            {isLoading ? (
                <Center h={400}>
                    <Loader />
                </Center>
            ) : error ? (
                <Alert color="red" title="Error">
                    No se pudieron cargar los equipos.
                </Alert>
            ) : (
                <>
                    <EquiposTable 
                        equipos={data?.equipos || []} 
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
                title="Nuevo Equipo"
                size="lg"
                centered
            >
                <EquipoForm onSuccess={close} />
            </Modal>

            <Modal
                opened={editModalOpened}
                onClose={handleEditSuccess}
                title="Editar Equipo"
                size="lg"
                centered
            >
                {editingEquipo && <EquipoForm equipo={editingEquipo} onSuccess={handleEditSuccess} />}
            </Modal>
        </Box>
    );
}

