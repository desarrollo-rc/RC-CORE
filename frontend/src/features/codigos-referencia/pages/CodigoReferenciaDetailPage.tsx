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
import { getCodigoReferenciaById, updateCodigoReferencia, createCodigoTecnico, updateCodigoTecnico, deleteCodigoTecnico, asociarProductoACodigoTecnico } from '../services/codigoReferenciaService';
import { getProductoBySku, createProducto } from '../../productos/services/productoService';
import { getProveedores } from '../../proveedores/services/proveedorService';
import { ProductoForm } from '../../productos/components/ProductoForm';
import { addMedidaAsignada, updateMedidaAsignada, deleteMedidaAsignada } from '../services/medidaAsignadaService';
import { addAtributoAsignado, updateAtributoAsignado, deleteAtributoAsignado } from '../services/atributoAsignadoService';
import { getDivisiones } from '../../divisiones/services/divisionService';
import { getCategorias, getSubCategorias, getDetSubCategorias } from '../../categorizacion/services/categorizacionService';
import { getClasificacionesServicio } from '../../clasificaciones-servicio/services/clasificacionServicioService';
import { getClasificacionesEstadistica } from '../../clasificaciones-estadistica/services/clasificacionEstadisticaService';
import { getMedidas } from '../../medidas/services/medidaService';
import { getAtributos } from '../../atributos/services/atributoService';
import { getApiErrorMessage } from '../../../utils/errorHandler';

import { CodigosTecnicosTable } from '../components/CodigosTecnicosTable';
import { CodigoTecnicoForm } from '../components/CodigoTecnicoForm';
import { MedidasAsignadasTable } from '../components/MedidasAsignadasTable';
import { MedidaAsignadaForm } from '../components/MedidaAsignadaForm';
import { AtributosAsignadosTable } from '../components/AtributosAsignadosTable';
import { AtributoAsignadoForm } from '../components/AtributoAsignadoForm';
import { AplicacionesTable } from '../components/AplicacionesTable';
import { AplicacionForm } from '../components/AplicacionForm';

