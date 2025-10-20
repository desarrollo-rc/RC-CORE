// frontend/src/features/consultas/components/QueryResultModal.tsx
import { Modal, Table, ScrollArea, Text, Alert, Button, Group } from '@mantine/core';
import { IconAlertCircle, IconDownload } from '@tabler/icons-react';

interface Props {
    opened: boolean;
    onClose: () => void;
    title: string;
    data: Record<string, any>[] | null;
    error: string | null;
    filas_totales?: number;
    limitado?: boolean;
    onDownloadExcel?: () => void;
    isDownloadingExcel?: boolean;
    // Prop para el botón de acción principal
    actionButton?: {
        label: string;
        onClick: () => void;
        isLoading: boolean;
        color: string;
    };
}

export function QueryResultModal({ opened, onClose, title, data, error, filas_totales, limitado, onDownloadExcel, isDownloadingExcel, actionButton }: Props) {
    if (error) {
        return (
            <Modal opened={opened} onClose={onClose} title="Error al ejecutar" size="xl">
                <Alert icon={<IconAlertCircle size={16} />} title="Ocurrió un error" color="red">
                    {error}
                </Alert>
            </Modal>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Modal opened={opened} onClose={onClose} title={title} size="xl">
                <Text>La consulta se ejecutó correctamente pero no arrojó resultados.</Text>
            </Modal>
        );
    }

    // Obtenemos las cabeceras de la primera fila de datos
    const headers = Object.keys(data[0]);
    const rows = data.map((row, index) => (
        <Table.Tr key={index}>
            {headers.map((header) => (
                <Table.Td key={header}>{String(row[header])}</Table.Td>
            ))}
        </Table.Tr>
    ));

    return (
        <Modal opened={opened} onClose={onClose} title={title} size="xl" centered>
            <Group justify="space-between" mb="md">
                <div>
                    {limitado && (
                        <Alert icon={<IconAlertCircle size={16} />} title="Resultados limitados" color="orange">
                            Se están mostrando 10,000 filas de un total de {filas_totales?.toLocaleString()} filas. 
                            Para ver todos los resultados, descarga el archivo Excel.
                        </Alert>
                    )}
                    {!limitado && filas_totales && (
                        <Text size="sm" c="dimmed">
                            Total de filas: {filas_totales.toLocaleString()}
                        </Text>
                    )}
                </div>
                {onDownloadExcel && (
                    <Button 
                        leftSection={<IconDownload size={16} />}
                        onClick={onDownloadExcel}
                        loading={isDownloadingExcel}
                        variant="light"
                    >
                        Descargar Excel
                    </Button>
                )}
            </Group>
            <ScrollArea style={{ height: 400 }}>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead>
                        <Table.Tr>
                            {headers.map((header) => (
                                <Table.Th key={header}>{header}</Table.Th>
                            ))}
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </ScrollArea>
            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>Cerrar</Button>
                {/* --- LÓGICA DE BOTÓN DE ACCIÓN REFINADA --- */}
                {actionButton && data && data.length > 0 && (
                <Button 
                    color={actionButton.color} 
                    onClick={actionButton.onClick} 
                    loading={actionButton.isLoading}
                >
                    {actionButton.label}
                </Button>
                )}
            </Group>
        </Modal>
    );
}