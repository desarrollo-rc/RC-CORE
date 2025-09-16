// src/features/auth/LoginPage.tsx

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserCredentials } from '../../types/auth';

// 1. Importa los componentes de Mantine que usaremos
import { Paper, Title, TextInput, PasswordInput, Button, Container, Stack, Anchor, Image as MantineImage, Box } from '@mantine/core';

// 2. Importa nuestro nuevo archivo de estilos
import classes from './LoginPage.module.css';
import RCLogo from '../../assets/RC.png';

const LoginPage: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<UserCredentials>();
    const { login } = useAuth();
    const navigate = useNavigate();

    const onSubmit: SubmitHandler<UserCredentials> = async (data) => {
      try {
          await login(data);
          navigate('/');
      } catch (error) {
          console.error('Error de login:', error);
          alert('Error en las credenciales.');
      }
    };

    return (
        // 3. Contenedor principal para centrar el contenido
        <div className={classes.wrapper}>
            <Container size={420} my={40}>
                {/* 4. Paper actúa como el "cuadro" o "tarjeta" del login */}
                <Paper withBorder shadow="md" p={30} radius="md">
                    <Stack align="center" mb="lg">
                        <Box p="xs" style={{ borderRadius: 'var(--mantine-radius-sm)' }}>
                            <MantineImage src={RCLogo} alt="RC CORE Logo" width={100} fit="contain" />
                        </Box>
                        <Title order={2} className={classes.title} ta="center">
                            Acceso a RC CORE
                        </Title>
                    </Stack>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* 5. Usamos los componentes de formulario de Mantine */}
                        <TextInput
                            label="Email"
                            placeholder="tu@email.com"
                            required
                            {...register('email', { required: "El email es obligatorio" })}
                            error={errors.email?.message}
                        />

                        <PasswordInput
                            label="Contraseña"
                            placeholder="Tu contraseña"
                            required
                            mt="md"
                            {...register('password', { required: "La contraseña es obligatoria" })}
                            error={errors.password?.message}
                        />

                        <Anchor component="button" type="button" size="sm" className={classes.forgotPasswordLink}>
                            ¿Olvidaste tu contraseña?
                        </Anchor>

                        <Button type="submit" fullWidth mt="xl" color="red">
                            Ingresar
                        </Button>
                    </form>
                </Paper>
            </Container>
        </div>
      );
};

export default LoginPage;