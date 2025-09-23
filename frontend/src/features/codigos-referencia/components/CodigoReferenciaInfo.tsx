// frontend/src/features/codigos-referencia/components/CodigoReferenciaInfo.tsx
import { Paper, Title, Text, Group, Button, Grid, Box } from '@mantine/core';
import { IconPencil } from '@tabler/icons-react';
import type { CodigoReferencia } from '../types';

interface CodigoReferenciaInfoProps {
    codigoReferencia: CodigoReferencia;
    onEdit: () => void;
}

export function CodigoReferenciaInfo({ codigoReferencia, onEdit }: CodigoReferenciaInfoProps) {
    // Buscamos los nombres de las clasificaciones para mostrarlos
    const nombreClasificacionServicio = codigoReferencia.clasificacion_servicio?.nombre || 'Sin Asignar';
    const nombreClasificacionEstadistica = codigoReferencia.clasificacion_estadistica?.nombre || 'Sin Asignar';

    return (
        <Paper withBorder p="md" radius="md" mb="xl">
            <Group justify="space-between" align="flex-start">
                <Box>
                    <Title order={3}>{codigoReferencia.codigo}</Title>
                    <Text c="dimmed">{codigoReferencia.descripcion}</Text>
                </Box>
                <Button onClick={onEdit} leftSection={<IconPencil size={14} />}>
                    Editar Información General
                </Button>
            </Group>
            
            <Grid mt="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fz="sm" fw={500}>Clasificación de Servicio</Text>
                    <Text>{nombreClasificacionServicio}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Text fz="sm" fw={500}>Clasificación Estadística</Text>
                    <Text>{nombreClasificacionEstadistica}</Text>
                </Grid.Col>
            </Grid>
        </Paper>
    );
}