// src/components/layout/ThemeToggleButton.tsx
import { ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { FaSun, FaMoon } from 'react-icons/fa';

export function ThemeToggleButton() {
    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    return (
        <ActionIcon
            onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
            variant="default"
            size="lg"
            aria-label="Toggle color scheme"
        >
            {computedColorScheme === 'light' ? <FaMoon size="1.2rem" /> : <FaSun size="1.2rem" />}
        </ActionIcon>
    );
}