// frontend/src/features/codigos-referencia/pages/CodigoReferenciaDetailPage.tsx
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Button, Loader, Center, Alert, Text, Tabs, Title, Paper, Stack, Textarea, Select, Grid, Group, TextInput, Modal } from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconPencil, IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';

// --- Importaciones de Servicios y Tipos ---
import { getCodigoReferenciaById, updateCodigoReferencia, createCodigoTecnico, updateCodigoTecnico, deleteCodigoTecnico } from '../services/codigoReferenciaService';
import { getDivisiones } from '../../divisiones/services/divisionService';
import { getCategorias, getSubCategorias, getDetSubCategorias } from '../../categorizacion/services/categorizacionService';
import { getClasificacionesServicio } from '../../clasificaciones-servicio/services/clasificacionServicioService';
import { getClasificacionesEstadistica } from '../../clasificaciones-estadistica/services/clasificacionEstadisticaService';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import { CodigosTecnicosTable } from '../components/CodigosTecnicosTable';
import { CodigoTecnicoForm } from '../components/CodigoTecnicoForm';
import type { CodigoReferencia, CodigoReferenciaFormData, CodigoTecnico, CodigoTecnicoFormData, CodigoReferenciaPayload, CodigoTecnicoPayload } from '../types';
import type { Division, Categoria, SubCategoria, DetSubCategoria } from '../../categorizacion/types';
import type { ClasificacionServicio } from '../../clasificaciones-servicio/types';
import type { ClasificacionEstadistica } from '../../clasificaciones-estadistica/types';

