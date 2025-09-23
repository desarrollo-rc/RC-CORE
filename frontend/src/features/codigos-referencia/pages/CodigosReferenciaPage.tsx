// frontend/src/features/codigos-referencia/pages/CodigosReferenciaListPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Paper, Affix, ActionIcon, rem, Modal, Alert, Center, Loader, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';

// Componentes
import { CodigosReferenciaTable } from '../components/CodigosReferenciaTable';
import { CodigoReferenciaForm } from '../components/CodigoReferenciaForm';

// Servicios
import { getCodigosReferencia, createCodigoReferencia, updateCodigoReferencia, activateCodigoReferencia, deactivateCodigoReferencia } from '../services/codigoReferenciaService';
import { getDivisiones } from '../../divisiones/services/divisionService';
import { getCategorias, getSubCategorias, getDetSubCategorias } from '../../categorizacion/services/categorizacionService';
import { getClasificacionesServicio } from '../../clasificaciones-servicio/services/clasificacionServicioService';
import { getClasificacionesEstadistica } from '../../clasificaciones-estadistica/services/clasificacionEstadisticaService';

// Tipos
import type { CodigoReferencia, CodigoReferenciaFormData, CodigoReferenciaPayload } from '../types';
import type { Division, Categoria, SubCategoria, DetSubCategoria } from '../../categorizacion/types';
import type { ClasificacionServicio } from '../../clasificaciones-servicio/types';
import type { ClasificacionEstadistica } from '../../clasificaciones-estadistica/types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function CodigosReferenciaPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- ESTADO PRINCIPAL DE DATOS ---
    const [codigosReferencia, setCodigosReferencia] = useState<CodigoReferencia[]>([]);
    
    // --- ESTADOS PARA LOS FORMULARIOS Y MODALES ---
    const [divisiones, setDivisiones] = useState<Division[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
    const [detSubCategorias, setDetSubCategorias] = useState<DetSubCategoria[]>([]);
    const [clasificacionesServicio, setClasificacionesServicio] = useState<ClasificacionServicio[]>([]);
    const [clasificacionesEstadistica, setClasificacionesEstadistica] = useState<ClasificacionEstadistica[]>([]);
    
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
    const [editingRecord, setEditingRecord] = useState<CodigoReferencia | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [refData, divData, catData, subCatData, detSubCatData, servData, estData] = await Promise.all([
                    getCodigosReferencia(), getDivisiones(), getCategorias(), getSubCategorias(),
                    getDetSubCategorias(), getClasificacionesServicio(), getClasificacionesEstadistica()
                ]);
                setCodigosReferencia(refData);
                setDivisiones(divData);
                setCategorias(catData);
                setSubCategorias(subCatData);
                setDetSubCategorias(detSubCatData);
                setClasificacionesServicio(servData);
                setClasificacionesEstadistica(estData);
            } catch (err) {
                setError('No se pudieron cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRowClick = (record: CodigoReferencia) => {
        navigate(`/codigos-referencia/${record.id_codigo_referencia}`);
    };

    const handleOpenModalForCreate = () => {
        setEditingRecord(null);
        openModal();
    };

    const handleEdit = (record: CodigoReferencia) => {
        setEditingRecord(record);
        openModal();
    };
    
    const handleSubmit = async (formValues: CodigoReferenciaFormData) => {
        setIsSubmitting(true);
        const payload: CodigoReferenciaPayload = {
            codigo: formValues.codigo,
            descripcion: formValues.descripcion || null,
            id_sub_categoria: Number(formValues.id_sub_categoria),
            id_det_sub_categoria: formValues.id_det_sub_categoria ? Number(formValues.id_det_sub_categoria) : null,
            id_clasificacion_servicio: formValues.id_clasificacion_servicio ? Number(formValues.id_clasificacion_servicio) : null,
            id_clasificacion_estadistica: formValues.id_clasificacion_estadistica ? Number(formValues.id_clasificacion_estadistica) : null,
        };

        try {
            if (editingRecord) {
                const updated = await updateCodigoReferencia(editingRecord.id_codigo_referencia, payload);
                setCodigosReferencia(current => current.map(c => c.id_codigo_referencia === updated.id_codigo_referencia ? { ...c, ...updated } : c));
                notifications.show({ title: 'Éxito', message: 'Actualizado correctamente.', color: 'blue' });
            } else {
                const newData = await createCodigoReferencia(payload);
                setCodigosReferencia(current => [...current, newData]);
                notifications.show({ title: 'Éxito', message: 'Creado correctamente.', color: 'green' });
            }
            closeModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el código.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeactivate = (record: CodigoReferencia) => {
        modals.openConfirmModal({
            title: 'Desactivar Código',
            children: <Text size="sm">¿Estás seguro de desactivar "{record.codigo}"?</Text>,
            onConfirm: async () => {
                const updated = await deactivateCodigoReferencia(record.id_codigo_referencia);
                setCodigosReferencia(current => current.map(c => c.id_codigo_referencia === updated.id_codigo_referencia ? updated : c));
            },
        });
    };

    const handleActivate = (record: CodigoReferencia) => {
        modals.openConfirmModal({
            title: 'Activar Código',
            children: <Text size="sm">¿Estás seguro de activar "{record.codigo}"?</Text>,
            onConfirm: async () => {
                const updated = await activateCodigoReferencia(record.id_codigo_referencia);
                setCodigosReferencia(current => current.map(c => c.id_codigo_referencia === updated.id_codigo_referencia ? updated : c));
            },
        });
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;

    return (
        <Box>
            <Title order={2} mb="xl">Códigos de Referencia</Title>
            <Paper withBorder p="md" radius="md">
                <CodigosReferenciaTable
                    records={codigosReferencia}
                    onRowClick={handleRowClick}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                    selectedRecordId={null}
                />
            </Paper>
            <Modal opened={modalOpened} onClose={closeModal} title={editingRecord ? 'Editar Código de Referencia' : 'Crear Código de Referencia'} size="lg" centered>
                <CodigoReferenciaForm
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingRecord ? {
                        // --- INICIO DE LA CORRECCIÓN ---
                        codigo: editingRecord.codigo,
                        descripcion: editingRecord.descripcion || '', // Si es null, usa un string vacío
                        id_sub_categoria: editingRecord.id_sub_categoria.toString(),
                        id_det_sub_categoria: editingRecord.id_det_sub_categoria?.toString() || null,
                        id_clasificacion_servicio: editingRecord.id_clasificacion_servicio?.toString() || null,
                        id_clasificacion_estadistica: editingRecord.id_clasificacion_estadistica?.toString() || null,
                        // El resto de los campos para el form
                        id_division: null, // Se calculará en el useEffect del form
                        id_categoria: null, // Se calculará en el useEffect del form
                        // --- FIN DE LA CORRECCIÓN ---
                    } : null}
                    divisiones={divisiones}
                    categorias={categorias}
                    subCategorias={subCategorias}
                    detSubCategorias={detSubCategorias}
                    clasificacionesServicio={clasificacionesServicio}
                    clasificacionesEstadistica={clasificacionesEstadistica}
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