import type { CodigoReferencia, CodigoReferenciaFormData, CodigoTecnico, CodigoTecnicoFormData, CodigoReferenciaPayload, CodigoTecnicoPayload, MedidaAsignada, MedidaAsignadaFormData, AtributoAsignado, AtributoAsignadoFormData, Aplicacion } from '../types';
import type { Division, Categoria, SubCategoria, DetSubCategoria } from '../../categorizacion/types';
import type { ClasificacionServicio } from '../../clasificaciones-servicio/types';
import type { ClasificacionEstadistica } from '../../clasificaciones-estadistica/types';
import type { Medida } from '../../medidas/types';
import type { Atributo } from '../../atributos/types';
import type { MarcaVehiculo, Modelo, VersionVehiculo } from '../../vehiculos/types';
import { getAllVersiones, getMarcasVehiculos, getModelosPorMarca } from '../../vehiculos/services/vehiculoService';
import { addAplicacion, deleteAplicacion } from '../services/codigoReferenciaService';
import type { Producto, ProductoPayload, ProductoFormData } from '../../productos/types';
import { getFabricas } from '../../fabricas/services/fabricaService';
import { getMarcas } from '../../marcas/services/marcaService';
import { getCalidades } from '../../calidades/services/calidadService';
import { getOrigenes } from '../../origenes/services/origenService';

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
        availableMedidas: Medida[];
        availableAtributos: Atributo[];
    } | null>(null);

    const [editingCodigoTecnico, setEditingCodigoTecnico] = useState<CodigoTecnico | null>(null);
    const [tecModalOpened, { open: openTecModal, close: closeTecModal }] = useDisclosure(false);

    const [editingMedidaAsignada, setEditingMedidaAsignada] = useState<MedidaAsignada | null>(null);
    const [medidaModalOpened, { open: openMedidaModal, close: closeMedidaModal }] = useDisclosure(false);

    const [editingAtributoAsignado, setEditingAtributoAsignado] = useState<AtributoAsignado | null>(null);
    const [atributoModalOpened, { open: openAtributoModal, close: closeAtributoModal }] = useDisclosure(false);

    // Estado soporte para Aplicaciones
    const [vehMarcas, setVehMarcas] = useState<MarcaVehiculo[]>([]);
    const [vehModelos, setVehModelos] = useState<Modelo[]>([]);
    const [vehVersiones, setVehVersiones] = useState<VersionVehiculo[]>([]);
    const [aplicacionModalOpened, { open: openAplicacionModal, close: closeAplicacionModal }] = useDisclosure(false);

    const [productoModalOpened, { open: openProductoModal, close: closeProductoModal }] = useDisclosure(false);
    const [asociarModalOpened, { open: openAsociarModal, close: closeAsociarModal }] = useDisclosure(false);
    const [selectedCodigoTecnico, setSelectedCodigoTecnico] = useState<CodigoTecnico | null>(null);
    const [productoEncontrado, setProductoEncontrado] = useState<Producto | null>(null);
    const [buscandoProducto, setBuscandoProducto] = useState(false);

    const [maestros, setMaestros] = useState<any>(null);

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
                const [
                    refData, divData, catData, subCatData, detSubCatData,
                    servData, estData, medData, atrData,
                    vMarcas, vVersiones, proveedoresData,
                    marcasData, calidadesData, origenesData, fabricasData // <--- Renombrar aquí
                ] = await Promise.all([
                    getCodigoReferenciaById(Number(refId)),
                    getDivisiones(), getCategorias(), getSubCategorias(), getDetSubCategorias(),
                    getClasificacionesServicio(), getClasificacionesEstadistica(), getMedidas(), getAtributos(),
                    getMarcasVehiculos(), getAllVersiones(),
                    getProveedores(),
                    getMarcas(), getCalidades(), getOrigenes(), getFabricas()
                ]);

                setCodigoRef(refData);
                const supData = {
                    divisiones: divData, categorias: catData, subCategorias: subCatData,
                    detSubCategorias: detSubCatData, clasificacionesServicio: servData,
                    clasificacionesEstadistica: estData, availableMedidas: medData, availableAtributos: atrData,
                    marcas: marcasData, calidades: calidadesData, origenes: origenesData, fabricas: fabricasData
                };
                setSupportData(supData);
                setMaestros({
                    codigosRef: [refData],
                    marcas: marcasData,
                    calidades: calidadesData,
                    origenes: origenesData,
                    fabricas: fabricasData,
                    proveedores: proveedoresData
                })
                populateForm(refData, supData);
                setVehMarcas(vMarcas);
                setVehVersiones(vVersiones);
                // cargar todos los modelos de todas las marcas
                const modelosLists = await Promise.all(vMarcas.map(m => getModelosPorMarca(m.id_marca).catch(() => [])));
                setVehModelos(modelosLists.flat());

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

    const handleMedidaSubmit = async (formValues: MedidaAsignadaFormData) => {
        if (!codigoRef || !formValues.id_medida) return;
        setIsSubmitting(true);
        const payload = {
            id_medida: Number(formValues.id_medida),
            valor: Number(formValues.valor),
        };
        try {
            let updatedRef: CodigoReferencia;
            if (editingMedidaAsignada) {
                const updated = await updateMedidaAsignada(codigoRef.id_codigo_referencia, editingMedidaAsignada.id_medida, payload);
                updatedRef = { ...codigoRef, medidas_asignadas: codigoRef.medidas_asignadas.map(m => m.id_medida === updated.id_medida ? updated : m) };
                notifications.show({ title: 'Éxito', message: 'Medida actualizada.', color: 'blue' });
            } else {
                const newData = await addMedidaAsignada(codigoRef.id_codigo_referencia, payload);
                updatedRef = { ...codigoRef, medidas_asignadas: [...codigoRef.medidas_asignadas, newData] };
                notifications.show({ title: 'Éxito', message: 'Medida asignada.', color: 'green' });
            }
            setCodigoRef(updatedRef);
            closeMedidaModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar la medida.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAtributoSubmit = async (formValues: AtributoAsignadoFormData) => {
        if (!codigoRef || !formValues.id_atributo || !formValues.id_valor) return;
        setIsSubmitting(true);
        const payload = {
            id_atributo: Number(formValues.id_atributo),
            id_valor: Number(formValues.id_valor),
        };
        try {
            let updatedRef: CodigoReferencia;
            if (editingAtributoAsignado) {
                const updated = await updateAtributoAsignado(codigoRef.id_codigo_referencia, editingAtributoAsignado.id_atributo, payload);
                updatedRef = { ...codigoRef, atributos_asignados: codigoRef.atributos_asignados.map(a => a.id_atributo === updated.id_atributo ? updated : a) };
                notifications.show({ title: 'Éxito', message: 'Atributo actualizado.', color: 'blue' });
            } else {
                const newData = await addAtributoAsignado(codigoRef.id_codigo_referencia, payload);
                updatedRef = { ...codigoRef, atributos_asignados: [...codigoRef.atributos_asignados, newData] };
                notifications.show({ title: 'Éxito', message: 'Atributo asignado.', color: 'green' });
            }
            setCodigoRef(updatedRef);
            closeAtributoModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el atributo.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMedidaDelete = (medidaAsignada: MedidaAsignada) => {
        if (!codigoRef) return;
        modals.openConfirmModal({
            title: 'Eliminar Medida Asignada',
            children: <Text size="sm">¿Eliminar la medida "{medidaAsignada.medida.nombre}"?</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            onConfirm: async () => {
                await deleteMedidaAsignada(codigoRef.id_codigo_referencia, medidaAsignada.medida.id_medida);
                const updatedRef = {
                    ...codigoRef,
                    medidas_asignadas: codigoRef.medidas_asignadas.filter(m => m.medida.id_medida !== medidaAsignada.medida.id_medida),
                };
                setCodigoRef(updatedRef);
                notifications.show({ title: 'Éxito', message: 'Medida eliminada.', color: 'orange' });
            },
        });
    };

    const handleAtributoDelete = (atributoAsignado: AtributoAsignado) => {
        if (!codigoRef) return;
        modals.openConfirmModal({
            title: 'Eliminar Atributo Asignado',
            children: <Text size="sm">¿Eliminar el atributo "{atributoAsignado.atributo.nombre}"?</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            onConfirm: async () => {
                await deleteAtributoAsignado(codigoRef.id_codigo_referencia, atributoAsignado.id_atributo);
                setCodigoRef(prev => prev ? { ...prev, atributos_asignados: prev.atributos_asignados.filter(a => a.id_atributo !== atributoAsignado.id_atributo) } : null);
                notifications.show({ title: 'Éxito', message: 'Atributo eliminado.', color: 'orange' });
            },
        });
    };

    const handleOpenAsociarModal = async (codigoTecnico: CodigoTecnico) => {
        setSelectedCodigoTecnico(codigoTecnico);
        setBuscandoProducto(true);
        openAsociarModal();
        try {
            const producto = await getProductoBySku(codigoTecnico.codigo);
            setProductoEncontrado(producto);
        } catch (error) {
            setProductoEncontrado(null);
        } finally {
            setBuscandoProducto(false);
        }
    };

    const handleConfirmarAsociacion = async () => {
        if (!selectedCodigoTecnico || !productoEncontrado || !refId) return;
        setIsSubmitting(true);
        try {
            await asociarProductoACodigoTecnico(Number(refId), selectedCodigoTecnico.id_codigo_tecnico, productoEncontrado.id_producto);
            const updatedRef = await getCodigoReferenciaById(Number(refId));
            setCodigoRef(updatedRef);
            notifications.show({ title: 'Éxito', message: 'Producto asociado.' });
            closeAsociarModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo asociar.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCrearProductoDesdeModal = () => {
        closeAsociarModal(); // Cierra el modal de asociación
        openProductoModal();  // Abre el modal de creación de producto
    };

    const handleProductoSubmit = async (formValues: ProductoFormData) => {
        if (!selectedCodigoTecnico || !refId) return;
        setIsSubmitting(true);
        const payload: ProductoPayload = {
            sku: formValues.sku,
            nombre_producto: formValues.nombre_producto,
            id_codigo_referencia: Number(formValues.id_codigo_referencia),
            id_marca: Number(formValues.id_marca),
            id_calidad: Number(formValues.id_calidad),
            id_origen: Number(formValues.id_origen),
            id_fabrica: formValues.id_fabrica ? Number(formValues.id_fabrica) : null,
            costo_base: Number(formValues.costo_base),
            es_kit: formValues.es_kit,
            proveedores: formValues.proveedores.map(p => ({
                id_proveedor: Number(p.id_proveedor),
                costo_proveedor: Number(p.costo_proveedor),
                codigo_producto_proveedor: p.codigo_producto_proveedor,
                es_proveedor_principal: p.es_proveedor_principal
            })),
        };
        try {
            const nuevoProducto = await createProducto(payload);
            notifications.show({ title: 'Éxito', message: `Producto ${nuevoProducto.sku} creado.` });
            await asociarProductoACodigoTecnico(Number(refId), selectedCodigoTecnico.id_codigo_tecnico, nuevoProducto.id_producto);
            notifications.show({ title: 'Éxito', message: `SKU asociado.` });
            const updatedRef = await getCodigoReferenciaById(Number(refId));
            setCodigoRef(updatedRef);
            closeProductoModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo crear o asociar el producto.'), color: 'red' });
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

    // --- Aplicaciones ---
    const handleAplicacionSubmit = async (payload: { id_version: number }) => {
        if (!codigoRef) return;
        setIsSubmitting(true);
        try {
            const nueva = await addAplicacion(codigoRef.id_codigo_referencia, { id_version: payload.id_version });
            setCodigoRef(prev => prev ? { ...prev, aplicaciones: [...(prev.aplicaciones || []), nueva] } : prev);
            notifications.show({ title: 'Éxito', message: 'Aplicación asociada.', color: 'green' });
            closeAplicacionModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo asociar.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAplicacionDelete = (ap: Aplicacion) => {
        if (!codigoRef) return;
        const idVersion = ap.id_version ?? ap.version?.id_version ?? ap.version_vehiculo?.id_version;
        if (!idVersion) {
            notifications.show({ title: 'Error', message: 'No se pudo identificar la versión a eliminar.', color: 'red' });
            return;
        }
        modals.openConfirmModal({
            title: 'Eliminar Aplicación',
            children: <Text size="sm">¿Eliminar la aplicación seleccionada?</Text>,
            labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
            onConfirm: async () => {
                await deleteAplicacion(codigoRef.id_codigo_referencia, idVersion);
                setCodigoRef(prev => prev ? { ...prev, aplicaciones: (prev.aplicaciones || []).filter(a => (a.id_version ?? a.version?.id_version ?? a.version_vehiculo?.id_version) !== idVersion) } : prev);
                notifications.show({ title: 'Éxito', message: 'Aplicación eliminada.', color: 'orange' });
            },
        });
    };

    if (loading) return <Center h={400}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;
    if (!codigoRef || !supportData || !maestros) return <Text>Datos no encontrados.</Text>;

    const findLabel = (id: string | null, options: { value: string, label: string }[]) => options.find(opt => opt.value === id)?.label || 'Sin Asignar';

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
                                <Button type="submit" loading={isSubmitting} leftSection={<IconDeviceFloppy size={14} />}>Guardar Cambios</Button>
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

            <Tabs defaultValue="aplicaciones">
                <Tabs.List>
                    <Tabs.Tab value="aplicaciones">Aplicaciones</Tabs.Tab>
                    <Tabs.Tab value="medidas">Medidas</Tabs.Tab>
                    <Tabs.Tab value="atributos">Atributos</Tabs.Tab>
                    <Tabs.Tab value="tecnicos">Códigos Técnicos</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="aplicaciones" pt="xs">
                    <AplicacionesTable
                        records={codigoRef.aplicaciones || []}
                        onAdd={openAplicacionModal}
                        onDelete={handleAplicacionDelete}
                    />
                </Tabs.Panel>
                <Tabs.Panel value="medidas" pt="xs">
                    <Group justify="flex-end" mb="md">
                        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setEditingMedidaAsignada(null); openMedidaModal(); }}>
                            Asignar Medida
                        </Button>
                    </Group>
                    <MedidasAsignadasTable
                        records={codigoRef.medidas_asignadas || []}
                        onEdit={(record) => { setEditingMedidaAsignada(record); openMedidaModal(); }}
                        onDelete={handleMedidaDelete}
                    />
                </Tabs.Panel>
                <Tabs.Panel value="atributos" pt="xs">
                    <Group justify="flex-end" mb="md">
                        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setEditingAtributoAsignado(null); openAtributoModal(); }}>
                            Asignar Atributo
                        </Button>
                    </Group>
                    <AtributosAsignadosTable
                        records={codigoRef.atributos_asignados || []}
                        onEdit={(record) => { setEditingAtributoAsignado(record); openAtributoModal(); }}
                        onDelete={handleAtributoDelete}
                    />
                </Tabs.Panel>
                <Tabs.Panel value="tecnicos" pt="xs">
                    <Group justify="flex-end" mb="md">
                        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => { setEditingCodigoTecnico(null); openTecModal(); }}>
                            Añadir Código Técnico
                        </Button>
                    </Group>
                    <CodigosTecnicosTable
                        records={codigoRef.codigos_tecnicos || []}
                        onEdit={(record) => { setEditingCodigoTecnico(record); openTecModal(); }}
                        onDelete={handleTecDelete}
                        onAsociarProducto={handleOpenAsociarModal}
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

            <Modal opened={aplicacionModalOpened} onClose={closeAplicacionModal} title={'Asociar Vehículo'} centered>
                <AplicacionForm
                    marcas={vehMarcas}
                    modelos={vehModelos}
                    versiones={vehVersiones}
                    onSubmit={handleAplicacionSubmit}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <Modal opened={medidaModalOpened} onClose={closeMedidaModal} title={editingMedidaAsignada ? 'Editar Valor de Medida' : 'Asignar Nueva Medida'} centered>
                <MedidaAsignadaForm
                    onSubmit={handleMedidaSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingMedidaAsignada ? { id_medida: editingMedidaAsignada.id_medida.toString(), valor: editingMedidaAsignada.valor } : null}
                    availableMedidas={editingMedidaAsignada
                        ? supportData.availableMedidas
                        : supportData.availableMedidas.filter(m => !(codigoRef.medidas_asignadas || []).some(ma => ma.id_medida === m.id_medida))
                    }
                />
            </Modal>

            <Modal opened={atributoModalOpened} onClose={closeAtributoModal} title={editingAtributoAsignado ? 'Editar Valor de Atributo' : 'Asignar Nuevo Atributo'} centered>
                <AtributoAsignadoForm
                    onSubmit={handleAtributoSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={editingAtributoAsignado ? { id_atributo: editingAtributoAsignado.id_atributo.toString(), id_valor: editingAtributoAsignado.id_valor.toString() } : null}
                    availableAtributos={editingAtributoAsignado
                        ? supportData.availableAtributos
                        : supportData.availableAtributos.filter(a => !(codigoRef.atributos_asignados || []).some(aa => aa.id_atributo === a.id_atributo))
                    }
                />
            </Modal>
            <Modal opened={asociarModalOpened} onClose={closeAsociarModal} title={`Asociar SKU: ${selectedCodigoTecnico?.codigo}`} centered>
                {buscandoProducto ? (
                    <Center><Loader /></Center>
                ) : productoEncontrado ? (
                    <Stack>
                        <Text>Se encontró un producto con este SKU:</Text>
                        <Paper withBorder p="xs">
                            <Text fw={700}>{productoEncontrado.sku}</Text>
                            <Text size="sm">{productoEncontrado.nombre_producto}</Text>
                        </Paper>
                        <Button onClick={handleConfirmarAsociacion} loading={isSubmitting}>
                            Confirmar Asociación
                        </Button>
                    </Stack>
                ) : (
                    <Stack>
                        <Text>No se encontró un producto existente con el SKU "{selectedCodigoTecnico?.codigo}".</Text>
                        <Button onClick={handleCrearProductoDesdeModal} color="green">
                            Crear Nuevo Producto
                        </Button>
                    </Stack>
                )}
            </Modal>
            <Modal opened={productoModalOpened} onClose={closeProductoModal} title="Crear Nuevo Producto (SKU)" size="xl" centered>
                <ProductoForm
                    onSubmit={handleProductoSubmit}
                    isSubmitting={isSubmitting}
                    initialValues={{
                        sku: selectedCodigoTecnico?.codigo || '',
                        id_codigo_referencia: codigoRef?.id_codigo_referencia.toString() || null,
                    }}
                    {...maestros}
                />
            </Modal>
        </Box>
    );
}