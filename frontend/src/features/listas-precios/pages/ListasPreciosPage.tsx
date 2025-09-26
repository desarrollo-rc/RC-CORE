// frontend/src/features/listas-precios/pages/ListasPreciosPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { ListasPreciosTable } from '../components/ListasPreciosTable';
import { ListaPreciosForm } from '../components/ListaPreciosForm';
import { getListasPrecios, createListaPrecios, updateListaPrecios, deactivateListaPrecios, activateListaPrecios } from '../services/listaPreciosService';
import type { ListaPrecios, ListaPreciosPayload, ListaPreciosFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function ListasPreciosPage() {
    const [records, setRecords] = useState<ListaPrecios[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<ListaPrecios | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getListasPrecios(includeInactive);
                setRecords(data);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: ListaPreciosFormData) => {
        setIsSubmitting(true);
        const payload: ListaPreciosPayload = { 
            codigo_lista_precios: formValues.codigo_lista_precios,
            nombre_lista_precios: formValues.nombre_lista_precios,
            descripcion_lista_precios: formValues.descripcion_lista_precios || null,
            moneda: formValues.moneda,
        };
        try {
            if (editingRecord) {
                const updated = await updateListaPrecios(editingRecord.id_lista_precios, payload);
                setRecords(current => current.map(item => item.id_lista_precios === updated.id_lista_precios ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro actualizado.', color: 'blue' });
            } else {
                const newData = await createListaPrecios(payload);
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

    const handleEdit = (record: ListaPrecios) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: ListaPrecios) => {
        modals.openConfirmModal({
            title: 'Desactivar Registro',
            children: <Text size="sm">¿Estás seguro de desactivar "{record.nombre_lista_precios}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await deactivateListaPrecios(record.id_lista_precios);
                setRecords(current => current.map(item => item.id_lista_precios === updated.id_lista_precios ? updated : item));
            },
        });
    };

    const handleActivate = (record: ListaPrecios) => {
        modals.openConfirmModal({
            title: 'Activar Registro',
            children: <Text size="sm">¿Estás seguro de activar "{record.nombre_lista_precios}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await activateListaPrecios(record.id_lista_precios);
                setRecords(current => current.map(item => item.id_lista_precios === updated.id_lista_precios ? updated : item));
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <ListasPreciosTable records={records} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Listas de Precios</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Lista de Precios' : 'Crear Lista de Precios'} centered>
                <ListaPreciosForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        ...editingRecord,
                        descripcion_lista_precios: editingRecord.descripcion_lista_precios || ''
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