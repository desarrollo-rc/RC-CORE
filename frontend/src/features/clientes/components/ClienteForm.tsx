// frontend/src/features/clientes/components/ClienteForm.tsx
import { useEffect, useState } from 'react';
import { useForm, isNotEmpty } from '@mantine/form';
import { Button, Stack, TextInput, Textarea, NumberInput, Switch, MultiSelect, Tabs, Paper, Group, ActionIcon, Text, Grid, Collapse, Select } from '@mantine/core';
import { IconTrash, IconAlertCircle } from '@tabler/icons-react';
import type { ClienteFormData, Contacto, Direccion } from '../types';
import type { MaestrosData } from '../pages/ClientesPage';
import { getPaises, getRegiones, getCiudades, getComunas } from '../../geografia/services/geografiaService';
import type { Pais, Region, Ciudad, Comuna } from '../../geografia/types';

interface ClienteFormProps {
    onSubmit: (values: ClienteFormData) => void;
    isSubmitting: boolean;
    initialValues: ClienteFormData;
    maestros: MaestrosData;
}

const initialContact: Contacto = { nombre: '', cargo: '', email: '', telefono: '', es_principal: false };
const initialAddress: Direccion = { calle: '', numero: '', id_comuna: null, id_ciudad: null, id_region: null, codigo_postal: '', es_facturacion: false, es_despacho: true };

function DireccionFormSection({ form, index, initialValues }: { form: any, index: number, initialValues: Direccion }) {
    const [paises, setPaises] = useState<Pais[]>([]);
    const [regiones, setRegiones] = useState<Region[]>([]);
    const [ciudades, setCiudades] = useState<Ciudad[]>([]);
    const [comunas, setComunas] = useState<Comuna[]>([]);
    
    const [selectedPais, setSelectedPais] = useState<string | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
    const [selectedCiudad, setSelectedCiudad] = useState<string | null>(null);
    
    useEffect(() => {
        getPaises().then(setPaises);
    }, []);

    useEffect(() => {
        if (selectedPais) {
            getRegiones(Number(selectedPais)).then(setRegiones);
            form.setFieldValue(`direcciones.${index}.id_comuna`, null);
        }
        setCiudades([]);
        setComunas([]);
    }, [selectedPais]);

    useEffect(() => {
        if (selectedRegion) {
            getCiudades(Number(selectedRegion)).then(setCiudades);
            form.setFieldValue(`direcciones.${index}.id_comuna`, null);
            form.setFieldValue(`direcciones.${index}.id_ciudad`, null);
            form.setFieldValue(`direcciones.${index}.id_region`, null);
        }
         setComunas([]);
    }, [selectedRegion]);

    useEffect(() => {
        if (selectedCiudad) {
            getComunas(Number(selectedCiudad)).then(setComunas);
            form.setFieldValue(`direcciones.${index}.id_comuna`, null);
            form.setFieldValue(`direcciones.${index}.id_ciudad`, null);
            form.setFieldValue(`direcciones.${index}.id_region`, null);
        }
    }, [selectedCiudad]);
    
    return (
        <Paper withBorder p="md" mt="sm" key={index}>
            <Group justify="space-between"><Text fw={500}>Dirección #{index + 1}</Text><ActionIcon color="red" onClick={() => form.removeListItem('direcciones', index)}><IconTrash size={16} /></ActionIcon></Group>
            <Grid>
                <Grid.Col span={8}><TextInput withAsterisk label="Calle" {...form.getInputProps(`direcciones.${index}.calle`)} /></Grid.Col>
                <Grid.Col span={4}><TextInput label="Número" {...form.getInputProps(`direcciones.${index}.numero`)} /></Grid.Col>
                <Grid.Col span={6}><Select label="País" data={paises.map(p => ({ value: p.id_pais.toString(), label: p.nombre_pais }))} onChange={setSelectedPais} searchable /></Grid.Col>
                <Grid.Col span={6}><Select label="Región" data={regiones.map(r => ({ value: r.id_region.toString(), label: r.nombre_region }))} disabled={!selectedPais} onChange={setSelectedRegion} searchable /></Grid.Col>
                <Grid.Col span={6}><Select label="Ciudad" data={ciudades.map(c => ({ value: c.id_ciudad.toString(), label: c.nombre_ciudad }))} disabled={!selectedRegion} onChange={setSelectedCiudad} searchable/></Grid.Col>
                <Grid.Col span={6}><Select withAsterisk label="Comuna" data={comunas.map(c => ({ value: c.id_comuna.toString(), label: c.nombre_comuna }))} disabled={!selectedCiudad} searchable {...form.getInputProps(`direcciones.${index}.id_comuna`)} /></Grid.Col>
                <Grid.Col span={6}><TextInput label="Código Postal" {...form.getInputProps(`direcciones.${index}.codigo_postal`)} /></Grid.Col>
            </Grid>
            <Switch mt="sm" label="Dirección de Facturación" {...form.getInputProps(`direcciones.${index}.es_facturacion`, { type: 'checkbox' })} />
            <Switch mt="sm" label="Dirección de Despacho" {...form.getInputProps(`direcciones.${index}.es_despacho`, { type: 'checkbox' })} />
        </Paper>
    );
}

