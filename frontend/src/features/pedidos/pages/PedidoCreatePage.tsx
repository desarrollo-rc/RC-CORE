// frontend/src/features/pedidos/pages/PedidoCreatePage.tsx
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Group, Button, Paper, SimpleGrid, TextInput, NumberInput, ActionIcon, Text, Alert, Switch } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { createPedido } from '../services/pedidoService';
import type { PedidoPayload } from '../types';
import { useState } from 'react';
// Asumimos que tienes componentes reusables para seleccionar entidades
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { CanalVentaSelect } from '../../canales-venta/components/CanalVentaSelect';
import { ProductoSelect } from '../../productos/components/ProductoSelect';


// Esquema de validación con Zod
const validationSchema = z.object({
  id_cliente: z.string().min(1, { message: 'Debe seleccionar un cliente' }),
  id_canal_venta: z.string().min(1, { message: 'Debe seleccionar un canal de venta' }),
  codigo_pedido_origen: z.string().optional(),
  aprobacion_automatica: z.boolean(),
  detalles: z.array(
    z.object({
      id_producto: z.string().min(1, { message: 'Debe seleccionar un producto' }),
      cantidad: z.number().min(1, { message: 'La cantidad debe ser al menos 1' }),
    })
  ).min(1, { message: 'El pedido debe tener al menos un producto' }),
});

type FormValues = z.infer<typeof validationSchema>;

export function PedidoCreatePage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(validationSchema) as any,
        defaultValues: {
            id_cliente: '',
            id_canal_venta: '',
            codigo_pedido_origen: '',
            aprobacion_automatica: false,
            detalles: [{ id_producto: '', cantidad: 1 }]
        }
    });

    const { fields, append, remove } = useFieldArray<FormValues, 'detalles'>({
        control,
        name: "detalles"
    });

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setError(null);
        const payload: PedidoPayload = {
            id_cliente: parseInt(data.id_cliente, 10),
            id_canal_venta: parseInt(data.id_canal_venta, 10),
            codigo_pedido_origen: data.codigo_pedido_origen || undefined,
            aprobacion_automatica: data.aprobacion_automatica,
            detalles: data.detalles.map(d => ({
                id_producto: parseInt(d.id_producto, 10),
                cantidad: d.cantidad,
            }))
        };
        
        try {
            await createPedido(payload);
            navigate('/pedidos');
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Error al crear el pedido. Revise los datos e intente nuevamente.';
            setError(errorMsg);
        }
    };

    return (
        <Box>
            <Title order={2} mb="xl">Crear Seguimiento de Pedido</Title>
            <Paper withBorder shadow="md" p={30} radius="md">
                <form onSubmit={handleSubmit(onSubmit as any)}>
                    {error && <Alert color="red" title="Error en el envío" mb="lg">{error}</Alert>}
                    
                    <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
                        <ClienteSelect
                            control={control}
                            name="id_cliente"
                            label="Cliente"
                            error={errors.id_cliente?.message}
                        />
                         <CanalVentaSelect
                            control={control}
                            name="id_canal_venta"
                            label="Canal de Venta"
                            error={errors.id_canal_venta?.message}
                        />
                        <Controller
                            name="codigo_pedido_origen"
                            control={control}
                            render={({ field }) => (
                                <TextInput label="Código Pedido Origen (Opcional)" placeholder="Ej: B2B-12345" {...field} />
                            )}
                        />
                        <Controller
                            name="aprobacion_automatica"
                            control={control}
                            render={({ field }) => (
                                <Switch
                                    label="Aprobación Automática (cliente con cupo)"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    mt="xl"
                                />
                            )}
                        />
                    </SimpleGrid>

                    <Title order={4} mt="xl" mb="md">Productos del Pedido</Title>

                    {fields.map((item, index) => (
                        <Group key={item.id} mb="xs" grow align="flex-start">
                            <ProductoSelect
                                control={control}
                                name={`detalles.${index}.id_producto`}
                                error={errors.detalles?.[index]?.id_producto?.message}
                            />
                            <Controller
                                name={`detalles.${index}.cantidad`}
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        placeholder="Cantidad"
                                        min={1}
                                        {...field}
                                        error={errors.detalles?.[index]?.cantidad?.message}
                                    />
                                )}
                            />
                            <ActionIcon color="red" onClick={() => remove(index)} mt={5}>
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Group>
                    ))}
                    
                    {errors.detalles?.message && <Text c="red" size="sm" mt="sm">{errors.detalles.message}</Text>}

                    <Button
                        mt="md"
                        leftSection={<IconPlus size={14} />}
                        variant="light"
                        onClick={() => append({ id_producto: '', cantidad: 1 })}
                    >
                        Agregar Producto
                    </Button>

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={() => navigate('/pedidos')}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting}>Guardar Seguimiento</Button>
                    </Group>
                </form>
            </Paper>
        </Box>
    );
}