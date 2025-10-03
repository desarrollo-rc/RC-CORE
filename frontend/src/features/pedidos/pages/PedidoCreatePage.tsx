// frontend/src/features/pedidos/pages/PedidoCreatePage.tsx
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { DateInput, TimeInput } from '@mantine/dates';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Group, Button, Paper, SimpleGrid, TextInput, NumberInput, ActionIcon, Text, Alert, Switch, Table, TableThead, TableTbody, TableTr, TableTh, TableTd } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { createPedido } from '../services/pedidoService';
import type { PedidoPayload } from '../types';
import { useState, useEffect } from 'react';
// Asumimos que tienes componentes reusables para seleccionar entidades
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { CanalVentaSelect } from '../../canales-venta/components/CanalVentaSelect';
import { ProductoSelectWithCreate } from '../components/ProductoSelectWithCreate';
import type { Producto } from '../../productos/types';


// Esquema de validación con Zod
const validationSchema = z.object({
    id_cliente: z.string().min(1, { message: 'Debe seleccionar un cliente' }),
    id_canal_venta: z.string().min(1, { message: 'Debe seleccionar un canal de venta' }),
    codigo_pedido_origen: z.string().optional(),
    aprobacion_automatica: z.boolean(),
    numero_pedido_sap: z.string().optional(),
    fecha_evento: z.coerce.date(),
    detalles: z.array(
        z.object({
            id_producto: z.string().min(1, { message: 'Debe seleccionar un producto' }),
            cantidad: z.number().min(1, { message: 'La cantidad debe ser al menos 1' }),
            precio_unitario: z.number().min(0, { message: 'El precio debe ser mayor o igual a 0' }),
        })
    ).min(1, { message: 'El pedido debe tener al menos un producto' }),
}).superRefine((val, ctx) => {
    if (val.aprobacion_automatica && (!val.numero_pedido_sap || val.numero_pedido_sap.trim() === '')) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['numero_pedido_sap'],
            message: 'Requerido cuando hay aprobación automática',
        });
    }
});

type FormValues = z.infer<typeof validationSchema>;

