// frontend/src/features/consultas/pages/ConsultasPage.tsx
import { useState, useEffect } from 'react';
import { Button, Title, Modal, Group, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { Consulta, ConsultaCreate, ConsultaUpdate } from '../types';
import { createConsulta, getConsultas, updateConsulta, executeConsulta, sincronizarPedidosB2B, downloadConsultaExcel } from '../services/consultaService';
import { ConsultaForm } from '../components/ConsultaForm';
import { ConsultasTable } from '../components/ConsultasTable';
import { QueryResultModal } from '../components/QueryResultModal'; // <-- ¡Importamos el nuevo modal!

export function ConsultasPage() {
    const [consultas, setConsultas] = useState<Consulta[]>([]);
    const [formModalOpened, { open: openFormModal, close: closeFormModal }] = useDisclosure(false);
    const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- NUEVOS ESTADOS PARA LA EJECUCIÓN ---
    const [isExecuting, setIsExecuting] = useState(false);
    const [executionResult, setExecutionResult] = useState<Record<string, any>[] | null>(null);
    const [executionError, setExecutionError] = useState<string | null>(null);
    const [resultModalOpened, { open: openResultModal, close: closeResultModal }] = useDisclosure(false);
    const [currentQueryTitle, setCurrentQueryTitle] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);
    const [filasTotales, setFilasTotales] = useState<number | undefined>(undefined);
    const [limitado, setLimitado] = useState(false);
    const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
    const [currentConsultaCodigo, setCurrentConsultaCodigo] = useState('');

    const loadConsultas = async () => {
        try {
            const data = await getConsultas();
            setConsultas(data);
        } catch (error) {
            notifications.show({ color: 'red', message: 'Error al cargar las consultas' });
        }
    };

    useEffect(() => {
        loadConsultas();
    }, []);

    const handleFormSubmit = async (values: ConsultaCreate | ConsultaUpdate) => {
        setIsSubmitting(true);
        try {
            if (editingConsulta) {
                await updateConsulta(editingConsulta.codigo_consulta, values);
                notifications.show({ color: 'green', message: 'Consulta actualizada exitosamente' });
            } else {
                await createConsulta(values as ConsultaCreate);
                notifications.show({ color: 'green', message: 'Consulta creada exitosamente' });
            }
            handleCloseFormModal();
            await loadConsultas();
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al guardar la consulta';
            notifications.show({ color: 'red', message: errorMsg });
        } finally {
            setIsSubmitting(false);
        }
    };

    const runSyncProcess = async () => {
        setIsSyncing(true);
        try {
            const result = await sincronizarPedidosB2B();
            
            let notificationMessage = `Total en RC CORE: ${result.total_en_rc_core}, Procesados: ${result.pedidos_procesados}, Actualizados: ${result.actualizados}.`;
            
            if (result.omitidos_no_existen > 0) {
                notificationMessage += ` Omitidos (no existen en RC CORE): ${result.omitidos_no_existen}.`;
            }
            
            const notificationColor = result.actualizados > 0 ? 'green' : 'orange';

            if (result.errores && result.errores.length > 0) {
                notificationMessage += ` Errores: ${result.errores.length}.`;
                console.warn(`[Diagnóstico de Sincronización] Errores durante la sincronización:`, result.errores);
            }

            notifications.show({
                color: notificationColor,
                title: 'Sincronización Completada',
                message: notificationMessage,
                autoClose: 10000,
            });

            return result; // Devolvemos el resultado para poder usarlo después
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error en la sincronización';
            notifications.show({ color: 'red', message: errorMsg });
            throw error; // Lanzamos el error para que el llamador sepa que falló
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncFromButton = async () => {
        if (!confirm('¿Seguro que deseas sincronizar los pedidos B2B?')) return;
        await runSyncProcess();
    };
    
    const handleApplySyncFromModal = async () => {
        if (!confirm('¿Estás seguro de que deseas aplicar la sincronización en RC CORE?')) return;
        await runSyncProcess();
        closeResultModal();
        await loadConsultas();
    };

    // --- LÓGICA DE EJECUCIÓN IMPLEMENTADA ---
    const handleExecute = async (consulta: Consulta) => {
        if (consulta.tipo !== 'LECTURA') {
            notifications.show({ color: 'orange', message: 'Solo se pueden ejecutar consultas de tipo LECTURA.' });
            return;
        }
        setIsExecuting(true);
        setCurrentQueryTitle(consulta.nombre);
        setCurrentConsultaCodigo(consulta.codigo_consulta);
        try {
            const result = await executeConsulta(consulta.codigo_consulta);
            setExecutionResult(result.data);
            setFilasTotales(result.filas_totales);
            setLimitado(result.limitado || false);
            setExecutionError(null);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error desconocido al ejecutar';
            setExecutionResult(null);
            setFilasTotales(undefined);
            setLimitado(false);
            setExecutionError(errorMsg);
        } finally {
            setIsExecuting(false);
            openResultModal();
        }
    };

    const handleDownloadExcel = async () => {
        setIsDownloadingExcel(true);
        try {
            const blob = await downloadConsultaExcel(currentConsultaCodigo);
            
            // Crear URL del blob y descargar
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentConsultaCodigo}_resultados.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            notifications.show({ 
                color: 'green', 
                message: 'Archivo Excel descargado exitosamente' 
            });
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || 'Error al descargar el archivo Excel';
            notifications.show({ 
                color: 'red', 
                message: errorMsg 
            });
        } finally {
            setIsDownloadingExcel(false);
        }
    };

    const handleEdit = (consulta: Consulta) => {
        setEditingConsulta(consulta);
        openFormModal();
    };

    const handleOpenCreate = () => {
        setEditingConsulta(null);
        openFormModal();
    };

    const handleCloseFormModal = () => {
        closeFormModal();
        setEditingConsulta(null); // Limpiar siempre al cerrar
    };

    const handleDelete = (consulta: Consulta) => {
        console.log('ELIMINAR:', consulta);
        // Lógica de eliminación futura aquí
    };

    return (
        <>
            <LoadingOverlay visible={isExecuting || isSubmitting || isSyncing} overlayProps={{ radius: 'sm', blur: 2 }} />

            <Modal
                opened={formModalOpened}
                onClose={handleCloseFormModal}
                title={editingConsulta ? 'Editar Consulta' : 'Nueva Consulta'}
                size="lg"
            >
                <ConsultaForm
                    onSubmit={handleFormSubmit}
                    initialValues={editingConsulta || undefined}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <QueryResultModal
                opened={resultModalOpened}
                onClose={closeResultModal}
                title={`Resultado de: ${currentQueryTitle}`}
                data={executionResult}
                error={executionError}
                filas_totales={filasTotales}
                limitado={limitado}
                onDownloadExcel={handleDownloadExcel}
                isDownloadingExcel={isDownloadingExcel}
                actionButton={
                    currentQueryTitle.includes('Pedidos B2B')
                        ? {
                            label: 'Aplicar Sincronización',
                            onClick: handleApplySyncFromModal,
                            isLoading: isSyncing,
                            color: 'green'
                        }
                        : undefined
                }
            />

            <Group justify="space-between" mb="xl">
                <Title order={2}>Administración de Consultas</Title>
                <div>
                    <Button onClick={handleSyncFromButton} color="orange" mr="md" disabled={isExecuting}>
                        Sincronizar Pedidos B2B
                    </Button>
                    <Button onClick={handleOpenCreate}>Crear Consulta</Button>
                </div>
            </Group>

            <ConsultasTable
                data={consultas}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExecute={handleExecute}
            />
        </>
    );
}