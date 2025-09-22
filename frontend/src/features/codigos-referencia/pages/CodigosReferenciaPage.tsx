// frontend/src/features/codigos-referencia/pages/CodigosReferenciaPage.tsx
import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Modal, Grid, Button, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus } from '@tabler/icons-react';

// Componentes
import { CodigosReferenciaTable } from '../components/CodigosReferenciaTable';
import { CodigoReferenciaForm } from '../components/CodigoReferenciaForm';
import { CodigosTecnicosTable } from '../components/CodigosTecnicosTable';
import { CodigoTecnicoForm } from '../components/CodigoTecnicoForm';

// Servicios
import { getCodigosReferencia, createCodigoReferencia, updateCodigoReferencia, activateCodigoReferencia, deactivateCodigoReferencia, createCodigoTecnico, updateCodigoTecnico, deleteCodigoTecnico } from '../services/codigoReferenciaService';
import { getDivisiones } from '../../divisiones/services/divisionService';
import { getCategorias, getSubCategorias, getDetSubCategorias } from '../../categorizacion/services/categorizacionService';
import type { Division, Categoria, SubCategoria, DetSubCategoria } from '../../categorizacion/types';

// Tipos
import type { CodigoReferencia, CodigoTecnico, CodigoReferenciaFormData, CodigoTecnicoFormData, CodigoReferenciaPayload, CodigoTecnicoPayload } from '../types';

import { getApiErrorMessage } from '../../../utils/errorHandler';

