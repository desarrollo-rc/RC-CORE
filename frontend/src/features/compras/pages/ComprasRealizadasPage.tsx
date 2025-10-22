// frontend/src/features/compras/pages/ComprasRealizadasPage.tsx
import { Box, Title, Text, Alert, Center, Stack } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

export function ComprasRealizadasPage() {
  return (
    <Box>
      <Title order={2} mb="xl">Compras Realizadas</Title>
      
      <Center>
        <Stack align="center" gap="lg">
          <Alert
            icon={<IconInfoCircle size="1rem" />}
            title="Próximamente"
            color="blue"
            variant="light"
            style={{ maxWidth: 500 }}
          >
            <Text size="sm">
              Esta funcionalidad estará disponible próximamente. 
              Aquí podrás gestionar y consultar todas las compras realizadas.
            </Text>
          </Alert>
          
          <Text size="sm" c="dimmed" ta="center">
            Funcionalidades que se implementarán:
          </Text>
          
          <Stack gap="xs" style={{ maxWidth: 400 }}>
            <Text size="sm">• Listado de compras realizadas</Text>
            <Text size="sm">• Filtros por fecha, proveedor y estado</Text>
            <Text size="sm">• Detalle de cada compra</Text>
            <Text size="sm">• Exportación de reportes</Text>
            <Text size="sm">• Seguimiento de estados</Text>
          </Stack>
        </Stack>
      </Center>
    </Box>
  );
}