export function CodigoReferenciaDetailPage() {
    const { refId } = useParams<{ refId: string }>();
    const [codigoRef, setCodigoRef] = useState<CodigoReferencia | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [supportData, setSupportData] = useState<{
        divisiones: Division[]; categorias: Categoria[]; subCategorias: SubCategoria[];
        detSubCategorias: DetSubCategoria[]; clasificacionesServicio: ClasificacionServicio[];
        clasificacionesEstadistica: ClasificacionEstadistica[];
    } | null>(null);
    
    const [editingCodigoTecnico, setEditingCodigoTecnico] = useState<CodigoTecnico | null>(null);
    const [tecModalOpened, { open: openTecModal, close: closeTecModal }] = useDisclosure(false);

    const form = useForm<CodigoReferenciaFormData>({
        initialValues: {
            codigo: '', descripcion: '', id_division: null, id_categoria: null,
            id_sub_categoria: null, id_det_sub_categoria: null,
            id_clasificacion_servicio: null, id_clasificacion_estadistica: null,
        },
        validate: {
            codigo: isNotEmpty('El código es requerido'),
            id_sub_categoria: isNotEmpty('Debe seleccionar una subcategoría'),
        },
    });

    const populateForm = (ref: CodigoReferencia, supData: NonNullable<typeof supportData>) => {
        const subCat = supData.subCategorias.find(sc => sc.id_sub_categoria === ref.id_sub_categoria);
        const cat = subCat ? supData.categorias.find(c => c.id_categoria === subCat.id_categoria) : undefined;
        const div = cat ? supData.divisiones.find(d => d.id_division === cat.id_division) : undefined;
        
        form.setValues({
            codigo: ref.codigo,
            descripcion: ref.descripcion || '',
            id_division: div?.id_division.toString() || null,
            id_categoria: cat?.id_categoria.toString() || null,
            id_sub_categoria: ref.id_sub_categoria.toString(),
            id_det_sub_categoria: ref.id_det_sub_categoria?.toString() || null,
            id_clasificacion_servicio: ref.id_clasificacion_servicio?.toString() || null,
            id_clasificacion_estadistica: ref.id_clasificacion_estadistica?.toString() || null,
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!refId) return;
            try {
                setLoading(true);
                const [refData, divData, catData, subCatData, detSubCatData, servData, estData] = await Promise.all([
                    getCodigoReferenciaById(Number(refId)),
                    getDivisiones(), getCategorias(), getSubCategorias(), getDetSubCategorias(),
                    getClasificacionesServicio(), getClasificacionesEstadistica()
                ]);
                setCodigoRef(refData);
                const supData = {
                    divisiones: divData, categorias: catData, subCategorias: subCatData,
                    detSubCategorias: detSubCatData, clasificacionesServicio: servData,
                    clasificacionesEstadistica: estData,
                };
                setSupportData(supData);
                populateForm(refData, supData);
            } catch (err) {
                setError("No se pudieron cargar los datos del código de referencia.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [refId]);
    
    const handleSubmit = async (formValues: CodigoReferenciaFormData) => {
        if (!codigoRef) return;
        setIsSubmitting(true);
        const payload: Partial<CodigoReferenciaPayload> = {
            codigo: formValues.codigo,
            descripcion: formValues.descripcion || null,
            id_sub_categoria: Number(formValues.id_sub_categoria),
            id_det_sub_categoria: formValues.id_det_sub_categoria ? Number(formValues.id_det_sub_categoria) : null,
            id_clasificacion_servicio: formValues.id_clasificacion_servicio ? Number(formValues.id_clasificacion_servicio) : null,
            id_clasificacion_estadistica: formValues.id_clasificacion_estadistica ? Number(formValues.id_clasificacion_estadistica) : null,
        };
        try {
            const updated = await updateCodigoReferencia(codigoRef.id_codigo_referencia, payload);
            setCodigoRef(updated);
            notifications.show({ title: 'Éxito', message: 'Información actualizada.', color: 'blue' });
            setIsEditing(false);
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo actualizar.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const divisionesOptions = useMemo(() => supportData?.divisiones.map(d => ({ value: d.id_division.toString(), label: d.nombre_division })) || [], [supportData]);
    const clasServicioOptions = useMemo(() => supportData?.clasificacionesServicio.map(c => ({ value: c.id.toString(), label: c.nombre })) || [], [supportData]);
    const clasEstadisticaOptions = useMemo(() => supportData?.clasificacionesEstadistica.map(c => ({ value: c.id.toString(), label: c.nombre })) || [], [supportData]);
    
    const categoriasOptions = useMemo(() => {
        if (!form.values.id_division || !supportData) return [];
        return supportData.categorias
            .filter(c => c.id_division === Number(form.values.id_division))
            .map(c => ({ value: c.id_categoria.toString(), label: c.nombre_categoria }));
    }, [form.values.id_division, supportData?.categorias]);

    const subCategoriasOptions = useMemo(() => {
        if (!form.values.id_categoria || !supportData) return [];
        return supportData.subCategorias
            .filter(sc => sc.id_categoria === Number(form.values.id_categoria))
            .map(sc => ({ value: sc.id_sub_categoria.toString(), label: sc.nombre_sub_categoria }));
    }, [form.values.id_categoria, supportData?.subCategorias]);

    const detSubCategoriasOptions = useMemo(() => {
        if (!form.values.id_sub_categoria || !supportData) return [];
        return supportData.detSubCategorias
            .filter(dsc => dsc.id_sub_categoria === Number(form.values.id_sub_categoria))
            .map(dsc => ({ value: dsc.id_det_sub_categoria.toString(), label: dsc.nombre_det_sub_categoria }));
    }, [form.values.id_sub_categoria, supportData?.detSubCategorias]);
    
    const handleTecSubmit = async (formValues: CodigoTecnicoFormData) => {
        if (!codigoRef) return;
        setIsSubmitting(true);
        const payload = {
            codigo: formValues.codigo,
            tipo: formValues.tipo,
        } as Omit<CodigoTecnicoPayload, 'id_codigo_referencia'>;
        try {
            if (editingCodigoTecnico) {
                const updatedTec = await updateCodigoTecnico(codigoRef.id_codigo_referencia, editingCodigoTecnico.id_codigo_tecnico, payload);
                setCodigoRef(prev => prev ? { ...prev, codigos_tecnicos: prev.codigos_tecnicos.map(ct => ct.id_codigo_tecnico === updatedTec.id_codigo_tecnico ? updatedTec : ct) } : null);
                notifications.show({ title: 'Éxito', message: 'Código técnico actualizado.', color: 'blue' });
            } else {
                const newTec = await createCodigoTecnico(codigoRef.id_codigo_referencia, payload);
                setCodigoRef(prev => prev ? { ...prev, codigos_tecnicos: [...prev.codigos_tecnicos, newTec] } : null);
                notifications.show({ title: 'Éxito', message: 'Código técnico añadido.', color: 'green' });
            }
            closeTecModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleTecDelete = (codigoTec: CodigoTecnico) => {
        if (!codigoRef) return;
        modals.openConfirmModal({
            title: 'Eliminar Código Técnico',
            children: <Text size="sm">¿Estás seguro de que quieres eliminar "{codigoTec.codigo}"?</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            onConfirm: async () => {
                await deleteCodigoTecnico(codigoRef.id_codigo_referencia, codigoTec.id_codigo_tecnico);
                setCodigoRef(prev => prev ? { ...prev, codigos_tecnicos: prev.codigos_tecnicos.filter(ct => ct.id_codigo_tecnico !== codigoTec.id_codigo_tecnico) } : null);
                notifications.show({ title: 'Éxito', message: 'Código técnico eliminado.', color: 'orange' });
            },
        });
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;
    if (!codigoRef || !supportData) return <Text>Datos no encontrados.</Text>;
    
    const findLabel = (id: string | null, options: {value: string, label: string}[]) => options.find(opt => opt.value === id)?.label || 'Sin Asignar';

    return (
        <Box>
            <Button component={Link} to="/codigos-referencia" variant="subtle" mb="md" leftSection={<IconArrowLeft size={14} />}>
                Volver a la lista
            </Button>
            
            <Paper withBorder p="md" radius="md" mb="xl">
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Group justify="space-between" align="center" mb="md">
                        <Title order={4}>Información General de {codigoRef.codigo}</Title>
                        {!isEditing && (
                            <Button onClick={() => setIsEditing(true)} leftSection={<IconPencil size={14} />}>
                                Editar
                            </Button>
                        )}
                    </Group>
                    
                    {isEditing ? (
                        <Stack>
                            <TextInput withAsterisk label="Código de Referencia" {...form.getInputProps('codigo')} />
                            <Textarea label="Descripción" {...form.getInputProps('descripcion')} />
                            <Select
                                withAsterisk label="División" data={divisionesOptions}
                                {...form.getInputProps('id_division')}
                                onChange={(value) => {
                                    form.setFieldValue('id_division', value);
                                    form.setFieldValue('id_categoria', null);
                                    form.setFieldValue('id_sub_categoria', null);
                                    form.setFieldValue('id_det_sub_categoria', null);
                                }}
                            />
                            <Select
                                withAsterisk label="Categoría" data={categoriasOptions}
                                disabled={!form.values.id_division || categoriasOptions.length === 0}
                                {...form.getInputProps('id_categoria')}
                                onChange={(value) => {
                                    form.setFieldValue('id_categoria', value);
                                    form.setFieldValue('id_sub_categoria', null);
                                    form.setFieldValue('id_det_sub_categoria', null);
                                }}
                            />
                            <Select
                                withAsterisk label="Subcategoría" data={subCategoriasOptions}
                                disabled={!form.values.id_categoria || subCategoriasOptions.length === 0}
                                {...form.getInputProps('id_sub_categoria')}
                                onChange={(value) => {
                                    form.setFieldValue('id_sub_categoria', value);
                                    form.setFieldValue('id_det_sub_categoria', null);
                                }}
                            />
                            {detSubCategoriasOptions.length > 0 && (
                                <Select
                                    label="Detalle Subcategoría (Opcional)" data={detSubCategoriasOptions}
                                    disabled={!form.values.id_sub_categoria} clearable
                                    {...form.getInputProps('id_det_sub_categoria')}
                                />
                            )}
                            <Select
                                label="Clasificación de Servicio" data={clasServicioOptions}
                                clearable searchable {...form.getInputProps('id_clasificacion_servicio')}
                            />
                            <Select
                                label="Clasificación Estadística" data={clasEstadisticaOptions}
                                clearable searchable {...form.getInputProps('id_clasificacion_estadistica')}
                            />
                            <Group justify="flex-end" mt="md">
                                <Button variant="default" onClick={() => {
                                    setIsEditing(false);
                                    populateForm(codigoRef, supportData);
                                }}>Cancelar</Button>
                                <Button type="submit" loading={isSubmitting} leftSection={<IconDeviceFloppy size={14}/>}>Guardar Cambios</Button>
                            </Group>
                        </Stack>
                    ) : (
                        <Grid>
                            <Grid.Col span={4}><Text fz="sm" fw={500}>Código:</Text><Text>{form.values.codigo}</Text></Grid.Col>
                            <Grid.Col span={8}><Text fz="sm" fw={500}>Descripción:</Text><Text>{form.values.descripcion || 'N/A'}</Text></Grid.Col>
                            <Grid.Col span={4}><Text fz="sm" fw={500}>División:</Text><Text>{findLabel(form.values.id_division, divisionesOptions)}</Text></Grid.Col>
                            <Grid.Col span={4}><Text fz="sm" fw={500}>Categoría:</Text><Text>{findLabel(form.values.id_categoria, categoriasOptions)}</Text></Grid.Col>
                            <Grid.Col span={4}><Text fz="sm" fw={500}>Subcategoría:</Text><Text>{findLabel(form.values.id_sub_categoria, subCategoriasOptions)}</Text></Grid.Col>
                            {form.values.id_det_sub_categoria && <Grid.Col span={4}><Text fz="sm" fw={500}>Detalle:</Text><Text>{findLabel(form.values.id_det_sub_categoria, detSubCategoriasOptions)}</Text></Grid.Col>}
                            <Grid.Col span={4}><Text fz="sm" fw={500}>Clasif. Servicio:</Text><Text>{findLabel(form.values.id_clasificacion_servicio, clasServicioOptions)}</Text></Grid.Col>
                            <Grid.Col span={4}><Text fz="sm" fw={500}>Clasif. Estadística:</Text><Text>{findLabel(form.values.id_clasificacion_estadistica, clasEstadisticaOptions)}</Text></Grid.Col>
                        </Grid>
                    )}
                </form>
            </Paper>

            <Tabs defaultValue="tecnicos">
                <Tabs.List>
                    <Tabs.Tab value="aplicaciones">Aplicaciones</Tabs.Tab>
                    <Tabs.Tab value="medidas">Medidas</Tabs.Tab>
                    <Tabs.Tab value="atributos">Atributos</Tabs.Tab>
                    <Tabs.Tab value="tecnicos">Códigos Técnicos</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="aplicaciones" pt="xs"><Text c="dimmed">Gestión de Aplicaciones (próximamente).</Text></Tabs.Panel>
                <Tabs.Panel value="medidas" pt="xs"><Text c="dimmed">Gestión de Medidas (próximamente).</Text></Tabs.Panel>
                <Tabs.Panel value="atributos" pt="xs"><Text c="dimmed">Gestión de Atributos (próximamente).</Text></Tabs.Panel>
                <Tabs.Panel value="tecnicos" pt="xs">
                    <Group justify="flex-end" mb="md">
                        <Button size="xs" leftSection={<IconPlus size={14}/>} onClick={() => { setEditingCodigoTecnico(null); openTecModal(); }}>
                            Añadir Código Técnico
                        </Button>
                    </Group>
                    <CodigosTecnicosTable 
                        records={codigoRef.codigos_tecnicos}
                        onEdit={(record) => { setEditingCodigoTecnico(record); openTecModal(); }}
                        onDelete={handleTecDelete}
                    />
                </Tabs.Panel>
            </Tabs>
            
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