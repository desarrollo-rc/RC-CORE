// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import '@mantine/notifications/styles.css';
import '@mantine/core/styles.css';
import './styles/global.css';
import { theme } from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <MantineProvider theme={theme}>
            <ModalsProvider>
                <Notifications />
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ModalsProvider>
        </MantineProvider>
    </React.StrictMode>,
);