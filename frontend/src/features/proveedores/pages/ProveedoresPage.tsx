// frontend/src/features/proveedores/pages/ProveedoresPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { ProveedoresTable } from '../components/ProveedoresTable';
import { ProveedorForm } from '../components/ProveedorForm';
import { getProveedores, createProveedor, updateProveedor, deactivateProveedor, activateProveedor } from '../services/proveedorService';
import { getPaises } from '../../paises/services/paisService';
import type { Proveedor, ProveedorPayload, ProveedorFormData } from '../types';
import type { Pais } from '../../paises/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Proveedor | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const [proveedoresData, paisesData] = await Promise.all([
                    getProveedores(includeInactive),
                    getPaises()
                ]);
                setProveedores(proveedoresData);
                setPaises(paisesData);
            } catch (err) {
                setError('No se pudieron cargar los datos necesarios.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: ProveedorFormData) => {
        setIsSubmitting(true);
        const payload: ProveedorPayload = {
            ...formValues,
            id_pais: Number(formValues.id_pais),
            email: formValues.email || null,
            telefono: formValues.telefono || null,
            direccion: formValues.direccion || null,
        };
        try {
            if (editingRecord) {
                const updated = await updateProveedor(editingRecord.id_proveedor, payload);
                setProveedores(current => current.map(p => p.id_proveedor === updated.id_proveedor ? updated : p));
                notifications.show({ title: 'Éxito', message: 'Proveedor actualizado.', color: 'blue' });
            } else {
                const newRecord = await createProveedor(payload);
                setProveedores(current => [...current, newRecord]);
                notifications.show({ title: 'Éxito', message: 'Proveedor creado.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            const message = getApiErrorMessage(error, 'No se pudo guardar el proveedor.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleOpenModalForCreate = () => {
        setEditingRecord(null);
        openModal();
    };

    const handleEdit = (record: Proveedor) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: Proveedor) => {
        modals.openConfirmModal({
            title: 'Desactivar Proveedor',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar a "{record.nombre_proveedor}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateProveedor(record.id_proveedor);
                    setProveedores(current => current.map(p => p.id_proveedor === updated.id_proveedor ? updated : p));
                    notifications.show({ title: 'Éxito', message: 'Proveedor desactivado.', color: 'orange' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar.'), color: 'red' });
                }
            },
        });
    };

    const handleActivate = (record: Proveedor) => {
        modals.openConfirmModal({
            title: 'Activar Proveedor',
            children: <Text size="sm">¿Estás seguro de que quieres activar a "{record.nombre_proveedor}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await activateProveedor(record.id_proveedor);
                    setProveedores(current => current.map(p => p.id_proveedor === updated.id_proveedor ? updated : p));
                    notifications.show({ title: 'Éxito', message: 'Proveedor activado.', color: 'green' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar.'), color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <ProveedoresTable 
                    records={proveedores} 
                    onEdit={handleEdit} 
                    onDeactivate={handleDeactivate} 
                    onActivate={handleActivate} 
                />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Proveedores</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Proveedor' : 'Crear Nuevo Proveedor'} centered>
                <ProveedorForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        codigo_proveedor: editingRecord.codigo_proveedor,
                        nombre_proveedor: editingRecord.nombre_proveedor,
                        rut_proveedor: editingRecord.rut_proveedor,
                        id_pais: editingRecord.id_pais.toString(),
                        direccion: editingRecord.direccion || '',
                        telefono: editingRecord.telefono || '',
                        email: editingRecord.email || ''
                    } : null}
                    paises={paises}
                />
            </Modal>
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <ActionIcon color="red" size={60} radius="xl" onClick={handleOpenModalForCreate}>
                    <IconPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
                </ActionIcon>
            </Affix>
        </Box>
    );
}