export function CodigosReferenciaPage() {
    // Estados para el Padre (CodigoReferencia)
    const [codigosReferencia, setCodigosReferencia] = useState<CodigoReferencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCodigoReferencia, setSelectedCodigoReferencia] = useState<CodigoReferencia | null>(null);
    const [editingCodigoReferencia, setEditingCodigoReferencia] = useState<CodigoReferencia | null>(null);
    const [refModalOpened, { open: openRefModal, close: closeRefModal }] = useDisclosure(false);
    
    // Estados para el Hijo (CodigoTecnico)
    const [editingCodigoTecnico, setEditingCodigoTecnico] = useState<CodigoTecnico | null>(null);
    const [tecModalOpened, { open: openTecModal, close: closeTecModal }] = useDisclosure(false);
    
    // Estado para datos de soporte (Subcategorías)
    const [divisiones, setDivisiones] = useState<Division[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
    const [detSubCategorias, setDetSubCategorias] = useState<DetSubCategoria[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                // Cargamos toda la data en paralelo
                const [refData, divData, catData, subCatData, detSubCatData] = await Promise.all([
                    getCodigosReferencia(),
                    getDivisiones(),
                    getCategorias(), // Necesitamos un getCategorias() global
                    getSubCategorias(),
                    getDetSubCategorias()
                ]);
                setCodigosReferencia(refData);
                setDivisiones(divData);
                setCategorias(catData);
                setSubCategorias(subCatData);
                setDetSubCategorias(detSubCatData);
            } catch (err) {
                setError('No se pudieron cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRefSubmit = async (formValues: CodigoReferenciaFormData) => {
        setIsSubmitting(true);
        const payload: CodigoReferenciaPayload = {
            ...formValues,
            descripcion: formValues.descripcion || null,
            id_sub_categoria: Number(formValues.id_sub_categoria),
        };

        try {
            if (editingCodigoReferencia) {
                const updated = await updateCodigoReferencia(editingCodigoReferencia.id_codigo_referencia, payload);
                setCodigosReferencia(current => current.map(c => c.id_codigo_referencia === updated.id_codigo_referencia ? updated : c));
                notifications.show({ title: 'Éxito', message: 'Código de referencia actualizado.', color: 'blue' });
            } else {
                const newData = await createCodigoReferencia(payload);
                setCodigosReferencia(current => [...current, newData]);
                notifications.show({ title: 'Éxito', message: 'Código de referencia creado.', color: 'green' });
            }
            closeRefModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el código.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTecSubmit = async (formValues: CodigoTecnicoFormData) => {
        if (!selectedCodigoReferencia) return;
        setIsSubmitting(true);

        const payload = {
            codigo: formValues.codigo,
            tipo: formValues.tipo,
        } as Omit<CodigoTecnicoPayload, 'id_codigo_referencia'>;

        try {
            let updatedRef: CodigoReferencia;
            if (editingCodigoTecnico) {
                await updateCodigoTecnico(selectedCodigoReferencia.id_codigo_referencia, editingCodigoTecnico.id_codigo_tecnico, payload);
                updatedRef = {
                    ...selectedCodigoReferencia,
                    codigos_tecnicos: selectedCodigoReferencia.codigos_tecnicos.map(ct => 
                        ct.id_codigo_tecnico === editingCodigoTecnico.id_codigo_tecnico ? { ...ct, ...payload } : ct
                    ),
                };
                notifications.show({ title: 'Éxito', message: 'Código técnico actualizado.', color: 'blue' });
            } else {
                const newTec = await createCodigoTecnico(selectedCodigoReferencia.id_codigo_referencia, payload);
                updatedRef = {
                    ...selectedCodigoReferencia,
                    codigos_tecnicos: [...selectedCodigoReferencia.codigos_tecnicos, newTec],
                };
                notifications.show({ title: 'Éxito', message: 'Código técnico añadido.', color: 'green' });
            }
            setCodigosReferencia(current => current.map(c => c.id_codigo_referencia === updatedRef.id_codigo_referencia ? updatedRef : c));
            setSelectedCodigoReferencia(updatedRef);
            closeTecModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el código técnico.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleTecDelete = (codigoTec: CodigoTecnico) => {
        if (!selectedCodigoReferencia) return;
        modals.openConfirmModal({
            title: 'Eliminar Código Técnico',
            children: <Text size="sm">¿Estás seguro de que quieres eliminar el código "{codigoTec.codigo}"?</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await deleteCodigoTecnico(selectedCodigoReferencia.id_codigo_referencia, codigoTec.id_codigo_tecnico);
                    const updatedRef = {
                        ...selectedCodigoReferencia,
                        codigos_tecnicos: selectedCodigoReferencia.codigos_tecnicos.filter(ct => ct.id_codigo_tecnico !== codigoTec.id_codigo_tecnico),
                    };
                    setCodigosReferencia(current => current.map(c => c.id_codigo_referencia === updatedRef.id_codigo_referencia ? updatedRef : c));
                    setSelectedCodigoReferencia(updatedRef);
                    notifications.show({ title: 'Éxito', message: 'Código técnico eliminado.', color: 'orange' });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo eliminar.'), color: 'red' });
                }
            },
        });
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;

    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Códigos de Referencia (Producto Padre)</Title>
                <Button onClick={() => { setEditingCodigoReferencia(null); openRefModal(); }} leftSection={<IconPlus size={14} />}>
                    Crear Código de Referencia
                </Button>
            </Group>
            
            <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md">
                        <CodigosReferenciaTable
                            records={codigosReferencia}
                            selectedRecordId={selectedCodigoReferencia?.id_codigo_referencia || null}
                            onRowClick={setSelectedCodigoReferencia}
                            onEdit={(record) => { setEditingCodigoReferencia(record); openRefModal(); }}
                            onDeactivate={() => { /* Lógica de desactivar aquí */ }}
                            onActivate={() => { /* Lógica de activar aquí */ }}
                        />
                    </Paper>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Códigos Técnicos para: {selectedCodigoReferencia ? `"${selectedCodigoReferencia.codigo}"` : '(Selecciona un código)'}</Title>
                            <Button onClick={() => { setEditingCodigoTecnico(null); openTecModal(); }} disabled={!selectedCodigoReferencia} leftSection={<IconPlus size={14} />}>
                                Añadir
                            </Button>
                        </Group>
                        <CodigosTecnicosTable
                            records={selectedCodigoReferencia?.codigos_tecnicos || []}
                            onEdit={(record) => { setEditingCodigoTecnico(record); openTecModal(); }}
                            onDelete={handleTecDelete}
                        />
                    </Paper>
                </Grid.Col>
            </Grid>

            {/* Modal para CodigoReferencia */}
            <Modal opened={refModalOpened} onClose={closeRefModal} title={editingCodigoReferencia ? 'Editar Código de Referencia' : 'Crear Código de Referencia'} centered>
                <CodigoReferenciaForm
                    onSubmit={handleRefSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingCodigoReferencia ? {
                        // Lógica de edición mejorada requerirá encontrar padres
                        ...editingCodigoReferencia,
                        descripcion: editingCodigoReferencia.descripcion || '',
                        id_sub_categoria: editingCodigoReferencia.id_sub_categoria.toString(),
                    } : null}
                    // Pasamos toda la data de categorización al formulario
                    divisiones={divisiones}
                    categorias={categorias}
                    subCategorias={subCategorias}
                    detSubCategorias={detSubCategorias}
                />
            </Modal>

            {/* Modal para CodigoTecnico */}
            <Modal opened={tecModalOpened} onClose={closeTecModal} title={editingCodigoTecnico ? 'Editar Código Técnico' : 'Añadir Código Técnico'} centered>
                <CodigoTecnicoForm
                    onSubmit={handleTecSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingCodigoTecnico}
                />
            </Modal>
        </Box>
    );
}