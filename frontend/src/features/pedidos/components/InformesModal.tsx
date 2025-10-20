// frontend/src/features/pedidos/components/InformesModal.tsx
import { useState } from 'react';
import { 
    Modal, 
    Stack, 
    Button, 
    Group, 
    TextInput, 
    NumberInput, 
    Select,
    Text,
    Alert,
    Divider
} from '@mantine/core';
import { IconFileText, IconCalendar, IconClock, IconChartBar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { generarInformeCorte, generarInformeMensual, generarInformeCorteExcel, generarInformeMensualExcel } from '../services/pedidoService';

interface InformesModalProps {
    opened: boolean;
    onClose: () => void;
}

interface InformeCorteData {
    fecha: string;
    hora: number;
}

interface InformeMensualData {
    mes: string;
    año: string;
}

export function InformesModal({ opened, onClose }: InformesModalProps) {
    const [tipoInforme, setTipoInforme] = useState<'corte' | 'mensual' | null>(null);
    const [formato, setFormato] = useState<'pdf' | 'excel'>('pdf');
    const [corteData, setCorteData] = useState<InformeCorteData>({
        fecha: '',
        hora: 0
    });
    const [mensualData, setMensualData] = useState<InformeMensualData>({
        mes: '',
        año: new Date().getFullYear().toString()
    });

    const meses = [
        { value: '1', label: 'Enero' },
        { value: '2', label: 'Febrero' },
        { value: '3', label: 'Marzo' },
        { value: '4', label: 'Abril' },
        { value: '5', label: 'Mayo' },
        { value: '6', label: 'Junio' },
        { value: '7', label: 'Julio' },
        { value: '8', label: 'Agosto' },
        { value: '9', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' }
    ];

    const años = Array.from({ length: 5 }, (_, i) => {
        const año = new Date().getFullYear() - i;
        return { value: año.toString(), label: año.toString() };
    });

    const handleGenerarInforme = async () => {
        if (tipoInforme === 'corte') {
            if (!corteData.fecha) {
                notifications.show({
                    title: 'Error',
                    message: 'Debe seleccionar una fecha',
                    color: 'red'
                });
                return;
            }
            if (formato === 'pdf') {
                await generarInformeCorteHandler();
            } else {
                await generarInformeCorteExcelHandler();
            }
        } else if (tipoInforme === 'mensual') {
            if (!mensualData.mes) {
                notifications.show({
                    title: 'Error',
                    message: 'Debe seleccionar un mes',
                    color: 'red'
                });
                return;
            }
            if (formato === 'pdf') {
                await generarInformeMensualHandler();
            } else {
                await generarInformeMensualExcelHandler();
            }
        }
    };

    const generarInformeCorteHandler = async () => {
        try {
            notifications.show({
                id: 'generando-informe-corte',
                title: 'Generando Informe de Corte',
                message: 'Preparando informe...',
                loading: true,
                autoClose: false,
            });

            const blob = await generarInformeCorte(corteData.fecha, corteData.hora);
            
            notifications.update({
                id: 'generando-informe-corte',
                title: 'Informe Generado',
                message: 'Informe de corte generado exitosamente',
                color: 'green',
                loading: false,
                autoClose: 3000,
            });

            // Descargar el archivo
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `informe_corte_${corteData.fecha}_${corteData.hora}h.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

        } catch (error: any) {
            notifications.update({
                id: 'generando-informe-corte',
                title: 'Error',
                message: error.response?.data?.mensaje || 'Error al generar el informe de corte',
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        }
    };

    const generarInformeMensualHandler = async () => {
        try {
            notifications.show({
                id: 'generando-informe-mensual',
                title: 'Generando Informe Mensual',
                message: 'Preparando informe...',
                loading: true,
                autoClose: false,
            });

            const blob = await generarInformeMensual(mensualData.mes, mensualData.año);
            
            notifications.update({
                id: 'generando-informe-mensual',
                title: 'Informe Generado',
                message: 'Informe mensual generado exitosamente',
                color: 'green',
                loading: false,
                autoClose: 3000,
            });

            // Descargar el archivo
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const mesNombre = meses.find(m => m.value === mensualData.mes)?.label || mensualData.mes;
            a.download = `informe_mensual_${mensualData.año}_${mesNombre}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

        } catch (error: any) {
            notifications.update({
                id: 'generando-informe-mensual',
                title: 'Error',
                message: error.response?.data?.mensaje || 'Error al generar el informe mensual',
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        }
    };

    const generarInformeCorteExcelHandler = async () => {
        try {
            notifications.show({
                id: 'generando-informe-corte-excel',
                title: 'Generando Informe de Corte Excel',
                message: 'Preparando informe...',
                loading: true,
                autoClose: false,
            });

            const blob = await generarInformeCorteExcel(corteData.fecha, corteData.hora);
            
            notifications.update({
                id: 'generando-informe-corte-excel',
                title: 'Informe Generado',
                message: 'Informe de corte Excel generado exitosamente',
                color: 'green',
                loading: false,
                autoClose: 3000,
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `informe_corte_${corteData.fecha}_${corteData.hora}h.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

        } catch (error: any) {
            notifications.update({
                id: 'generando-informe-corte-excel',
                title: 'Error',
                message: error.response?.data?.mensaje || 'Error al generar el informe de corte Excel',
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        }
    };

    const generarInformeMensualExcelHandler = async () => {
        try {
            notifications.show({
                id: 'generando-informe-mensual-excel',
                title: 'Generando Informe Mensual Excel',
                message: 'Preparando informe...',
                loading: true,
                autoClose: false,
            });

            const blob = await generarInformeMensualExcel(mensualData.mes, mensualData.año);
            
            notifications.update({
                id: 'generando-informe-mensual-excel',
                title: 'Informe Generado',
                message: 'Informe mensual Excel generado exitosamente',
                color: 'green',
                loading: false,
                autoClose: 3000,
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const mesNombre = meses.find(m => m.value === mensualData.mes)?.label || mensualData.mes;
            a.download = `informe_mensual_${mensualData.año}_${mesNombre}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

        } catch (error: any) {
            notifications.update({
                id: 'generando-informe-mensual-excel',
                title: 'Error',
                message: error.response?.data?.mensaje || 'Error al generar el informe mensual Excel',
                color: 'red',
                loading: false,
                autoClose: 5000,
            });
        }
    };

    const handleClose = () => {
        setTipoInforme(null);
        setFormato('pdf');
        setCorteData({ fecha: '', hora: 0 });
        setMensualData({ mes: '', año: new Date().getFullYear().toString() });
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Generar Informes"
            size="lg"
            centered
        >
            <Stack gap="md">
                {!tipoInforme ? (
                    // Selección de tipo de informe
                    <>
                        <Text size="sm" c="dimmed">
                            Seleccione el tipo de informe que desea generar:
                        </Text>
                        
                        <Select
                            label="Formato del informe"
                            placeholder="Selecciona un formato"
                            data={[
                                { value: 'pdf', label: 'PDF' },
                                { value: 'excel', label: 'Excel' },
                            ]}
                            value={formato}
                            onChange={(value) => setFormato((value as 'pdf' | 'excel') || 'pdf')}
                        />
                        
                        <Group grow>
                            <Button
                                variant="outline"
                                leftSection={<IconClock size={18} />}
                                onClick={() => setTipoInforme('corte')}
                                style={{ height: 80 }}
                            >
                                <Stack gap="xs" align="center">
                                    <Text fw={500}>Informe de Corte</Text>
                                    <Text size="xs" c="dimmed">Por fecha y hora específica</Text>
                                </Stack>
                            </Button>
                            
                            <Button
                                variant="outline"
                                leftSection={<IconCalendar size={18} />}
                                onClick={() => setTipoInforme('mensual')}
                                style={{ height: 80 }}
                            >
                                <Stack gap="xs" align="center">
                                    <Text fw={500}>Informe Mensual</Text>
                                    <Text size="xs" c="dimmed">Resumen del mes seleccionado</Text>
                                </Stack>
                            </Button>
                        </Group>
                    </>
                ) : (
                    // Formulario específico según el tipo
                    <>
                        <Group justify="space-between">
                            <Text fw={500}>
                                {tipoInforme === 'corte' ? 'Informe de Corte' : 'Informe Mensual'}
                            </Text>
                            <Button variant="subtle" size="xs" onClick={() => setTipoInforme(null)}>
                                ← Volver
                            </Button>
                        </Group>

                        <Divider />

                        {tipoInforme === 'corte' ? (
                            <Stack gap="md">
                                <Alert icon={<IconClock size={16} />} color="blue" variant="light">
                                    El informe de corte incluirá todos los pedidos desde el último día laboral a la hora de corte hasta la fecha y hora especificada. Si es lunes, incluirá desde el viernes al horario de corte.
                                </Alert>
                                
                                <TextInput
                                    type="date"
                                    label="Fecha de corte"
                                    value={corteData.fecha}
                                    onChange={(e) => setCorteData(prev => ({ ...prev, fecha: e.target.value }))}
                                    required
                                />
                                
                                <NumberInput
                                    label="Hora de corte"
                                    description="Hora en formato 24h (0-23)"
                                    min={0}
                                    max={23}
                                    value={corteData.hora}
                                    onChange={(v) => setCorteData(prev => ({ ...prev, hora: Number(v) || 0 }))}
                                    required
                                />
                            </Stack>
                        ) : (
                            <Stack gap="md">
                                <Alert icon={<IconChartBar size={16} />} color="green" variant="light">
                                    El informe mensual incluirá: Top clientes, Top 20 productos más vendidos, ventas totales y análisis del período.
                                </Alert>
                                
                                <Group grow>
                                    <Select
                                        label="Mes"
                                        placeholder="Seleccione mes"
                                        data={meses}
                                        value={mensualData.mes}
                                        onChange={(v) => setMensualData(prev => ({ ...prev, mes: v || '' }))}
                                        required
                                    />
                                    
                                    <Select
                                        label="Año"
                                        placeholder="Seleccione año"
                                        data={años}
                                        value={mensualData.año}
                                        onChange={(v) => setMensualData(prev => ({ ...prev, año: v || '' }))}
                                        required
                                    />
                                </Group>
                            </Stack>
                        )}

                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGenerarInforme}
                                leftSection={<IconFileText size={16} />}
                                disabled={
                                    (tipoInforme === 'corte' && (!corteData.fecha || corteData.hora < 0)) ||
                                    (tipoInforme === 'mensual' && (!mensualData.mes || !mensualData.año))
                                }
                            >
                                Generar Informe
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        </Modal>
    );
}
