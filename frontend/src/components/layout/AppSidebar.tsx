// src/components/layout/AppSidebar.tsx
import { NavLink, useLocation } from 'react-router-dom';
import { Box, NavLink as MantineNavLink, Title, Button } from '@mantine/core';
import { FaTachometerAlt, FaUsers, FaBoxOpen } from 'react-icons/fa';
import { IconArrowBarToLeft, IconArrowBarToRight } from '@tabler/icons-react';
import classes from './AppSidebar.module.css';

const menuItems = [
    { icon: FaTachometerAlt, label: 'Dashboard', to: '/' },
    { icon: FaUsers, label: 'Usuarios', to: '/usuarios' },
    { icon: FaBoxOpen, label: 'Productos', to: '/productos' },
];

export function AppSidebar({ sidebarOpen, toggleSidebar }: { sidebarOpen: boolean; toggleSidebar: () => void; }) {
    const location = useLocation();

    return (
        // El <Box> principal ahora es un contenedor Flexbox vertical
        <Box className={classes.sidebar}>
            {/* Sección 1: Navegación (lo que ya tenías) */}
            <Box>
                {sidebarOpen && <Title order={5} className={classes.title}>Navegación</Title>}
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <MantineNavLink
                            key={item.label}
                            component={NavLink}
                            to={item.to}
                            label={sidebarOpen ? item.label : undefined}
                            leftSection={<Icon size="1.2rem" />}
                            active={location.pathname === item.to}
                            classNames={{ root: classes.link }}
                            onClick={(e) => {
                                if (!sidebarOpen) {
                                    e.stopPropagation();
                                }
                            }}
                        />
                    );
                })}
            </Box>

            <Box className={classes.footer}>
                <Button
                    onClick={toggleSidebar}
                    variant="light"
                    fullWidth
                    justify="flex-start" // Alinea el contenido del botón a la izquierda
                    leftSection={sidebarOpen ? <IconArrowBarToLeft size={18} /> : <IconArrowBarToRight size={18} />}
                >
                    {sidebarOpen && 'Cerrar Menú'}
                </Button>
            </Box>
        </Box>
    );
}