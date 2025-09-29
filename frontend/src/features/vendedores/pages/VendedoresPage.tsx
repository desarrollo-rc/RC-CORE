// frontend/src/features/vendedores/pages/VendedoresPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Modal, Affix, ActionIcon, rem, Text, Switch } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { VendedoresTable } from '../components/VendedoresTable';
import { VendedorForm } from '../components/VendedorForm';
import { getVendedores, createVendedor, updateVendedor, deactivateVendedor, activateVendedor } from '../services/vendedorService';
import { getUsuarios } from '../../usuarios/services/usuarioService';
import type { Vendedor, VendedorPayload, VendedorFormData } from '../types';
import type { Usuario } from '../../usuarios/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function VendedoresPage() {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Vendedor | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    const fetchData = async () => {
        try {
            // No seteamos loading aquí para una recarga más suave
            setError(null);
            const [vendedoresData, usuariosData] = await Promise.all([getVendedores(), getUsuarios()]);
            setVendedores(vendedoresData);
            setUsuarios(usuariosData);
        } catch (err) {
            setError('No se pudieron cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []); // Solo se ejecuta una vez al montar

    const availableUsers = useMemo(() => {
        const vendedorUserIds = new Set(vendedores.map(v => v.usuario.id_usuario));
        return usuarios.filter(u => !vendedorUserIds.has(u.id_usuario));
    }, [vendedores, usuarios]);

    const filteredVendedores = useMemo(() => {
        if (includeInactive) {
            return vendedores;
        }
        return vendedores.filter(v => v.activo);
    }, [vendedores, includeInactive]);

    const handleSubmit = async (formValues: VendedorFormData) => {
        setIsSubmitting(true);
        const payload: Partial<VendedorPayload> = {
            id_usuario: Number(formValues.id_usuario),
            codigo_vendedor_sap: formValues.codigo_vendedor_sap || null,
        };
        try {
            if (editingRecord) {
                await updateVendedor(editingRecord.id_vendedor, { codigo_vendedor_sap: payload.codigo_vendedor_sap });
                notifications.show({ title: 'Éxito', message: 'Vendedor actualizado.', color: 'blue' });
            } else {
                await createVendedor(payload as VendedorPayload);
                notifications.show({ title: 'Éxito', message: 'Vendedor asignado.', color: 'green' });
            }
            await fetchData();
            closeModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el registro.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingRecord(null);
        openModal();
    };

    const handleEdit = (record: Vendedor) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: Vendedor) => {
        modals.openConfirmModal({
            title: 'Desactivar Vendedor',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar a "{record.usuario.nombre_completo}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    await deactivateVendedor(record.id_vendedor);
                    await fetchData(); // Clave: Refrescar los datos
                    notifications.show({ title: 'Éxito', message: 'Vendedor desactivado.' });
                } catch(error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar.'), color: 'red' });
                }
            },
        });
    };

    const handleActivate = (record: Vendedor) => {
        modals.openConfirmModal({
            title: 'Activar Vendedor',
            children: <Text size="sm">¿Estás seguro de que quieres activar a "{record.usuario.nombre_completo}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await activateVendedor(record.id_vendedor);
                    await fetchData(); // Clave: Refrescar los datos
                    notifications.show({ title: 'Éxito', message: 'Vendedor activado.' });
                } catch(error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar.'), color: 'red' });
                }
            },
        });
    };
    
    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <VendedoresTable records={filteredVendedores} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Vendedores</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? `Editar Vendedor: ${editingRecord.usuario.nombre_completo}` : 'Asignar Nuevo Vendedor'} centered>
                <VendedorForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    editingVendedor={editingRecord}
                    availableUsers={availableUsers}
                    allUsers={usuarios}
                />
            </Modal>
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <ActionIcon color="red" size={60} radius="xl" variant="filled" onClick={handleOpenModalForCreate}>
                    <IconPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </Affix>
        </Box>
    );
}