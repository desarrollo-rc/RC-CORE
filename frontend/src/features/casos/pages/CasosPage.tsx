// frontend/src/features/casos/pages/CasosPage.tsx
import { Box, Title, Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { CasosTable } from '../components/CasosTable';
import { CasoForm } from '../components/CasoForm';

export function CasosPage() {
    const [modalOpened, { open, close }] = useDisclosure(false);

    return (
        <Box>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Casos de Soporte</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={open}>
                    Nuevo Caso
                </Button>
            </Group>

            <CasosTable />

            <Modal
                opened={modalOpened}
                onClose={close}
                title="Nuevo Caso"
                size="lg"
                centered
            >
                <CasoForm onSuccess={close} />
            </Modal>
        </Box>
    );
}

