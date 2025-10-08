// src/components/layout/AppSidebar.tsx
import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Box, NavLink as MantineNavLink, Title, Button, Collapse, Popover } from '@mantine/core';
import { IconSettings, IconChevronRight, IconChevronDown, IconArrowBarToLeft, IconArrowBarToRight, IconBuildingStore, IconHierarchy2, IconTags, IconRuler, IconUsers, IconKey, IconTag, IconBox, IconDashboard, IconMap, IconCar, IconTruck, IconCube, IconUser, IconBriefcase, IconResize, IconBuilding, IconCreditCard, IconList, IconBuildingFactory, IconShoppingCart, IconTool, IconAlertCircle } from '@tabler/icons-react';
import classes from './AppSidebar.module.css';

const menuItems = [
    { icon: IconDashboard, label: 'Dashboard', to: '/' },
    {
        icon: IconBuildingStore,
        label: 'Maestros General',
        id: 'maestros',
        subItems: [
            { icon: IconMap, label: 'Paises', to: '/paises' },
        ],
    },
    {
        icon: IconUser,
        label: 'Maestros Clientes',
        id: 'clientes',
        subItems: [
            { icon: IconUser, label: 'Clientes', to: '/clientes' },
            { icon: IconBriefcase, label: 'Tipos de Negocio', to: '/tipos-negocio' },
            { icon: IconResize, label: 'Segmentos de Cliente', to: '/segmentos-cliente' },
            { icon: IconBuildingStore, label: 'Tipos de Cliente', to: '/tipos-cliente' },
            { icon: IconCreditCard, label: 'Condiciones de Pago', to: '/condiciones-pago' },
            { icon: IconList, label: 'Listas de Precios', to: '/listas-precios' },
            { icon: IconBuilding, label: 'Empresas', to: '/empresas' },
        ],
    },
    {
        icon: IconBox,
        label: 'Maestros Productos',
        id: 'productos',
        subItems: [
            { icon: IconBox, label: 'Códigos de Referencia', to: '/codigos-referencia' },
            { icon: IconCube, label: 'Productos (SKU)', to: '/productos'},
            { icon: IconTruck, label: 'Proveedores', to: '/proveedores' },
            { icon: IconHierarchy2, label: 'Categorización', to: '/categorizacion' },
            { icon: IconHierarchy2, label: 'Clasificaciones de Servicio', to: '/clasificaciones-servicio' },
            { icon: IconHierarchy2, label: 'Clasificaciones Estadísticas', to: '/clasificaciones-estadistica' },
            { icon: IconTags, label: 'Atributos', to: '/atributos' },
            { icon: IconTags, label: 'Calidades', to: '/calidades' },
            { icon: IconBuildingFactory, label: 'Fabricas', to: '/fabricas' },
            { icon: IconCar, label: 'Vehículos', to: '/vehiculos' }, 
            { icon: IconRuler, label: 'Medidas', to: '/medidas' },
            { icon: IconMap, label: 'Origenes', to: '/origenes' },
        ],
    },
    {
        icon: IconShoppingCart,
        label: 'Pedidos',
        id: 'pedidos',
        subItems: [
            { icon: IconShoppingCart, label: 'Pedidos', to: '/pedidos' },
        ],
    },
    {
        icon: IconTool,
        label: 'Soporte',
        id: 'soporte',
        subItems: [
            { icon: IconAlertCircle, label: 'Casos', to: '/casos' },
            { icon: IconTags, label: 'Tipos de Caso', to: '/tipos-caso' },
            { icon: IconTool, label: 'Instalaciones', to: '/instalaciones' },
            { icon: IconUsers, label: 'Usuarios B2B', to: '/usuarios-b2b' },
            { icon: IconCube, label: 'Equipos', to: '/equipos' },
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
            { icon: IconUser, label: 'Vendedores', to: '/vendedores' },
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
                                            pl={34}
                                            className={classes.link}
                                        />
                                    ))}
                                </Collapse>
                            </div>
                        ) : (
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