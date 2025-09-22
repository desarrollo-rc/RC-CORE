import { useState, useEffect } from 'react';
import { Box, Title, Grid, Loader, Center, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCheck } from '@tabler/icons-react';

// Componentes
import { ColumnList, type ListItem } from '../components/ColumnList';
import { DivisionForm } from '../../divisiones/components/DivisionForm';
import { CategoriaForm } from '../components/CategoriaForm';
import { SubCategoriaForm } from '../components/SubCategoriaForm';
import { DetSubCategoriaForm } from '../components/DetSubCategoriaForm';

// Servicios
import { getDivisiones, createDivision, updateDivision, deactivateDivision, activateDivision } from '../../divisiones/services/divisionService';
import { getCategoriasPorDivision, createCategoria, updateCategoria, deactivateCategoria, activateCategoria, getSubCategoriasPorCategoria, createSubCategoria, updateSubCategoria, deactivateSubCategoria, activateSubCategoria, getDetallesPorSubCategoria, createDetSubCategoria, updateDetSubCategoria, deactivateDetSubCategoria, activateDetSubCategoria } from '../services/categorizacionService';

// Tipos
import type { Division, DivisionFormData } from '../../divisiones/types';
import type { Categoria, SubCategoria, DetSubCategoria, CategoriaFormData, SubCategoriaFormData, DetSubCategoriaFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';

export function CategorizacionPage() {
    const [divisiones, setDivisiones] = useState<Division[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [subCategorias, setSubCategorias] = useState<SubCategoria[]>([]);
    const [detalles, setDetalles] = useState<DetSubCategoria[]>([]);

    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
    const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);
    const [selectedSubCategoria, setSelectedSubCategoria] = useState<SubCategoria | null>(null);
    const [selectedDetSubCategoria, setSelectedDetSubCategoria] = useState<DetSubCategoria | null>(null);

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estado para el modal: qué se edita/crea
    const [modalContent, setModalContent] = useState<{ type: string, title: string, editingItem: any | null } | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

    useEffect(() => {
        getDivisiones().then(setDivisiones).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedDivision) {
            setLoading(true);
            getCategoriasPorDivision(selectedDivision.id_division).then(setCategorias).finally(() => setLoading(false));
        } else {
            setCategorias([]);
        }
        setSelectedCategoria(null);
    }, [selectedDivision]);

    useEffect(() => {
        if (selectedCategoria) {
            setLoading(true);
            getSubCategoriasPorCategoria(selectedCategoria.id_categoria).then(setSubCategorias).finally(() => setLoading(false));
        } else {
            setSubCategorias([]);
        }
        setSelectedSubCategoria(null);
    }, [selectedCategoria]);

    useEffect(() => {
        if (selectedSubCategoria) {
            setLoading(true);
            getDetallesPorSubCategoria(selectedSubCategoria.id_sub_categoria).then(setDetalles).finally(() => setLoading(false));
        } else {
            setDetalles([]);
        }
        setSelectedDetSubCategoria(null);
    }, [selectedSubCategoria]);

    const handleOpenModal = (type: string, title: string, editingItem: any | null = null) => {
        setModalContent({ type, title, editingItem });
        openModal();
    };
    
    const handleCloseModal = () => {
        closeModal();
        setModalContent(null);
    };

    const handleSubmit = async (values: any) => {
        setIsSubmitting(true);
        const { editingItem, type, title } = modalContent!;
        const isEditing = !!editingItem;

        try {
            let message = '';
            if (isEditing) {
                message = `${title.replace('Editar ', '')} actualizada.`;
                const entityId = editingItem.id;

                if (type === 'division') {
                    const updated = await updateDivision(entityId, values);
                    setDivisiones(current => current.map(d => d.id_division === updated.id_division ? updated : d));
                } else if (type === 'categoria') {
                    const updated = await updateCategoria(entityId, values);
                    setCategorias(current => current.map(c => c.id_categoria === updated.id_categoria ? updated : c));
                } else if (type === 'subcategoria') {
                    const updated = await updateSubCategoria(entityId, values);
                    setSubCategorias(current => current.map(s => s.id_sub_categoria === updated.id_sub_categoria ? updated : s));
                } else if (type === 'detalle') {
                    const updated = await updateDetSubCategoria(entityId, values);
                    setDetalles(current => current.map(d => d.id_det_sub_categoria === updated.id_det_sub_categoria ? updated : d));
                }
            } else {
                message = `${title.replace('Crear ', '')} creada.`;
                if (type === 'division') {
                     const nueva = await createDivision(values);
                     setDivisiones(current => [...current, nueva]);
                } else if (type === 'categoria' && selectedDivision) {
                    const payload = { ...values, id_division: selectedDivision.id_division };
                    const nueva = await createCategoria(payload);
                    setCategorias(current => [...current, nueva]);
                } else if (type === 'subcategoria' && selectedCategoria) {
                    const payload = { ...values, id_categoria: selectedCategoria.id_categoria };
                    const nueva = await createSubCategoria(payload);
                    setSubCategorias(current => [...current, nueva]);
                } else if (type === 'detalle' && selectedSubCategoria) {
                    const payload = { ...values, id_sub_categoria: selectedSubCategoria.id_sub_categoria };
                    const nueva = await createDetSubCategoria(payload);
                    setDetalles(current => [...current, nueva]);
                }
            }
            notifications.show({ title: 'Éxito', message, color: 'green', icon: <IconCheck /> });
            handleCloseModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'La operación falló.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeactivateDivision = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Desactivar División',
            children: `¿Estás seguro de que quieres desactivar la división "${item.nombre}"?`,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                await deactivateDivision(item.id);
                    setDivisiones(current => current.map(d => d.id_division === item.id ? { ...d, activo: false } : d));
                    notifications.show({ title: 'Éxito', message: 'División desactivada.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar la división.'), color: 'red' });
                }
            },
        });
    };

    const handleActivateDivision = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Activar División',
            children: `¿Estás seguro de que quieres activar la división "${item.nombre}"?`,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await activateDivision(item.id);
                    setDivisiones(current => current.map(d => d.id_division === item.id ? { ...d, activo: true } : d));
                    notifications.show({ title: 'Éxito', message: 'División activada.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar la división.'), color: 'red' });
                }
            },
        });
    };

    const handleActivateCategoria = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Activar Categoría',
            children: `¿Estás seguro de que quieres activar la categoría "${item.nombre}"?`,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await activateCategoria(item.id);
                    setCategorias(current => current.map(c => c.id_categoria === item.id ? { ...c, activo: true } : c));
                    notifications.show({ title: 'Éxito', message: 'Categoría activada.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar la categoría.'), color: 'red' });
                }
            },
        });
    };

    const handleDeactivateCategoria = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Desactivar Categoría',
            children: `¿Estás seguro de que quieres desactivar la categoría "${item.nombre}"?`,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                await deactivateCategoria(item.id);
                    setCategorias(current => current.map(c => c.id_categoria === item.id ? { ...c, activo: false } : c));
                    notifications.show({ title: 'Éxito', message: 'Categoría desactivada.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar la categoría.'), color: 'red' });
                }
            },
        });
    };

    const handleActivateSubCategoria = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Activar Subcategoría',
            children: `¿Estás seguro de que quieres activar la subcategoría "${item.nombre}"?`,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await activateSubCategoria(item.id);
                    setSubCategorias(current => current.map(s => s.id_sub_categoria === item.id ? { ...s, activo: true } : s));
                    notifications.show({ title: 'Éxito', message: 'Subcategoría activada.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar la subcategoría.'), color: 'red' });
                }
            },
        });
    };

    const handleDeactivateSubCategoria = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Desactivar Subcategoría',
            children: `¿Estás seguro de que quieres desactivar la subcategoría "${item.nombre}"?`,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await deactivateSubCategoria(item.id);
                    setSubCategorias(current => current.map(s => s.id_sub_categoria === item.id ? { ...s, activo: false } : s));
                    notifications.show({ title: 'Éxito', message: 'Subcategoría desactivada.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar la subcategoría.'), color: 'red' });
                }
            },
        });
    };

    const handleActivateDetSubCategoria = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Activar Detalle de Subcategoría',
            children: `¿Estás seguro de que quieres activar el detalle de subcategoría "${item.nombre}"?`,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await activateDetSubCategoria(item.id);
                    setDetalles(current => current.map(d => d.id_det_sub_categoria === item.id ? { ...d, activo: true } : d));
                    notifications.show({ title: 'Éxito', message: 'Detalle de subcategoría activada.', color: 'green', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo activar el detalle de subcategoría.'), color: 'red' });
                }
            },
        });
    };

    const handleDeactivateDetSubCategoria = (item: ListItem) => {
        modals.openConfirmModal({
            title: 'Desactivar Detalle de Subcategoría',
            children: `¿Estás seguro de que quieres desactivar el detalle de subcategoría "${item.nombre}"?`,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                try {
                    await deactivateDetSubCategoria(item.id);
                    setDetalles(current => current.map(d => d.id_det_sub_categoria === item.id ? { ...d, activo: false } : d));
                    notifications.show({ title: 'Éxito', message: 'Detalle de subcategoría desactivada.', color: 'orange', icon: <IconCheck /> });
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo desactivar el detalle de subcategoría.'), color: 'red' });
                }
            },
        });
    };



    if (loading && divisiones.length === 0) return <Center><Loader /></Center>;

    return (
        <Box>
            <Title order={2} mb="xl">Gestión de Categorización de Productos</Title>
            <Grid>
            <Grid.Col span={3}>
                    <ColumnList
                        title="Divisiones"
                        items={divisiones.map(d => ({ id: d.id_division, nombre: d.nombre_division, codigo: d.codigo_division, activo: d.activo }))}
                        selectedId={selectedDivision?.id_division || null}
                        onSelect={(item) => setSelectedDivision(divisiones.find(d => d.id_division === item.id) || null)}
                        onAdd={() => handleOpenModal('division', 'Crear División')}
                        onEdit={(item) => handleOpenModal('division', 'Editar División', item)}
                        onDeactivate={handleDeactivateDivision}
                        onActivate={handleActivateDivision}
                    />
                </Grid.Col>
                
                <Grid.Col span={3}>
                    <ColumnList
                        title="Categorías"
                        items={categorias.map(c => ({ id: c.id_categoria, nombre: c.nombre_categoria, codigo: c.codigo_categoria, activo: c.activo }))}
                        selectedId={selectedCategoria?.id_categoria || null}
                        onSelect={(item) => setSelectedCategoria(categorias.find(c => c.id_categoria === item.id) || null)}
                        onAdd={() => handleOpenModal('categoria', 'Crear Categoría')}
                        onEdit={(item) => handleOpenModal('categoria', 'Editar Categoría', item)}
                        onDeactivate={handleDeactivateCategoria}
                        onActivate={handleActivateCategoria}
                        disabled={!selectedDivision || loading}
                    />
                </Grid.Col>

                <Grid.Col span={3}> 
                    <ColumnList
                        title="Subcategorías"
                        items={subCategorias.map(s => ({ id: s.id_sub_categoria, nombre: s.nombre_sub_categoria, codigo: s.codigo_sub_categoria, activo: s.activo }))}
                        selectedId={selectedSubCategoria?.id_sub_categoria || null}
                        onSelect={(item) => setSelectedSubCategoria(subCategorias.find(s => s.id_sub_categoria === item.id) || null)}
                        onAdd={() => handleOpenModal('subcategoria', 'Crear Subcategoría')}
                        onEdit={(item) => handleOpenModal('subcategoria', 'Editar Subcategoría', item)}
                        onDeactivate={handleDeactivateSubCategoria}
                        onActivate={handleActivateSubCategoria}
                        disabled={!selectedCategoria || loading}
                    />
                </Grid.Col>
                
                <Grid.Col span={3}> 
                    <ColumnList
                        title="Detalles"
                        items={detalles.map(d => ({ id: d.id_det_sub_categoria, nombre: d.nombre_det_sub_categoria, codigo: d.codigo_det_sub_categoria, activo: d.activo }))}
                        selectedId={selectedDetSubCategoria?.id_det_sub_categoria || null}
                        onSelect={(item) => setSelectedDetSubCategoria(detalles.find(d => d.id_det_sub_categoria === item.id) || null)}
                        onAdd={() => handleOpenModal('detalle', 'Crear Detalle')}
                        onEdit={(item) => handleOpenModal('detalle', 'Editar Detalle', item)}
                        onDeactivate={handleDeactivateDetSubCategoria}
                        onActivate={handleActivateDetSubCategoria}
                        disabled={!selectedSubCategoria || loading}
                    />
                </Grid.Col>
            </Grid>

            <Modal opened={modalOpened} onClose={handleCloseModal} title={modalContent?.title} centered>
                {modalContent?.type === 'division' && <DivisionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
                {modalContent?.type === 'categoria' && <CategoriaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
                {modalContent?.type === 'subcategoria' && <SubCategoriaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
                {modalContent?.type === 'detalle' && <DetSubCategoriaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
            </Modal>
        </Box>
    );
}