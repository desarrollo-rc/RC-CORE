// frontend/src/features/usuarios-b2b/components/UsuarioB2BForm.tsx
import { useForm } from '@mantine/form';
import { TextInput, Button, Stack, PasswordInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { crearUsuarioB2B, actualizarUsuarioB2B } from '../services/usuarioB2BService';
import type { UsuarioB2B, CrearUsuarioB2BPayload } from '../types';

interface UsuarioB2BFormProps {
    usuario?: UsuarioB2B;
    onSuccess?: () => void;
}

export function UsuarioB2BForm({ usuario, onSuccess }: UsuarioB2BFormProps) {
    const queryClient = useQueryClient();
    const isEditing = !!usuario;

    const form = useForm({
        initialValues: {
            nombre_completo: usuario?.nombre_completo || '',
            usuario: usuario?.usuario || '',
            email: usuario?.email || '',
            password: '',
            id_cliente: usuario?.id_cliente || 0,
        },
        validate: {
            nombre_completo: (value) => (value.trim().length < 3 ? 'El nombre debe tener al menos 3 caracteres' : null),
            usuario: (value) => (value.trim().length < 3 ? 'El usuario debe tener al menos 3 caracteres' : null),
            email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email inválido'),
            password: (value, values) => {
                if (!isEditing && (!value || value.trim().length < 6)) {
                    return 'La contraseña debe tener al menos 6 caracteres';
                }
                return null;
            },
            id_cliente: (value) => (value === 0 ? 'Debe seleccionar un cliente' : null),
        },
    });

    const mutation = useMutation({
        mutationFn: (values: typeof form.values) => {
            if (isEditing) {
                return actualizarUsuarioB2B(usuario.id_usuario_b2b, {
                    nombre_completo: values.nombre_completo,
                    usuario: values.usuario,
                    email: values.email,
                    id_cliente: values.id_cliente,
                });
            } else {
                const payload: CrearUsuarioB2BPayload = {
                    nombre_completo: values.nombre_completo,
                    usuario: values.usuario,
                    email: values.email,
                    password: values.password,
                    id_cliente: values.id_cliente,
                };
                return crearUsuarioB2B(payload);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['usuarios-b2b'] });
            queryClient.invalidateQueries({ queryKey: ['usuarios-b2b-stats'] });
            notifications.show({
                title: isEditing ? 'Usuario Actualizado' : 'Usuario Creado',
                message: `El usuario B2B ha sido ${isEditing ? 'actualizado' : 'creado'} exitosamente.`,
                color: 'green',
            });
            form.reset();
            onSuccess?.();
        },
        onError: (error: any) => {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || error.message || 'Hubo un error al procesar el usuario',
                color: 'red',
            });
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        mutation.mutate(values);
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
                <TextInput
                    label="Nombre Completo"
                    placeholder="Ej: Juan Pérez González"
                    withAsterisk
                    {...form.getInputProps('nombre_completo')}
                />

                <TextInput
                    label="Usuario de Acceso"
                    placeholder="Ej: jperez"
                    withAsterisk
                    description="Nombre de usuario para iniciar sesión"
                    {...form.getInputProps('usuario')}
                />

                <TextInput
                    label="Email"
                    placeholder="ejemplo@empresa.com"
                    type="email"
                    withAsterisk
                    {...form.getInputProps('email')}
                />

                {!isEditing && (
                    <PasswordInput
                        label="Contraseña"
                        placeholder="Mínimo 6 caracteres"
                        withAsterisk
                        description="Contraseña inicial para el usuario B2B"
                        {...form.getInputProps('password')}
                    />
                )}

                {!isEditing && (
                    <ClienteSelect
                        label="Cliente"
                        withAsterisk
                        value={form.values.id_cliente.toString()}
                        onChange={(value) => form.setFieldValue('id_cliente', Number(value))}
                        error={form.errors.id_cliente}
                    />
                )}

                <Button type="submit" fullWidth loading={mutation.isPending}>
                    {isEditing ? 'Actualizar Usuario B2B' : 'Crear Usuario B2B'}
                </Button>
            </Stack>
        </form>
    );
}

