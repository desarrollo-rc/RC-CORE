// frontend/src/features/vehiculos/pages/VehiculosPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { Box, Title, Grid, Loader, Center, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconCheck } from '@tabler/icons-react';

// Reutilizamos el componente de lista en columnas
import { ColumnList } from '../../categorizacion/components/ColumnList';
import { getApiErrorMessage } from '../../../utils/errorHandler';

// Servicios y Formularios
import { VehiculosTable } from '../components/VehiculosTable';
import { getAllVersiones, getMarcasVehiculos, createModelo, updateModelo, createVersion, updateVersion, deactivateVersion, activateVersion, getModelosPorMarca } from '../services/vehiculoService';
import { createMarca, updateMarca, deactivateMarca, activateMarca } from '../../marcas/services/marcaService';
import { ModeloForm } from '../components/ModeloForm';
import { VersionForm } from '../components/VersionForm';
import { MarcaForm } from '../components/MarcaForm';

// --- TIPOS ---
import type { MarcaVehiculo, Modelo, VersionVehiculo } from '../types';
import type { MarcaPayload } from '../../marcas/types';

export function VehiculosPage() {
    const [allVersiones, setAllVersiones] = useState<VersionVehiculo[]>([]);
    const [marcas, setMarcas] = useState<MarcaVehiculo[]>([]);
    const [selectedMarca, setSelectedMarca] = useState<MarcaVehiculo | null>(null);
    const [selectedModelo, setSelectedModelo] = useState<Modelo | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<VersionVehiculo | null>(null);
    const [allModelos, setAllModelos] = useState<Modelo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalContent, setModalContent] = useState<{ type: string, title: string, editingItem: any | null } | null>(null);
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

    const fetchData = () => {
        setLoading(true);
        Promise.all([ getMarcasVehiculos(), getAllVersiones() ])
            .then(async ([marcasData, versionesData]) => {
                setMarcas(marcasData);
                setAllVersiones(versionesData);
                // Cargar todos los modelos para poder listar sin filtro de marca
                const modelosLists = await Promise.all(marcasData.map(m => getModelosPorMarca(m.id_marca).catch(() => [])));
                const modelos = modelosLists.flat();
                setAllModelos(modelos);
            }).catch(() => {
                notifications.show({ title: 'Error', message: 'No se pudieron cargar los datos.', color: 'red' });
            }).finally(() => { setLoading(false); });
    };

    useEffect(() => { fetchData(); }, []);

    // --- LÓGICA DE FILTRADO DERIVADA DEL ESTADO ---
    const modelosFiltrados = useMemo(() => {
        const modelosBase = allModelos;
        const modelosDeMarca = selectedMarca
            ? modelosBase.filter(m => (m.id_marca === selectedMarca.id_marca) || (m.marca?.id_marca === selectedMarca.id_marca))
            : modelosBase;
        return Array.from(new Map(modelosDeMarca.map(m => [m.id_modelo, m])).values())
            .sort((a, b) => a.nombre_modelo.localeCompare(b.nombre_modelo));
    }, [selectedMarca, allModelos]);

    const versionesFiltradas = useMemo(() => {
        if (!selectedModelo && !selectedMarca) return allVersiones;
        if (!selectedModelo && selectedMarca) {
            const modelosMarcaIds = new Set(
                allModelos
                    .filter(m => (m.id_marca === selectedMarca.id_marca) || (m.marca?.id_marca === selectedMarca.id_marca))
                    .map(m => m.id_modelo)
            );
            return allVersiones.filter(v => modelosMarcaIds.has(v.id_modelo));
        }
        if (selectedModelo) return allVersiones.filter(v => v.id_modelo === selectedModelo.id_modelo);
        return allVersiones;
    }, [selectedModelo, selectedMarca, allVersiones, allModelos]);

    const tablaVersiones = useMemo(() => {
        if (!selectedMarca) return versionesFiltradas;
        if (!selectedModelo) {
            const modelosMarcaIds = new Set(
                allModelos
                    .filter(m => (m.id_marca === selectedMarca.id_marca) || (m.marca?.id_marca === selectedMarca.id_marca))
                    .map(m => m.id_modelo)
            );
            return versionesFiltradas.filter(v => modelosMarcaIds.has(v.id_modelo));
        }
        return versionesFiltradas;
    }, [selectedMarca, selectedModelo, versionesFiltradas, allModelos]);

    // --- MANEJADORES DE EVENTOS ---
    const handleSelectMarca = (marca: MarcaVehiculo | null) => {
        setSelectedMarca(current => (current?.id_marca === marca?.id_marca ? null : marca));
        setSelectedModelo(null);
        setSelectedVersion(null);
    };

    const handleSelectModelo = (modelo: Modelo | null) => {
        setSelectedModelo(current => (current?.id_modelo === modelo?.id_modelo ? null : modelo));
        setSelectedVersion(null);
    };

    const handleOpenModal = (type: string, title: string, editingItem: any | null = null) => {
        setModalContent({ type, title, editingItem });
        openModal();
    };

    const handleCloseModal = () => {
        closeModal();
        setModalContent(null);
    };

    const handleSubmit = async (values: any) => {
        if (!modalContent) return;
        setIsSubmitting(true);
        const { type, editingItem } = modalContent;
        try {
            if (type === 'marca') {
                const payload: Partial<MarcaPayload> = { ...values };
                if (editingItem) {
                    await updateMarca(editingItem.id_marca, payload);
                } else {
                    await createMarca(payload as MarcaPayload);
                }
            } else if (type === 'modelo' && selectedMarca) {
                if (editingItem) {
                    await updateModelo(selectedMarca.id_marca, editingItem.id_modelo, values);
                } else {
                    await createModelo(selectedMarca.id_marca, values);
                }
            } else if (type === 'version' && selectedMarca && selectedModelo) {
                if (editingItem) {
                    await updateVersion(selectedMarca.id_marca, selectedModelo.id_modelo, editingItem.id_version, values);
                } else {
                    await createVersion(selectedMarca.id_marca, selectedModelo.id_modelo, values);
                }
            }
            notifications.show({ title: 'Éxito', message: 'Operación exitosa.', color: 'green', icon: <IconCheck /> });
            handleCloseModal();
            fetchData(); // Recarga todos los datos para asegurar la consistencia
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'La operación falló.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleMarcaActiva = (marca: { id: number; nombre: string; activo: boolean }) => {
        const action = marca.activo ? 'Desactivar' : 'Activar';
        modals.openConfirmModal({
            title: `${action} Marca`,
            children: `¿Estás seguro de que quieres ${action.toLowerCase()} la marca "${marca.nombre}"?`,
            labels: { confirm: action, cancel: 'Cancelar' },
            confirmProps: { color: marca.activo ? 'red' : 'green' },
            onConfirm: async () => {
                try {
                    const actionService = marca.activo ? deactivateMarca : activateMarca;
                    await actionService(marca.id);
                    notifications.show({ title: 'Éxito', message: `Marca ${action.toLowerCase()}da.`, color: 'green' });
                    fetchData();
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, `No se pudo ${action.toLowerCase()} la marca.`), color: 'red' });
                }
            },
        });
    };

    const handleToggleVersionActiva = (version: VersionVehiculo) => {
        const action = version.activo ? 'Desactivar' : 'Activar';
        modals.openConfirmModal({
            title: `${action} Versión`,
            children: `¿Estás seguro de que quieres ${action.toLowerCase()} la versión "${version.nombre_version}"?`,
            labels: { confirm: action, cancel: 'Cancelar' },
            confirmProps: { color: version.activo ? 'red' : 'green' },
            onConfirm: async () => {
                try {
                    const actionService = version.activo ? deactivateVersion : activateVersion;
                    const marcaId = version.modelo?.id_marca ?? version.modelo?.marca?.id_marca;
                    if (marcaId == null) throw new Error('Marca no definida en versión');
                    await actionService(marcaId, version.id_modelo, version.id_version);
                    notifications.show({ title: 'Éxito', message: `Versión ${action.toLowerCase()}da.`, color: 'green' });
                    fetchData();
                } catch (error) {
                    notifications.show({ title: 'Error', message: getApiErrorMessage(error, `No se pudo ${action.toLowerCase()} la versión.`), color: 'red' });
                }
            },
        });
    };

    return (
        <Box>
            <Title order={2} mb="xl">Gestión de Catálogo de Vehículos</Title>
            {loading ? <Center><Loader /></Center> :
                <>
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <ColumnList
                                title="Marcas (Filtro)"
                                items={marcas.map(m => ({ id: m.id_marca, nombre: m.nombre_marca, codigo: m.codigo_marca, activo: m.activo, detalle: m.ambito_marca }))}
                                selectedId={selectedMarca?.id_marca || null}
                                onSelect={(item) => handleSelectMarca(marcas.find(m => m.id_marca === item.id) || null)}
                                onAdd={() => handleOpenModal('marca', 'Crear Nueva Marca')}
                                onEdit={(item) => handleOpenModal('marca', 'Editar Marca', marcas.find(m => m.id_marca === item.id))}
                                onDeactivate={handleToggleMarcaActiva}
                                onActivate={handleToggleMarcaActiva}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <ColumnList
                                title="Modelos (Filtro)"
                                items={modelosFiltrados.map(m => ({ id: m.id_modelo, nombre: m.nombre_modelo, codigo: m.codigo_modelo || 'S/C', activo: m.activo }))}
                                selectedId={selectedModelo?.id_modelo || null}
                                onSelect={(item) => handleSelectModelo(modelosFiltrados.find(m => m.id_modelo === item.id) || null)}
                                onAdd={() => handleOpenModal('modelo', 'Crear Nuevo Modelo')}
                                onEdit={(item) => handleOpenModal('modelo', 'Editar Modelo', modelosFiltrados.find(m => m.id_modelo === item.id))}
                                disabled={false}
                                // Las funciones de activar/desactivar se manejarán desde la tabla principal
                                onDeactivate={() => {}} 
                                onActivate={() => {}}
                            />
                        </Grid.Col>
                    </Grid>

                    <Box mt="xl">
                        <VehiculosTable
                            marca={selectedMarca}
                            modelo={selectedModelo}
                            versiones={tablaVersiones}
                            marcas={marcas}
                            modelos={allModelos}
                            selectedVersionId={selectedVersion?.id_version || null}
                            onAdd={() => handleOpenModal('version', 'Crear Nueva Versión')}
                            onEdit={(version) => handleOpenModal('version', 'Editar Versión', version)}
                            onToggleActive={handleToggleVersionActiva}
                            onRowClick={(version) => setSelectedVersion(version)}
                        />
                    </Box>
                </>
            }
            <Modal opened={modalOpened} onClose={handleCloseModal} title={modalContent?.title} centered>
                {modalContent?.type === 'marca' && <MarcaForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
                {modalContent?.type === 'modelo' && <ModeloForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
                {modalContent?.type === 'version' && <VersionForm onSubmit={handleSubmit} isSubmitting={isSubmitting} initialValues={modalContent.editingItem} />}
            </Modal>
        </Box>
    );
}