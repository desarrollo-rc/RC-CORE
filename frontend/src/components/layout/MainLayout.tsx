// src/components/layout/MainLayout.tsx
import { useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { AppNavbar } from './AppNavbar';
import { AppSidebar } from './AppSidebar';
import classes from './MainLayout.module.css';

export function MainLayout() {
    const getInitialState = () => {
        const savedState = localStorage.getItem('sidebar-opened');
        // Si no hay nada guardado, iniciamos en 'abierto' (true).
        // De lo contrario, usamos el valor guardado.
        return savedState === null ? true : JSON.parse(savedState);
    };
    const [opened, { toggle }] = useDisclosure(getInitialState());
    useEffect(() => {
        localStorage.setItem('sidebar-opened', JSON.stringify(opened));
    }, [opened]);
    return (
        <AppShell
            padding="md"
            header={{ height: 60 }}
            navbar={{
                // 1. Hacemos el ancho dinámico: 300px abierto, 80px cerrado
                width: opened ? 200 : 80,
                breakpoint: 'sm',
                collapsed: { mobile: !opened, desktop: false },
            }}
        >
            <AppShell.Header className={classes.header}>
                <AppNavbar/>
            </AppShell.Header>
            <AppShell.Navbar className={classes.sidebar} p="md">
                <AppSidebar sidebarOpen={opened} toggleSidebar={toggle} />
            </AppShell.Navbar>
            <AppShell.Main>
                <Outlet />
            </AppShell.Main>
        </AppShell>
    );
}