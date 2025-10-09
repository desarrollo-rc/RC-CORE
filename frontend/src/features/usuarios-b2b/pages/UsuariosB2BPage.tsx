// frontend/src/features/usuarios-b2b/pages/UsuariosB2BPage.tsx
import { Box, Title, Button, Group, Modal } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { UsuariosB2BTable } from '../components/UsuariosB2BTable';
import { UsuarioB2BForm } from '../components/UsuarioB2BForm';

export function UsuariosB2BPage() {
    const [modalOpened, { open, close }] = useDisclosure(false);

    return (
        <Box>
            <Group justify="space-between" mb="lg">
                <Title order={2}>Usuarios B2B</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={open}>
                    Nuevo Usuario B2B
                </Button>
            </Group>

            <UsuariosB2BTable />

            <Modal
                opened={modalOpened}
                onClose={close}
                title="Nuevo Usuario B2B"
                size="lg"
                centered
            >
                <UsuarioB2BForm onSuccess={close} />
            </Modal>
        </Box>
    );
}

