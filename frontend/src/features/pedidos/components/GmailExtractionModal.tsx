// frontend/src/features/pedidos/components/GmailExtractionModal.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Button, Stack, Alert, Text, Group, Loader } from '@mantine/core';
import { IconAlertCircle, IconMail, IconSearch } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { previewPedidosGmail } from '../services/pedidoService';

interface GmailExtractionModalProps {
    opened: boolean;
    onClose: () => void;
}

export function GmailExtractionModal({ opened, onClose }: GmailExtractionModalProps) {
    const navigate = useNavigate();
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const result = await previewPedidosGmail(fechaDesde || undefined, fechaHasta || undefined);

            if (result.exito && result.pedidos.length > 0) {
                // Cerrar el modal
                onClose();
                
                // Redirigir a la página de revisión con los datos
                navigate('/pedidos/gmail/revisar', { 
                    state: { pedidos: result.pedidos } 
                });
            } else if (result.exito && result.pedidos.length === 0) {
                notifications.show({
                    title: 'Sin Resultados',
                    message: 'No se encontraron pedidos en el rango de fechas especificado',
                    color: 'orange',
                    icon: <IconAlertCircle size={18} />,
                });
            } else {
                notifications.show({
                    title: 'Error en la Extracción',
                    message: result.mensaje,
                    color: 'red',
                    icon: <IconAlertCircle size={18} />,
                });
            }
        } catch (error: any) {
            const mensaje = error.response?.data?.mensaje || error.message || 'Error al conectar con Gmail';
            notifications.show({
                title: 'Error',
                message: mensaje,
                color: 'red',
                icon: <IconAlertCircle size={18} />,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFechaDesde('');
        setFechaHasta('');
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Extraer Pedidos B2B desde Gmail"
            size="lg"
            centered
        >
            <Stack gap="md">
                <Alert icon={<IconMail size={16} />} color="blue" variant="light">
                    Esta función buscará correos de confirmación de pedidos B2B en tu cuenta de Gmail
                    y te permitirá revisar la información antes de importarla al sistema.
                </Alert>

                <TextInput
                    type="date"
                    label="Fecha desde"
                    description="Dejar vacío para buscar en las últimas 24 horas"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.currentTarget.value)}
                    disabled={loading}
                />

                <TextInput
                    type="date"
                    label="Fecha hasta"
                    description="Opcional - delimita el rango de búsqueda"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.currentTarget.value)}
                    disabled={loading}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="outline" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        leftSection={loading ? <Loader size={16} /> : <IconSearch size={16} />}
                    >
                        {loading ? 'Buscando...' : 'Buscar Pedidos'}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

