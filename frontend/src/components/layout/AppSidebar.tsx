// src/components/layout/AppSidebar.tsx
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, NavLink as MantineNavLink, Title, Button, Collapse, Popover } from '@mantine/core';
import { FaTachometerAlt, FaUsers, FaBoxOpen, FaSitemap, FaKey, FaUserTag } from 'react-icons/fa';
import { IconSettings, IconChevronRight, IconChevronDown, IconArrowBarToLeft, IconArrowBarToRight } from '@tabler/icons-react';
import classes from './AppSidebar.module.css';

const menuItems = [
    { icon: FaTachometerAlt, label: 'Dashboard', to: '/' },
    { icon: FaBoxOpen, label: 'Productos', to: '/productos' },
    {
        icon: IconSettings, // Un ícono para la sección principal
        label: 'Administración',
        // No tiene 'to' porque no es un enlace, solo abre el submenú
        subItems: [
            { icon: FaSitemap, label: 'Áreas', to: '/areas' },
            { icon: FaUsers, label: 'Usuarios', to: '/usuarios' },
            { icon: FaKey, label: 'Permisos', to: '/permisos' },
            { icon: FaUserTag, label: 'Roles', to: '/roles' },
        ],
    },
];

export function AppSidebar({ sidebarOpen, toggleSidebar }: { sidebarOpen: boolean; toggleSidebar: () => void; }) {
    const location = useLocation();
    const [adminMenuOpen, setAdminMenuOpen] = useState(false);

    const administrationLinks = menuItems.find(item => item.subItems)?.subItems?.map(sub => sub.to) || [];
    const isAdministrationActive = administrationLinks.includes(location.pathname);

    return (
        <Box className={classes.sidebar}>
            <Box>
                {sidebarOpen && <Title order={5} className={classes.title}>Navegación</Title>}

                {menuItems.map((item) => {
                    // Si el item tiene sub-items, renderizamos un menú desplegable
                    if (item.subItems) {
                        return sidebarOpen ? (
                            <div key={item.label}>
                                <MantineNavLink
                                    label={item.label}
                                    leftSection={<item.icon size="1.2rem" />}
                                    rightSection={adminMenuOpen ? <IconChevronDown size="1.0rem" /> : <IconChevronRight size="1.0rem" />}
                                    onClick={() => setAdminMenuOpen((o) => !o)}
                                    className={classes.link}
                                    active={isAdministrationActive}
                                />
                                <Collapse in={adminMenuOpen}>
                                    {item.subItems.map((subItem) => (
                                        <MantineNavLink
                                            key={subItem.label}
                                            component={NavLink}
                                            to={subItem.to}
                                            label={subItem.label}
                                            leftSection={<subItem.icon size="1.2rem" />}
                                            active={location.pathname === subItem.to}
                                            classNames={{ root: classes.link, body: classes.subLinkBody }}
                                        />
                                    ))}
                                </Collapse>
                            </div>
                        ) : (
                            // --- VISTA COLAPSADA (usa Popover) ---
                            <Popover key={item.label} position="right-start" withArrow shadow="md">
                                <Popover.Target>
                                    <MantineNavLink
                                        leftSection={<item.icon size="1.2rem" />}
                                        className={classes.link}
                                        active={isAdministrationActive}
                                        // Evitamos el comportamiento de link para que solo abra el Popover
                                        onClick={(e) => e.preventDefault()}
                                    />
                                </Popover.Target>
                                <Popover.Dropdown p={4}>
                                    {item.subItems.map((subItem) => (
                                        <MantineNavLink
                                            key={subItem.label}
                                            component={NavLink}
                                            to={subItem.to}
                                            label={subItem.label}
                                            leftSection={<subItem.icon size="1.2rem" />}
                                            active={location.pathname === subItem.to}
                                            className={classes.link} // Reutilizamos la misma clase
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
                            key={item.label}
                            component={NavLink}
                            to={item.to}
                            label={sidebarOpen ? item.label : undefined}
                            leftSection={<Icon size="1.2rem" />}
                            active={location.pathname === item.to}
                            classNames={{ root: classes.link }}
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