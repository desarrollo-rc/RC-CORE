// frontend/src/features/segmentos-cliente/pages/SegmentosClientePage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { SegmentosClienteTable } from '../components/SegmentosClienteTable';
import { SegmentoClienteForm } from '../components/SegmentoClienteForm';
import { getSegmentosCliente, createSegmentoCliente, updateSegmentoCliente, deactivateSegmentoCliente, activateSegmentoCliente } from '../services/segmentoClienteService';
import type { SegmentoCliente, SegmentoClientePayload, SegmentoClienteFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function SegmentosClientePage() {
    const [records, setRecords] = useState<SegmentoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<SegmentoCliente | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getSegmentosCliente(includeInactive);
                setRecords(data);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: SegmentoClienteFormData) => {
        setIsSubmitting(true);
        const payload: SegmentoClientePayload = { 
            codigo_segmento_cliente: formValues.codigo_segmento_cliente,
            nombre_segmento_cliente: formValues.nombre_segmento_cliente,
            descripcion_segmento_cliente: formValues.descripcion_segmento_cliente || null
        };
        try {
            if (editingRecord) {
                const updated = await updateSegmentoCliente(editingRecord.id_segmento_cliente, payload);
                setRecords(current => current.map(item => item.id_segmento_cliente === updated.id_segmento_cliente ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro actualizado.', color: 'blue' });
            } else {
                const newData = await createSegmentoCliente(payload);
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

    const handleEdit = (record: SegmentoCliente) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: SegmentoCliente) => {
        modals.openConfirmModal({
            title: 'Desactivar Registro',
            children: <Text size="sm">¿Estás seguro de desactivar "{record.nombre_segmento_cliente}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await deactivateSegmentoCliente(record.id_segmento_cliente);
                setRecords(current => current.map(item => item.id_segmento_cliente === updated.id_segmento_cliente ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro desactivado.', color: 'orange' });
            },
        });
    };

    const handleActivate = (record: SegmentoCliente) => {
        modals.openConfirmModal({
            title: 'Activar Registro',
            children: <Text size="sm">¿Estás seguro de activar "{record.nombre_segmento_cliente}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await activateSegmentoCliente(record.id_segmento_cliente);
                setRecords(current => current.map(item => item.id_segmento_cliente === updated.id_segmento_cliente ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro activado.', color: 'green' });
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <SegmentosClienteTable records={records} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Segmentos de Cliente</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Segmento' : 'Crear Segmento'} centered>
                <SegmentoClienteForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        ...editingRecord,
                        descripcion_segmento_cliente: editingRecord.descripcion_segmento_cliente || ''
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