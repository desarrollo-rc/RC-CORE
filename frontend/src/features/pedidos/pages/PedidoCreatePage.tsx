// frontend/src/features/pedidos/pages/PedidoCreatePage.tsx
import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Group, Button, Paper, SimpleGrid, TextInput, NumberInput, ActionIcon, Text, Alert, Switch, Table, TableThead, TableTbody, TableTr, TableTh, TableTd, Divider, Stack } from '@mantine/core';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { createPedido } from '../services/pedidoService';
import type { PedidoPayload } from '../types';
import { useState, useEffect } from 'react';
// Asumimos que tienes componentes reusables para seleccionar entidades
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { CanalVentaSelect } from '../../canales-venta/components/CanalVentaSelect';
import { ProductoSelectWithCreate } from '../components/ProductoSelectWithCreate';
import type { Producto } from '../../productos/types';
import { getAllProductos } from '../../productos/services/productoService';


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
    // Removed selectedProductIds as we don't filter products in the add selector

    const { control, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormValues>({
        resolver: zodResolver(validationSchema) as any,
        defaultValues: {
            id_cliente: '',
            id_canal_venta: '',
            codigo_pedido_origen: '',
            aprobacion_automatica: false,
            numero_pedido_sap: '',
            fecha_evento: new Date(),
            detalles: []
        }
    });

    // Removed selectedProductIds tracking as we don't filter products in the add selector

    const { fields, append, remove } = useFieldArray<FormValues, 'detalles'>({
        control,
        name: "detalles"
    });

    const [productById, setProductById] = useState<Record<number, { sku: string; nombre: string }>>({});

    useEffect(() => {
        (async () => {
            try {
                const prods = await getAllProductos();
                const map: Record<number, { sku: string; nombre: string }> = {};
                for (const p of prods) {
                    map[p.id_producto] = { sku: p.sku, nombre: p.nombre_producto || 'Producto sin nombre' };
                }
                setProductById(map);
            } catch {
                // silencioso
            }
        })();
    }, []);

    const handleProductCreated = (producto: Producto) => {
        console.log('Product created:', producto.id_producto);
        // Actualizar el mapa para mostrar SKU/nombre
        setProductById(prev => ({ ...prev, [producto.id_producto]: { sku: producto.sku, nombre: producto.nombre_producto || 'Producto sin nombre' } }));
    };

    // Campos temporales para agregar un detalle
    const newIdProducto = watch('new_id_producto' as any) as string | undefined;
    const newCantidad = watch('new_cantidad' as any) as number | undefined;
    const newPrecio = watch('new_precio' as any) as number | undefined;

    const addNewDetalle = () => {
        if (!newIdProducto || !newCantidad || newCantidad <= 0 || newPrecio == null || newPrecio < 0) return;
        append({ id_producto: newIdProducto, cantidad: newCantidad, precio_unitario: newPrecio } as any);
        // Limpiar todos los campos del formulario de agregar
        setValue('new_id_producto' as any, '');
        setValue('new_cantidad' as any, 1);
        setValue('new_precio' as any, 0);
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
                            const currentDate = field.value instanceof Date && !isNaN(field.value.getTime())
                                ? field.value
                                : new Date();

                            const valueForInput = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

                            const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                const str = e.currentTarget.value; // YYYY-MM-DD
                                if (!str) return;
                                const [yyyy, mm, dd] = str.split('-').map(Number);
                                // conserva la hora/minutos actuales del campo
                                const newDate = new Date(yyyy, (mm || 1) - 1, dd || 1, currentDate.getHours(), currentDate.getMinutes(), 0, 0);
                                field.onChange(newDate);
                            };

                            const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
                            const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                                const [hh, mm] = e.currentTarget.value.split(':');
                                const newDate = new Date(currentDate);
                                newDate.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0);
                                field.onChange(newDate);
                            };

                            return (
                                <Group grow mt="md">
                                    <TextInput
                                        type="date"
                                        label="Fecha de Creación del Pedido"
                                        value={valueForInput}
                                        onChange={handleDateChange}
                                        required
                                    />
                                    <TextInput
                                        type="time"
                                        label="Hora de Creación"
                                        value={timeValue}
                                        onChange={handleTimeChange}
                                        required
                                    />
                                </Group>
                            );
                        }}
                    />

                    <Title order={4} mt="xl" mb="md">Productos del Pedido</Title>

                    <Paper withBorder p="md" mb="md">
                        <Stack gap="sm">
                            <Group grow>
                                <ProductoSelectWithCreate
                                    control={control}
                                    name={"new_id_producto" as any}
                                    label="Producto"
                                    selectedProductIds={[]} // No filtrar productos en el selector de agregar
                                    onProductCreated={handleProductCreated}
                                />
                                <Controller
                                    name={"new_cantidad" as any}
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput
                                            label="Cantidad"
                                            placeholder="Cantidad"
                                            min={1}
                                            {...field}
                                        />
                                    )}
                                />
                                <Controller
                                    name={"new_precio" as any}
                                    control={control}
                                    render={({ field }) => (
                                        <NumberInput
                                            label="Precio Unitario"
                                            placeholder="Precio"
                                            min={0}
                                            decimalScale={2}
                                            prefix="$"
                                            {...field}
                                        />
                                    )}
                                />
                                <Button mt={22} onClick={addNewDetalle} leftSection={<IconPlus size={14} />}>Agregar</Button>
                            </Group>
                        </Stack>
                    </Paper>

                    <Table withTableBorder mb="md">
                        <TableThead>
                            <TableTr>
                                <TableTh>#</TableTh>
                                <TableTh>SKU</TableTh>
                                <TableTh>Nombre</TableTh>
                                <TableTh ta="right">Cantidad</TableTh>
                                <TableTh ta="right">Precio Unitario</TableTh>
                                <TableTh ta="right">Subtotal</TableTh>
                                <TableTh ta="right">Acciones</TableTh>
                            </TableTr>
                        </TableThead>
                        <TableTbody>
                            {fields.length === 0 ? (
                                <TableTr>
                                    <TableTd colSpan={7}><Text c="dimmed">Aún no hay productos agregados.</Text></TableTd>
                                </TableTr>
                            ) : (
                                fields.map((item, index) => {
                                    const idStr = watch(`detalles.${index}.id_producto`) as unknown as string;
                                    const idNum = parseInt(idStr || '0', 10);
                                    const cantidad = watch(`detalles.${index}.cantidad`) || 0;
                                    const precioUnitario = watch(`detalles.${index}.precio_unitario`) || 0;
                                    const subtotal = cantidad * precioUnitario;
                                    const meta = productById[idNum];
                                    return (
                                        <TableTr key={item.id}>
                                            <TableTd>{index + 1}</TableTd>
                                            <TableTd>{meta?.sku || idStr || '-'}</TableTd>
                                            <TableTd>{meta?.nombre || '-'}</TableTd>
                                            <TableTd ta="right">{cantidad}</TableTd>
                                            <TableTd ta="right">${Math.round(precioUnitario).toLocaleString('es-CL')}</TableTd>
                                            <TableTd ta="right">${Math.round(subtotal).toLocaleString('es-CL')}</TableTd>
                                            <TableTd ta="right">
                                                <ActionIcon color="red" onClick={() => remove(index)}>
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </TableTd>
                                        </TableTr>
                                    );
                                })
                            )}
                        </TableTbody>
                    </Table>

                    {(() => {
                        const sum = fields.reduce((acc, _, index) => {
                            const cantidad = watch(`detalles.${index}.cantidad`) || 0;
                            const precioUnitario = watch(`detalles.${index}.precio_unitario`) || 0;
                            return acc + cantidad * precioUnitario;
                        }, 0);
                        const neto = Math.round(sum);
                        const iva = Math.round(neto * 0.19);
                        const total = neto + iva;
                        return (
                            <Group justify="flex-end" mt="sm">
                                <Stack gap={4} ta="right">
                                    <Group justify="space-between" gap="xl">
                                        <Text>Subtotal (Neto):</Text>
                                        <Text fw={600}>${neto.toLocaleString('es-CL')}</Text>
                                    </Group>
                                    <Group justify="space-between" gap="xl">
                                        <Text>IVA (19%):</Text>
                                        <Text fw={600}>${iva.toLocaleString('es-CL')}</Text>
                                    </Group>
                                    <Divider my={4} />
                                    <Group justify="space-between" gap="xl">
                                        <Text>Total:</Text>
                                        <Text fw={700}>${total.toLocaleString('es-CL')}</Text>
                                    </Group>
                                </Stack>
                            </Group>
                        );
                    })()}

                    {errors.detalles?.message && <Text c="red" size="sm" mt="sm">{errors.detalles.message}</Text>}

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={() => navigate('/pedidos')}>Cancelar</Button>
                        <Button type="submit" loading={isSubmitting}>Guardar Seguimiento</Button>
                    </Group>
                </form>
            </Paper>
        </Box>
    );
}