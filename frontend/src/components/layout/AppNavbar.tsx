// src/components/layout/AppNavbar.tsx
import { Group, Button, Image as MantineImage } from '@mantine/core';
import { useAuth } from '../../context/AuthContext';
import classes from './AppNavbar.module.css';
import RCLogo from '../../assets/RC.png'; // Asegúrate que esta ruta es correcta

export function AppNavbar() {
    const { logout } = useAuth();
    // const { user } = useAuth(); // En el futuro, podríamos obtener el nombre del usuario

    return (
        <Group justify="space-between" h="100%" px="md" className={classes.headerContent}>
            <Group>
                <MantineImage src={RCLogo} alt="RC CORE Logo" h={40} fit="contain" />
            </Group>
            <Group>
                <Button variant="light" color="red" onClick={logout}>Cerrar Sesión</Button>
            </Group>
        </Group>
    );
}