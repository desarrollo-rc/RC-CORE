import { Box, Title, Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { InstalacionesList } from '../components/InstalacionesList';
import { InstallationRequestForm } from '../components/InstallationRequestForm';

export function InstalacionesPage() {
  const [modalOpened, { open, close }] = useDisclosure(false);

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Title order={2}>Instalaciones</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={open}>
          Nueva Instalación
        </Button>
      </Group>

      <InstalacionesList />

      <Modal
        opened={modalOpened}
        onClose={close}
        title="Nueva Solicitud de Instalación"
        size="lg"
        centered
      >
        <InstallationRequestForm onSuccess={close} />
      </Modal>
    </Box>
  );
}