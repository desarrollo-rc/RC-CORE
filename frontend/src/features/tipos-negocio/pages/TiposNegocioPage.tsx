// frontend/src/features/tipos-negocio/pages/TiposNegocioPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { TiposNegocioTable } from '../components/TiposNegocioTable';
import { TipoNegocioForm } from '../components/TipoNegocioForm';
import { getTiposNegocio, createTipoNegocio, updateTipoNegocio, deactivateTipoNegocio, activateTipoNegocio } from '../services/tipoNegocioService';
import type { TipoNegocio, TipoNegocioPayload, TipoNegocioFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function TiposNegocioPage() {
    const [records, setRecords] = useState<TipoNegocio[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<TipoNegocio | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getTiposNegocio(includeInactive);
                setRecords(data);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: TipoNegocioFormData) => {
        setIsSubmitting(true);
        const payload: TipoNegocioPayload = { 
            codigo_tipo_negocio: formValues.codigo_tipo_negocio,
            nombre_tipo_negocio: formValues.nombre_tipo_negocio,
            descripcion_tipo_negocio: formValues.descripcion_tipo_negocio || null
        };
        try {
            if (editingRecord) {
                const updated = await updateTipoNegocio(editingRecord.id_tipo_negocio, payload);
                setRecords(current => current.map(item => item.id_tipo_negocio === updated.id_tipo_negocio ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro actualizado.', color: 'blue' });
            } else {
                const newData = await createTipoNegocio(payload);
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

    const handleEdit = (record: TipoNegocio) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: TipoNegocio) => {
        modals.openConfirmModal({
            title: 'Desactivar Registro',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar "{record.nombre_tipo_negocio}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateTipoNegocio(record.id_tipo_negocio);
                    setRecords(current => current.map(item => item.id_tipo_negocio === updated.id_tipo_negocio ? updated : item));
                    notifications.show({ title: 'Éxito', message: 'Registro desactivado.', color: 'orange' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar.'), color: 'red' });
                }
            },
        });
    };

    const handleActivate = (record: TipoNegocio) => {
        modals.openConfirmModal({
            title: 'Activar Registro',
            children: <Text size="sm">¿Estás seguro de que quieres activar "{record.nombre_tipo_negocio}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    const updated = await activateTipoNegocio(record.id_tipo_negocio);
                    setRecords(current => current.map(item => item.id_tipo_negocio === updated.id_tipo_negocio ? updated : item));
                    notifications.show({ title: 'Éxito', message: 'Registro activado.', color: 'green' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar.'), color: 'red' });
                }
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <TiposNegocioTable records={records} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Tipos de Negocio</Title>
                <Switch
                    label="Incluir inactivos"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Tipo de Negocio' : 'Crear Tipo de Negocio'} centered>
                <TipoNegocioForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        ...editingRecord,
                        descripcion_tipo_negocio: editingRecord.descripcion_tipo_negocio || ''
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