// frontend/src/features/equipos/pages/EquiposPage.tsx
import { Box, Title, Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { EquiposTable } from '../components/EquiposTable';
import { EquipoForm } from '../components/EquipoForm';

export function EquiposPage() {
    const [modalOpened, { open, close }] = useDisclosure(false);

    return (
        <Box>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Equipos</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={open}>
                    Nuevo Equipo
                </Button>
            </Group>

            <EquiposTable />

            <Modal
                opened={modalOpened}
                onClose={close}
                title="Nuevo Equipo"
                size="lg"
                centered
            >
                <EquipoForm onSuccess={close} />
            </Modal>
        </Box>
    );
}

