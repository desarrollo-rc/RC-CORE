// frontend/src/features/tipos-cliente/pages/TiposClientePage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { TiposClienteTable } from '../components/TiposClienteTable';
import { TipoClienteForm } from '../components/TipoClienteForm';
import { getTiposCliente, createTipoCliente, updateTipoCliente, deactivateTipoCliente, activateTipoCliente } from '../services/tipoClienteService';
import type { TipoCliente, TipoClientePayload, TipoClienteFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function TiposClientePage() {
    const [records, setRecords] = useState<TipoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<TipoCliente | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getTiposCliente(includeInactive);
                setRecords(data);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: TipoClienteFormData) => {
        setIsSubmitting(true);
        const payload: TipoClientePayload = { 
            codigo_tipo_cliente: formValues.codigo_tipo_cliente,
            nombre_tipo_cliente: formValues.nombre_tipo_cliente,
            descripcion_tipo_cliente: formValues.descripcion_tipo_cliente || null
        };
        try {
            if (editingRecord) {
                const updated = await updateTipoCliente(editingRecord.id_tipo_cliente, payload);
                setRecords(current => current.map(item => item.id_tipo_cliente === updated.id_tipo_cliente ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro actualizado.', color: 'blue' });
            } else {
                const newData = await createTipoCliente(payload);
                setRecords(current => [...current, newData]);
                notifications.show({ title: 'Éxito', message: 'Registro creado.', color: 'green' });
            }
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

    const handleEdit = (record: TipoCliente) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: TipoCliente) => {
        modals.openConfirmModal({
            title: 'Desactivar Registro',
            children: <Text size="sm">¿Estás seguro de desactivar "{record.nombre_tipo_cliente}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await deactivateTipoCliente(record.id_tipo_cliente);
                setRecords(current => current.map(item => item.id_tipo_cliente === updated.id_tipo_cliente ? updated : item));
            },
        });
    };

    const handleActivate = (record: TipoCliente) => {
        modals.openConfirmModal({
            title: 'Activar Registro',
            children: <Text size="sm">¿Estás seguro de activar "{record.nombre_tipo_cliente}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await activateTipoCliente(record.id_tipo_cliente);
                setRecords(current => current.map(item => item.id_tipo_cliente === updated.id_tipo_cliente ? updated : item));
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <TiposClienteTable records={records} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Tipos de Cliente</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Tipo de Cliente' : 'Crear Tipo de Cliente'} centered>
                <TipoClienteForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        ...editingRecord,
                        descripcion_tipo_cliente: editingRecord.descripcion_tipo_cliente || ''
                    } : null}
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