export function PedidoCreatePage() {
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

    const { control, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormValues>({
        resolver: zodResolver(validationSchema) as any,
        defaultValues: {
            id_cliente: '',
            id_canal_venta: '',
            codigo_pedido_origen: '',
            aprobacion_automatica: false,
            numero_pedido_sap: '',
            fecha_evento: new Date(),
            detalles: [{ id_producto: '', cantidad: 1, precio_unitario: 0 }]
        }
    });

    // Observar cambios en los detalles para actualizar la lista de productos seleccionados
    const detalles = watch('detalles');
    
    // Actualizar la lista cuando cambien los detalles
    useEffect(() => {
        const currentSelectedIds = detalles
            .map(d => d.id_producto ? parseInt(d.id_producto, 10) : null)
            .filter((id): id is number => id !== null);
        console.log('Updating selected product IDs from form:', currentSelectedIds);
        setSelectedProductIds(currentSelectedIds);
    }, [detalles]);

    const { fields, append, remove } = useFieldArray<FormValues, 'detalles'>({
        control,
        name: "detalles"
    });

    const handleProductCreated = (producto: Producto) => {
        console.log('Product created, updating selected list:', producto.id_producto);
        // Actualizar la lista de productos seleccionados
        setSelectedProductIds(prev => {
            const newList = [...prev, producto.id_producto];
            console.log('Updated selected product IDs:', newList);
            return newList;
        });
    };

    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        setError(null);
        const payload: PedidoPayload = {
            id_cliente: parseInt(data.id_cliente, 10),
            id_canal_venta: parseInt(data.id_canal_venta, 10),
            codigo_pedido_origen: data.codigo_pedido_origen || undefined,
            aprobacion_automatica: data.aprobacion_automatica,
            numero_pedido_sap: data.aprobacion_automatica ? (data.numero_pedido_sap || undefined) : undefined,
            fecha_evento: data.fecha_evento.toISOString(),
            detalles: data.detalles.map(d => ({
                id_producto: parseInt(d.id_producto, 10),
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
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
                        {watch('aprobacion_automatica') && (
                            <Controller
                                name="numero_pedido_sap"
                                control={control}
                                render={({ field }) => (
                                    <TextInput
                                        label="Número de Orden SAP"
                                        placeholder="Ingrese Nº de Orden SAP"
                                        {...field}
                                        error={errors.numero_pedido_sap?.message}
                                        required
                                    />
                                )}
                            />
                        )}
                    </SimpleGrid>

                    <Controller
                        name="fecha_evento"
                        control={control}
                        render={({ field }) => {
                            // Nos aseguramos de que 'currentDate' sea siempre un objeto Date válido.
                            const currentDate = field.value instanceof Date && !isNaN(field.value.getTime())
                                ? field.value
                                : new Date();

                            // Esta función se activa SOLO cuando cambia la fecha (día, mes, año).
                            // Mantiene la hora que ya estaba seleccionada.
                            const handleDatePartChange = (valueFromInput: Date | string | null) => {
                                if (!valueFromInput) return;
                            
                                let year, month, day;
                            
                                // --- AQUÍ ESTÁ LA LÓGICA CLAVE ---
                                // Verificamos si el input nos da un string (ej: "2025-10-08") o un objeto Date
                                if (typeof valueFromInput === 'string') {
                                    // Si es un string, lo separamos para evitar la conversión automática a UTC.
                                    const parts = valueFromInput.split(/[-/]/); // Funciona con '-' o '/'
                                    year = parseInt(parts[0], 10);
                                    month = parseInt(parts[1], 10) - 1; // ¡Importante! El mes en new Date() es 0-indexado (Enero=0)
                                    day = parseInt(parts[2], 10);
                                } else {
                                    // Si ya es un objeto Date, podemos usar sus métodos de forma segura.
                                    year = valueFromInput.getFullYear();
                                    month = valueFromInput.getMonth();
                                    day = valueFromInput.getDate();
                                }
                                
                                // Nos aseguramos de que las partes de la fecha sean números válidos
                                if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                                    // Reconstruimos la fecha completa manteniendo la hora que ya estaba seleccionada.
                                    // Al construirla con sus partes, forzamos que sea en la zona horaria local.
                                    const newFullDate = new Date(
                                        year,
                                        month,
                                        day,
                                        currentDate.getHours(),
                                        currentDate.getMinutes()
                                    );
                                    field.onChange(newFullDate);
                                }
                            };
                            
                            // Esta función se activa SOLO cuando cambia la hora.
                            // Mantiene la fecha que ya estaba seleccionada.
                            const handleTimePartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                const [hours, minutes] = e.currentTarget.value.split(':');
                                const newFullDate = new Date(currentDate);
                                newFullDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                field.onChange(newFullDate);
                            };

                            // Formateamos la hora al formato 'HH:mm' para el input.
                            const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

                            return (
                                <Group grow mt="md">
                                    <DateInput
                                        label="Fecha de Creación del Pedido"
                                        value={currentDate}
                                        onChange={(val) => handleDatePartChange(val as unknown as Date | null)}
                                        required
                                    />
                                    <TimeInput
                                        label="Hora de Creación"
                                        value={timeValue}
                                        onChange={handleTimePartChange}
                                        required
                                    />
                                </Group>
                            );
                        }}
                    />

                    <Title order={4} mt="xl" mb="md">Productos del Pedido</Title>

                    {fields.length > 0 && (
                        <Table withTableBorder mb="md">
                            <TableThead>
                                <TableTr>
                                    <TableTh>Producto</TableTh>
                                    <TableTh>Cantidad</TableTh>
                                    <TableTh>Precio Unitario</TableTh>
                                    <TableTh>Subtotal</TableTh>
                                    <TableTh>Acciones</TableTh>
                                </TableTr>
                            </TableThead>
                            <TableTbody>
                                {fields.map((item, index) => {
                                    const cantidad = watch(`detalles.${index}.cantidad`) || 0;
                                    const precioUnitario = watch(`detalles.${index}.precio_unitario`) || 0;
                                    const subtotal = cantidad * precioUnitario;
                                    
                                    return (
                                        <TableTr key={item.id}>
                                            <TableTd>
                                                <ProductoSelectWithCreate
                                                    control={control}
                                                    name={`detalles.${index}.id_producto`}
                                                    error={errors.detalles?.[index]?.id_producto?.message}
                                                    selectedProductIds={selectedProductIds}
                                                    onProductCreated={handleProductCreated}
                                                />
                                            </TableTd>
                                            <TableTd>
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
                                            </TableTd>
                                            <TableTd>
                                                <Controller
                                                    name={`detalles.${index}.precio_unitario`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <NumberInput
                                                            placeholder="Precio"
                                                            min={0}
                                                            decimalScale={2}
                                                            prefix="$"
                                                            {...field}
                                                            error={errors.detalles?.[index]?.precio_unitario?.message}
                                                        />
                                                    )}
                                                />
                                            </TableTd>
                                            <TableTd>
                                                <Text fw={500}>
                                                    ${subtotal.toLocaleString('es-CL')}
                                                </Text>
                                            </TableTd>
                                            <TableTd>
                                                <ActionIcon color="red" onClick={() => remove(index)}>
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </TableTd>
                                        </TableTr>
                                    );
                                })}
                            </TableTbody>
                        </Table>
                    )}

                    {errors.detalles?.message && <Text c="red" size="sm" mt="sm">{errors.detalles.message}</Text>}

                    <Button
                        mt="md"
                        leftSection={<IconPlus size={14} />}
                        variant="light"
                        onClick={() => append({ id_producto: '', cantidad: 1, precio_unitario: 0 })}
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