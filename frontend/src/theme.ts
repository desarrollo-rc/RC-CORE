// src/theme.ts
import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Definimos una paleta de colores para el negro y gris oscuro
const rcDark: MantineColorsTuple = [
    "#eef0f2",
    "#dee2e6",
    "#bdc3ce",
    "#9ca6b6",
    "#7b8aa0",
    "#657690",
    "#586b89",
    "#465977", // Un gris azulado oscuro para fondos
    "#344866",
    "#1d3656"
];

export const theme = createTheme({
    primaryColor: 'red',
    // Mantenemos la paleta de rojos
    colors: {
        'red': [
            "#ff0000", "#ffc9c9", "#ffa8a8", "#ff8787", "#ff6b6b",
            "#fa5252", "#f03e3e", "#e03131", "#c92a2a", "#b32222"
        ],
        // Añadimos la nueva paleta
        'rcDark': rcDark,
    },
    // Hacemos que el color de fondo por defecto sea nuestro gris oscuro
    other: {
        bodyBackgroundColor: 'var(--mantine-color-rcDark-8)',
        bodyBackgroundColorDark: 'var(--mantine-color-dark-8)',
    },
    components: {
        Paper: {
            defaultProps: {
                withBorder: true,
                shadow: "sm",
                radius: "md",
            }
        },
    }
});