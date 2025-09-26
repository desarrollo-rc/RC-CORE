// frontend/src/features/condiciones-pago/pages/CondicionesPagoPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { CondicionesPagoTable } from '../components/CondicionesPagoTable';
import { CondicionPagoForm } from '../components/CondicionPagoForm';
import { getCondicionesPago, createCondicionPago, updateCondicionPago, deactivateCondicionPago, activateCondicionPago } from '../services/condicionPagoService';
import type { CondicionPago, CondicionPagoPayload, CondicionPagoFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function CondicionesPagoPage() {
    const [records, setRecords] = useState<CondicionPago[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CondicionPago | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getCondicionesPago(includeInactive);
                setRecords(data);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: CondicionPagoFormData) => {
        setIsSubmitting(true);
        const payload: CondicionPagoPayload = { 
            codigo_condicion_pago: formValues.codigo_condicion_pago,
            nombre_condicion_pago: formValues.nombre_condicion_pago,
            descripcion_condicion_pago: formValues.descripcion_condicion_pago || null,
            dias_credito: Number(formValues.dias_credito),
            ambito: formValues.ambito,
        };
        try {
            if (editingRecord) {
                const updated = await updateCondicionPago(editingRecord.id_condicion_pago, payload);
                setRecords(current => current.map(item => item.id_condicion_pago === updated.id_condicion_pago ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro actualizado.', color: 'blue' });
            } else {
                const newData = await createCondicionPago(payload);
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

    const handleEdit = (record: CondicionPago) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: CondicionPago) => {
        modals.openConfirmModal({
            title: 'Desactivar Registro',
            children: <Text size="sm">¿Estás seguro de desactivar "{record.nombre_condicion_pago}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await deactivateCondicionPago(record.id_condicion_pago);
                setRecords(current => current.map(item => item.id_condicion_pago === updated.id_condicion_pago ? updated : item));
            },
        });
    };

    const handleActivate = (record: CondicionPago) => {
        modals.openConfirmModal({
            title: 'Activar Registro',
            children: <Text size="sm">¿Estás seguro de activar "{record.nombre_condicion_pago}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await activateCondicionPago(record.id_condicion_pago);
                setRecords(current => current.map(item => item.id_condicion_pago === updated.id_condicion_pago ? updated : item));
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <CondicionesPagoTable records={records} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Condiciones de Pago</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Condición de Pago' : 'Crear Condición de Pago'} centered>
                <CondicionPagoForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        ...editingRecord,
                        descripcion_condicion_pago: editingRecord.descripcion_condicion_pago || ''
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