export function ClienteForm({ onSubmit, isSubmitting, initialValues, maestros }: ClienteFormProps) {
    const form = useForm<ClienteFormData>({
        initialValues,
        validate: {
            codigo_cliente: isNotEmpty('El código es requerido'),
            rut_cliente: isNotEmpty('El RUT es requerido'),
            nombre_cliente: isNotEmpty('El nombre es requerido'),
            id_tipo_cliente: isNotEmpty('El tipo de cliente es requerido'),
            id_segmento_cliente: isNotEmpty('El segmento es requerido'),
            id_tipo_negocio: isNotEmpty('El tipo de negocio es requerido'),
            id_lista_precios: isNotEmpty('La lista de precios es requerida'),
            id_condicion_pago: isNotEmpty('La condición de pago es requerida'),
            ids_empresa: (value) => (value.length === 0 ? 'Debe seleccionar al menos una empresa' : null),
            contactos: {
                nombre: isNotEmpty('El nombre es requerido'),
                email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email inválido'),
            },
            direcciones: {
                calle: isNotEmpty('La calle es requerida'),
                id_comuna: isNotEmpty('La comuna es requerida'),
            }
        },
    });

    useEffect(() => {
        form.setValues(initialValues);
    }, [initialValues]);

    const hasGeneralErrors = !!(form.errors.codigo_cliente || form.errors.rut_cliente || form.errors.nombre_cliente);
    const hasComercialErrors = !!(form.errors.id_tipo_cliente || form.errors.id_segmento_cliente || form.errors.id_tipo_negocio || form.errors.id_lista_precios || form.errors.id_condicion_pago || form.errors.ids_empresa);
    const hasContactosErrors = form.errors.contactos && Array.isArray(form.errors.contactos) && form.errors.contactos.some(c => c);
    const hasDireccionesErrors = form.errors.direcciones && Array.isArray(form.errors.direcciones) && form.errors.direcciones.some(d => d);

    // Opciones para los Selects
    const tiposClienteOptions = maestros.tiposCliente.map(tc => ({ value: tc.id_tipo_cliente.toString(), label: tc.nombre_tipo_cliente }));
    const segmentosClienteOptions = maestros.segmentosCliente.map(sc => ({ value: sc.id_segmento_cliente.toString(), label: sc.nombre_segmento_cliente }));
    const tiposNegocioOptions = maestros.tiposNegocio.map(tn => ({ value: tn.id_tipo_negocio.toString(), label: tn.nombre_tipo_negocio }));
    const listasPreciosOptions = maestros.listasPrecios.map(lp => ({ value: lp.id_lista_precios.toString(), label: lp.nombre_lista_precios }));
    const condicionesPagoOptions = maestros.condicionesPago.map(cp => ({ value: cp.id_condicion_pago.toString(), label: cp.nombre_condicion_pago }));
    const empresasOptions = maestros.empresas.map(e => ({ value: e.id_empresa.toString(), label: e.nombre_empresa }));
    const vendedoresOptions = maestros.vendedores.map(v => ({ value: v.id_vendedor.toString(), label: v.usuario.nombre_completo }));
    const marcasOptions = maestros.marcas.map(m => ({ value: m.id_marca.toString(), label: m.nombre_marca }));
    const categoriasOptions = maestros.categorias.map(c => ({ value: c.id_categoria.toString(), label: c.nombre_categoria }));

    const contactoFields = form.values.contactos.map((_, index) => (
        <Paper withBorder p="md" mt="sm" key={index}>
            <Group justify="space-between"><Text fw={500}>Contacto #{index + 1}</Text><ActionIcon color="red" onClick={() => form.removeListItem('contactos', index)}><IconTrash size={16} /></ActionIcon></Group>
            <Grid>
                <Grid.Col span={6}><TextInput withAsterisk label="Nombre" {...form.getInputProps(`contactos.${index}.nombre`)} /></Grid.Col>
                <Grid.Col span={6}><TextInput label="Cargo" {...form.getInputProps(`contactos.${index}.cargo`)} /></Grid.Col>
                <Grid.Col span={6}><TextInput withAsterisk label="Email" {...form.getInputProps(`contactos.${index}.email`)} /></Grid.Col>
                <Grid.Col span={6}><TextInput label="Teléfono" {...form.getInputProps(`contactos.${index}.telefono`)} /></Grid.Col>
            </Grid>
            <Switch mt="sm" label="Contacto Principal" {...form.getInputProps(`contactos.${index}.es_principal`, { type: 'checkbox' })} />
        </Paper>
    ));

    const direccionFields = form.values.direcciones.map((item, index) => (
        <DireccionFormSection key={index} form={form} index={index} initialValues={item} />
    ));

    return (
        <form onSubmit={form.onSubmit(onSubmit)}>
            <Tabs defaultValue="general">
                <Tabs.List>
                    <Tabs.Tab value="general" color={hasGeneralErrors ? 'red' : undefined} leftSection={hasGeneralErrors ? <IconAlertCircle size={16} /> : null}>Información General</Tabs.Tab>
                    <Tabs.Tab value="comercial" color={hasComercialErrors ? 'red' : undefined} leftSection={hasComercialErrors ? <IconAlertCircle size={16} /> : null}>Condiciones Comerciales</Tabs.Tab>
                    <Tabs.Tab value="perfil">Perfilamiento</Tabs.Tab>
                    <Tabs.Tab value="contactos" color={hasContactosErrors ? 'red' : undefined} leftSection={hasContactosErrors ? <IconAlertCircle size={16} /> : null}>Contactos</Tabs.Tab>
                    <Tabs.Tab value="direcciones" color={hasDireccionesErrors ? 'red' : undefined} leftSection={hasDireccionesErrors ? <IconAlertCircle size={16} /> : null}>Direcciones</Tabs.Tab>
                </Tabs.List>

                 <Tabs.Panel value="general" pt="md"><Stack>
                    <TextInput withAsterisk label="Código Cliente" {...form.getInputProps('codigo_cliente')} />
                    <TextInput withAsterisk label="RUT Cliente" {...form.getInputProps('rut_cliente')} />
                    <TextInput withAsterisk label="Nombre Cliente" {...form.getInputProps('nombre_cliente')} />
                    <Textarea label="Giro Económico" {...form.getInputProps('giro_economico')} />
                    <Switch label="Acceso B2B Habilitado" {...form.getInputProps('b2b_habilitado', { type: 'checkbox' })} />
                </Stack></Tabs.Panel>
                
                <Tabs.Panel value="comercial" pt="md"><Stack>
                    <Select withAsterisk label="Tipo de Cliente" data={tiposClienteOptions} searchable {...form.getInputProps('id_tipo_cliente')} />
                    <Select withAsterisk label="Segmento de Cliente" data={segmentosClienteOptions} searchable {...form.getInputProps('id_segmento_cliente')} />
                    <Select withAsterisk label="Tipo de Negocio" data={tiposNegocioOptions} searchable {...form.getInputProps('id_tipo_negocio')} />
                    <Select withAsterisk label="Lista de Precios" data={listasPreciosOptions} searchable {...form.getInputProps('id_lista_precios')} />
                    <Select withAsterisk label="Condición de Pago" data={condicionesPagoOptions} searchable {...form.getInputProps('id_condicion_pago')} />
                    <NumberInput label="Línea de Crédito" {...form.getInputProps('linea_credito')} />
                    <NumberInput label="Descuento Base (%)" {...form.getInputProps('descuento_base')} />
                    <Select label="Vendedor Asignado" data={vendedoresOptions} searchable clearable {...form.getInputProps('id_vendedor')} />
                    <MultiSelect withAsterisk label="Empresas con las que opera" data={empresasOptions} searchable {...form.getInputProps('ids_empresa')} />
                </Stack></Tabs.Panel>

                <Tabs.Panel value="perfil" pt="md"><Stack>
                    <Switch
                        label="Definir especialidades del cliente (Marcas y Categorías)"
                        {...form.getInputProps('definir_afinidad', { type: 'checkbox' })}
                    />
                    <Collapse in={form.values.definir_afinidad}>
                        <MultiSelect label="Marcas de Afinidad" data={marcasOptions} searchable clearable {...form.getInputProps('marcas_afinidad_ids')} />
                        <MultiSelect label="Categorías de Afinidad" data={categoriasOptions} searchable clearable {...form.getInputProps('categorias_afinidad_ids')} mt="md" />
                    </Collapse>
                </Stack></Tabs.Panel>

                <Tabs.Panel value="contactos" pt="md">
                    {contactoFields}
                    <Button mt="md" onClick={() => form.insertListItem('contactos', initialContact)}>Añadir Contacto</Button>
                </Tabs.Panel>

                <Tabs.Panel value="direcciones" pt="md">
                    {direccionFields}
                    <Button mt="md" onClick={() => form.insertListItem('direcciones', { ...initialAddress })}>Añadir Dirección</Button>
                </Tabs.Panel>
            </Tabs>

            <Button type="submit" mt="xl" loading={isSubmitting} fullWidth>
                {isSubmitting ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
        </form>
    );
}