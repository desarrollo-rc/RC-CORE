// frontend/src/features/empresas/pages/EmpresasPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Affix, ActionIcon, rem, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';
import { EmpresasTable } from '../components/EmpresasTable';
import { EmpresaForm } from '../components/EmpresaForm';
import { getEmpresas, createEmpresa, updateEmpresa, deactivateEmpresa, activateEmpresa } from '../services/empresaService';
import type { Empresa, EmpresaPayload, EmpresaFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function EmpresasPage() {
    const [records, setRecords] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Empresa | null>(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getEmpresas(includeInactive);
                setRecords(data);
            } catch (err) {
                setError('No se pudieron cargar los datos.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [includeInactive]);

    const handleSubmit = async (formValues: EmpresaFormData) => {
        setIsSubmitting(true);
        const payload: EmpresaPayload = { 
            codigo_empresa: formValues.codigo_empresa,
            nombre_empresa: formValues.nombre_empresa,
            rut_empresa: formValues.rut_empresa,
        };
        try {
            if (editingRecord) {
                const updated = await updateEmpresa(editingRecord.id_empresa, payload);
                setRecords(current => current.map(item => item.id_empresa === updated.id_empresa ? updated : item));
                notifications.show({ title: 'Éxito', message: 'Registro actualizado.', color: 'blue' });
            } else {
                const newData = await createEmpresa(payload);
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

    const handleEdit = (record: Empresa) => {
        setEditingRecord(record);
        openModal();
    };

    const handleDeactivate = (record: Empresa) => {
        modals.openConfirmModal({
            title: 'Desactivar Registro',
            children: <Text size="sm">¿Estás seguro de desactivar "{record.nombre_empresa}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await deactivateEmpresa(record.id_empresa);
                setRecords(current => current.map(item => item.id_empresa === updated.id_empresa ? updated : item));
            },
        });
    };

    const handleActivate = (record: Empresa) => {
        modals.openConfirmModal({
            title: 'Activar Registro',
            children: <Text size="sm">¿Estás seguro de activar "{record.nombre_empresa}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await activateEmpresa(record.id_empresa);
                setRecords(current => current.map(item => item.id_empresa === updated.id_empresa ? updated : item));
            },
        });
    };

    const renderContent = () => {
        if (loading) return <Center h={200}><Loader /></Center>;
        if (error) return <Alert color="red" title="Error">{error}</Alert>;
        return <EmpresasTable records={records} onEdit={handleEdit} onDeactivate={handleDeactivate} onActivate={handleActivate} />;
    };

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Empresas</Title>
                <Switch
                    label="Incluir inactivas"
                    checked={includeInactive}
                    onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                />
            </Group>
            {renderContent()}
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Empresa' : 'Crear Empresa'} centered>
                <EmpresaForm 
                    onSubmit={handleSubmit} 
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord}
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