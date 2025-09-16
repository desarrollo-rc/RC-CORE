// src/components/layout/AppSidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, NavLink as MantineNavLink, Title, Button, Collapse, Popover } from '@mantine/core';
import { IconSettings, IconChevronRight, IconChevronDown, IconArrowBarToLeft, IconArrowBarToRight, IconBuildingStore, IconHierarchy2, IconTags, IconRuler, IconUsers, IconKey, IconUser, IconTag, IconBox, IconDashboard } from '@tabler/icons-react';
import classes from './AppSidebar.module.css';

const menuItems = [
    { icon: IconDashboard, label: 'Dashboard', to: '/' },
    {
        icon: IconBox,
        label: 'Maestros Productos',
        id: 'productos',
        subItems: [
            { icon: IconHierarchy2, label: 'Divisiones', to: '/divisiones' },
            { icon: IconTags, label: 'Atributos', to: '/atributos' },
            { icon: IconRuler, label: 'Medidas', to: '/medidas' },
        ],
    },
    {
        icon: IconSettings,
        label: 'Administración',
        id: 'admin',
        subItems: [
            { icon: IconBuildingStore, label: 'Áreas', to: '/areas' },
            { icon: IconUsers, label: 'Usuarios', to: '/usuarios' },
            { icon: IconKey, label: 'Permisos', to: '/permisos' },  
            { icon: IconTag, label: 'Roles', to: '/roles' },
        ],
    },
];

export function AppSidebar({ sidebarOpen, toggleSidebar }: { sidebarOpen: boolean; toggleSidebar: () => void; }) {
    const location = useLocation();
    const [openedMenu, setOpenedMenu] = useState<string | null>(null);

    useEffect(() => {
        const currentMenu = menuItems.find(item => 
            item.subItems?.some(sub => sub.to === location.pathname)
        );
        if (currentMenu) {
            setOpenedMenu(currentMenu.id || null);
        }
    }, [location.pathname]);

    const handleMenuClick = (menuId: string) => {
        setOpenedMenu(prev => (prev === menuId ? null : menuId));
    };

    return (
        <Box className={classes.sidebar}>
            <Box>
                {sidebarOpen && <Title order={5} className={classes.title}>Navegación</Title>}

                {menuItems.map((item) => {
                    // Si el item tiene sub-items, renderizamos un menú desplegable
                    if (item.subItems && item.id) {
                        const isMenuOpen = openedMenu === item.id;
                        const isMenuActive = item.subItems.some(sub => sub.to === location.pathname);
                        return sidebarOpen ? (
                            <div key={item.id}>
                                <MantineNavLink
                                    label={item.label}
                                    leftSection={<item.icon size="1.2rem" />}
                                    rightSection={isMenuOpen ? <IconChevronDown size="1.0rem" /> : <IconChevronRight size="1.0rem" />}
                                    onClick={() => handleMenuClick(item.id!)}
                                    className={classes.link}
                                    active={isMenuActive}
                                />
                                <Collapse in={isMenuOpen}>
                                    {item.subItems.map((subItem) => (
                                        <MantineNavLink
                                            key={subItem.to}
                                            component={NavLink}
                                            to={subItem.to}
                                            label={subItem.label}
                                            leftSection={<subItem.icon size="1.2rem" />}
                                            active={location.pathname === subItem.to}
                                            pl={34} // Indentación para sub-ítems
                                            className={classes.link}
                                        />
                                    ))}
                                </Collapse>
                            </div>
                        ) : (
                            // Vista colapsada (usa Popover)
                            <Popover key={item.id} position="right-start" withArrow shadow="md">
                                <Popover.Target>
                                    <MantineNavLink
                                        leftSection={<item.icon size="1.2rem" />}
                                        className={classes.link}
                                        active={isMenuActive}
                                        onClick={(e) => e.preventDefault()}
                                    />
                                </Popover.Target>
                                <Popover.Dropdown p={4}>
                                    {item.subItems.map((subItem) => (
                                        <MantineNavLink
                                            key={subItem.to}
                                            component={NavLink}
                                            to={subItem.to}
                                            label={subItem.label}
                                            leftSection={<subItem.icon size="1.2rem" />}
                                            active={location.pathname === subItem.to}
                                            className={classes.link}
                                        />
                                    ))}
                                </Popover.Dropdown>
                            </Popover>
                        );
                    }

                    // Si no tiene sub-items, se renderiza como un enlace normal
                    const Icon = item.icon;
                    return (
                        <MantineNavLink
                            key={item.to}
                            component={NavLink}
                            to={item.to!}
                            label={sidebarOpen ? item.label : undefined}
                            leftSection={<Icon size="1.2rem" />}
                            active={location.pathname === item.to}
                            className={classes.link}
                        />
                    );
                })}
            </Box>

            <Box className={classes.footer}>
                <Button
                    onClick={toggleSidebar}
                    variant="light"
                    fullWidth
                    justify="flex-start"
                    leftSection={sidebarOpen ? <IconArrowBarToLeft size={18} /> : <IconArrowBarToRight size={18} />}
                >
                    {sidebarOpen && 'Cerrar Menú'}
                </Button>
            </Box>
        </Box>
    );
}