// frontend/src/features/tipos-caso/pages/TiposCasoPage.tsx
import { Box, Title, Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { TiposCasoTable } from '../components/TiposCasoTable';
import { TipoCasoForm } from '../components/TipoCasoForm';

export function TiposCasoPage() {
    const [modalOpened, { open, close }] = useDisclosure(false);

    return (
        <Box>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Tipos de Caso</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={open}>
                    Nuevo Tipo de Caso
                </Button>
            </Group>

            <TiposCasoTable />

            <Modal
                opened={modalOpened}
                onClose={close}
                title="Nuevo Tipo de Caso"
                size="lg"
                centered
            >
                <TipoCasoForm onSuccess={close} />
            </Modal>
        </Box>
    );
}

