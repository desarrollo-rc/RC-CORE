// src/features/productos/atributos/pages/AtributosPage.tsx

import { useEffect, useState } from 'react';
import { Box, Title, Group, Alert, Center, Loader, Switch, Modal, Grid,Text, Button, Paper, Menu, Affix, ActionIcon, rem } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';

import { AtributosTable } from '../components/AtributosTable';
import { AtributoForm } from '../components/AtributoForm';
import { ValoresAtributoTable } from '../components/ValoresAtributoTable';
import { ValorAtributoForm } from '../components/ValorAtributoForm';
import { getAtributos, createAtributo, updateAtributo, deactivateAtributo, activateAtributo } from '../services/atributoService';
import { getValores, createValor, updateValor, deactivateValor, activateValor } from '../services/valorAtributoService';
import type { Atributo, AtributoFormData, ValorAtributo, ValorAtributoFormData } from '../types';
import { getApiErrorMessage } from '../../../utils/errorHandler';
import { IconPlus } from '@tabler/icons-react';

export function AtributosPage() {
    const [atributos, setAtributos] = useState<Atributo[]>([]);
    const [loadingAtributos, setLoadingAtributos] = useState(true);
    const [selectedAtributo, setSelectedAtributo] = useState<Atributo | null>(null);
    const [editingAtributo, setEditingAtributo] = useState<Atributo | null>(null);
    const [atributoModalOpened, { open: openAtributoModal, close: closeAtributoModal }] = useDisclosure(false);
    const [includeInactive, setIncludeInactive] = useState(false);

    const [valores, setValores] = useState<ValorAtributo[]>([]);
    const [loadingValores, setLoadingValores] = useState(false);
    const [editingValor, setEditingValor] = useState<ValorAtributo | null>(null);
    const [valorModalOpened, { open: openValorModal, close: closeValorModal }] = useDisclosure(false);
    
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setLoadingAtributos(true);
        getAtributos(includeInactive)
            .then(data => {
                setAtributos(data);
                if (selectedAtributo && !data.find(a => a.id_atributo === selectedAtributo.id_atributo)) {
                    setSelectedAtributo(null);
                }
            })
            .catch(() => setError('No se pudieron cargar los atributos.'))
            .finally(() => setLoadingAtributos(false));
    }, [includeInactive]);

    useEffect(() => {
        if (selectedAtributo) {
            setLoadingValores(true);
            setValores([]);
            getValores(selectedAtributo.id_atributo)
                .then(setValores)
                .catch(() => setError('No se pudieron cargar los valores.'))
                .finally(() => setLoadingValores(false));
        } else {
            setValores([]);
        }
    }, [selectedAtributo]);

    const handleSelectAtributo = (atributo: Atributo) => {
        setSelectedAtributo(current => (current?.id_atributo === atributo.id_atributo ? null : atributo));
    };

    const handleOpenAtributoModal = (atributo: Atributo | null = null) => {
        setEditingAtributo(atributo);
        openAtributoModal();
    };

    const handleOpenValorModal = (valor: ValorAtributo | null = null) => {
        setEditingValor(valor);
        openValorModal();
    };

    const handleCloseValorModal = () => {
        closeValorModal();
        setEditingValor(null);
    };

    const handleAtributoSubmit = async (formValues: AtributoFormData) => {
        setIsSubmitting(true);
        const payload = {
            codigo: formValues.codigo.trim(),
            nombre: formValues.nombre.trim(),
        };
        try {
            if (editingAtributo) {  
                const updated = await updateAtributo(editingAtributo?.id_atributo || 0, payload);
                setAtributos(current => current.map(a => a.id_atributo === updated.id_atributo ? updated : a));
                notifications.show({ title: 'Éxito', message: 'Atributo actualizado.', color: 'blue' });
            } else {
                const newAtributo = await createAtributo(payload);
                setAtributos(current => [...current, newAtributo]);
                notifications.show({ title: 'Éxito', message: 'Atributo creado.', color: 'green' });
            }
            closeAtributoModal();
        } catch (error) {   
            const message = getApiErrorMessage(error, 'No se pudo guardar el atributo.');
            notifications.show({ title: 'Error', message, color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleValorSubmit = async (formValues: ValorAtributoFormData) => {
        if (!selectedAtributo) return;
        setIsSubmitting(true);
        try {
            if (editingValor) {
                const updated = await updateValor(selectedAtributo.id_atributo, editingValor.id_valor, formValues);
                setValores(current => current.map(v => v.id_valor === updated.id_valor ? updated : v));
                notifications.show({ title: 'Éxito', message: 'Valor actualizado.' });
            } else {
                const newValor = await createValor(selectedAtributo.id_atributo, formValues);
                setValores(current => [...current, newValor]);
                notifications.show({ title: 'Éxito', message: 'Valor añadido.' });
            }
            handleCloseValorModal();
        } catch (error) {
            notifications.show({ title: 'Error', message: getApiErrorMessage(error, 'No se pudo guardar el valor.'), color: 'red' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeactivateAtributo = (atributo: Atributo) => {
        modals.openConfirmModal({
            title: 'Desactivar Atributo',
            children: <Text size="sm">¿Estás seguro de que quieres desactivar el atributo "{atributo.codigo}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: async () => {
                try {
                    const updated = await deactivateAtributo(atributo.id_atributo);
                    setAtributos(current => current.map(a => a.id_atributo === updated.id_atributo ? updated : a));
                    notifications.show({ title: 'Éxito', message: 'Atributo desactivado.', color: 'orange' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo desactivar el atributo.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    }

    const handleActivateAtributo = (atributo: Atributo) => {
        modals.openConfirmModal({
            title: 'Activar Atributo',
            children: <Text size="sm">¿Estás seguro de que quieres activar el atributo "{atributo.codigo}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            confirmProps: { color: 'green' },
            onConfirm: async () => {
                try {
                    const updated = await activateAtributo(atributo.id_atributo);
                    setAtributos(current => current.map(a => a.id_atributo === updated.id_atributo ? updated : a));
                    notifications.show({ title: 'Éxito', message: 'Atributo activado.', color: 'green' });
                } catch (error) {
                    const message = getApiErrorMessage(error, 'No se pudo activar el atributo.');
                    notifications.show({ title: 'Error', message, color: 'red' });
                }
            },
        });
    }

    const handleDeactivateValor = (valor: ValorAtributo) => {
        if (!selectedAtributo) return;
        modals.openConfirmModal({
            title: 'Desactivar Valor',
            children: <Text size="sm">¿Desactivar el valor "{valor.valor}"?</Text>,
            labels: { confirm: 'Desactivar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await deactivateValor(selectedAtributo.id_atributo, valor.id_valor);
                setValores(current => current.map(v => v.id_valor === updated.id_valor ? updated : v));
                notifications.show({ title: 'Éxito', message: 'Valor desactivado.' });
            }
        });
    };

    const handleActivateValor = (valor: ValorAtributo) => {
        if (!selectedAtributo) return;
        modals.openConfirmModal({
            title: 'Activar Valor',
            children: <Text size="sm">¿Activar el valor "{valor.valor}"?</Text>,
            labels: { confirm: 'Activar', cancel: 'Cancelar' },
            onConfirm: async () => {
                const updated = await activateValor(selectedAtributo.id_atributo, valor.id_valor);
                setValores(current => current.map(v => v.id_valor === updated.id_valor ? updated : v));
                notifications.show({ title: 'Éxito', message: 'Valor activado.' });
            }
        });
    };

    if (loadingAtributos) return <Center h={200}><Loader /></Center>;
    if (error) return <Alert color="red" title="Error">{error}</Alert>;
    
    return (
        <Box>
            <Group justify="space-between" mb="xl">
                <Title order={2}>Gestión de Atributos y Valores</Title>
                <Group>
                    <Switch
                        label="Incluir inactivos"
                        checked={includeInactive}
                        onChange={(event) => setIncludeInactive(event.currentTarget.checked)}
                    />
                </Group>
            </Group>

            <Grid>
            <Grid.Col span={{ base: 12, md: 5 }}>
                    <Paper withBorder p="md" radius="md">
                        <AtributosTable
                            records={atributos}
                            selectedRecordId={selectedAtributo?.id_atributo || null}
                            onRowClick={handleSelectAtributo}
                            onEdit={handleOpenAtributoModal}
                            onDeactivate={handleDeactivateAtributo}
                            onActivate={handleActivateAtributo}
                        />
                    </Paper>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Paper withBorder p="md" radius="md">
                        <Group justify="space-between" mb="md">
                            <Title order={4}>Valores para: {selectedAtributo ? `"${selectedAtributo.nombre}"` : '(Selecciona un atributo)'}</Title>
                            <Button onClick={() => handleOpenValorModal(null)} disabled={!selectedAtributo}>Añadir Valor</Button>
                        </Group>
                        {loadingValores ? <Center><Loader size="sm" /></Center> : 
                            <ValoresAtributoTable
                                records={valores}
                                onEdit={handleOpenValorModal}
                                onDeactivate={handleDeactivateValor}
                                onActivate={handleActivateValor}
                            />
                        }
                    </Paper>
                </Grid.Col>
            </Grid>
            
            <Modal opened={atributoModalOpened} onClose={closeAtributoModal} title={editingAtributo ? 'Editar Atributo' : 'Crear Atributo'} centered>
                <AtributoForm onSubmit={handleAtributoSubmit} isSubmitting={isSubmitting} initialValues={editingAtributo} />
            </Modal>
            
            <Modal 
                opened={valorModalOpened} 
                onClose={handleCloseValorModal}
                title={editingValor ? `Editar Valor "${editingValor.valor}"` : `Añadir Valor a "${selectedAtributo?.nombre}"`} 
                centered
            >
                <ValorAtributoForm 
                    onSubmit={handleValorSubmit} 
                    isSubmitting={isSubmitting} 
                    initialValues={editingValor}
                />
            </Modal>

            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <Menu shadow="md" width={200}>
                    <Menu.Target>
                        <ActionIcon color="red" size={60} radius="xl" variant="filled">
                            <IconPlus style={{ width: '70%', height: '70%' }} stroke={1.5} />
                        </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                        <Menu.Label>Acciones</Menu.Label>
                        <Menu.Item leftSection={<IconPlus size={14} />} onClick={() => handleOpenAtributoModal(null)}>
                            Crear Atributo
                        </Menu.Item>
                    </Menu.Dropdown>
                </Menu>
            </Affix>
        </Box>
    );
}