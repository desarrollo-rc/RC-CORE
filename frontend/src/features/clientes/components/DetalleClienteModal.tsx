// frontend/src/features/clientes/components/DetalleClienteModal.tsx
import { Modal, Stack, Group, Text, Badge, Grid, Card, Tabs, Table, Avatar, Chip } from '@mantine/core';
import type { Cliente } from '../types';

interface DetalleClienteModalProps {
    opened: boolean;
    onClose: () => void;
    record: Cliente | null;
}

export function DetalleClienteModal({ opened, onClose, record }: DetalleClienteModalProps) {
    if (!record) return null;

    return (
        <Modal opened={opened} onClose={onClose} title={`Ficha de Cliente`} size="xl">
            <Stack>
                <Card withBorder p="md" radius="md">
                    <Group justify="space-between" align="flex-start">
                        <Group>
                            <Avatar radius="md" color="blue" variant="light" size={48}>{record.nombre_cliente?.slice(0,1) || 'C'}</Avatar>
                            <Stack gap={0}>
                                <Text fw={600}>{record.nombre_cliente}</Text>
                                <Text size="sm" c="dimmed">Código: {record.codigo_cliente}</Text>
                            </Stack>
                        </Group>
                        <Group gap="xs">
                            <Badge color={record.activo ? 'green' : 'gray'}>{record.activo ? 'Activo' : 'Inactivo'}</Badge>
                            {record.b2b_habilitado && <Badge color="blue">B2B</Badge>}
                        </Group>
                    </Group>
                </Card>

                <Grid>
                    <Grid.Col span={6}>
                        <Card withBorder p="md" radius="md">
                            <Text fw={600} mb={8}>Resumen</Text>
                            <Table withTableBorder>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">RUT</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.rut_cliente}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td width="30%"><Text size="sm" c="dimmed">Giro</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.giro_economico || '-'}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Vendedor</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.vendedor?.usuario.nombre_completo || 'Sin Asignar'}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Empresas</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.empresas?.length ? record.empresas.map(e => e.nombre_empresa).join(', ') : '-'}</Text></Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Card>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Card withBorder p="md" radius="md">
                            <Text fw={600} mb={8}>Condiciones Comerciales</Text>
                            <Table withTableBorder>
                                <Table.Tbody>
                                    <Table.Tr>
                                        <Table.Td width="35%"><Text size="sm" c="dimmed">Segmento</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.segmento_cliente.nombre_segmento_cliente}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Tipo Cliente</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.tipo_cliente.nombre_tipo_cliente}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Tipo Negocio</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.tipo_negocio.nombre_tipo_negocio}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Lista de Precios</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.lista_precios.nombre_lista_precios}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Condición de Pago</Text></Table.Td>
                                        <Table.Td><Text size="sm">{record.condicion_pago.nombre_condicion_pago}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Línea de Crédito</Text></Table.Td>
                                        <Table.Td><Text size="sm">{String(record.linea_credito ?? '-')}</Text></Table.Td>
                                    </Table.Tr>
                                    <Table.Tr>
                                        <Table.Td><Text size="sm" c="dimmed">Descuento Base</Text></Table.Td>
                                        <Table.Td><Text size="sm">{String(record.descuento_base ?? '-')}</Text></Table.Td>
                                    </Table.Tr>
                                </Table.Tbody>
                            </Table>
                        </Card>
                    </Grid.Col>
                </Grid>

                {(record.marcas_afinidad?.length || record.categorias_afinidad?.length) ? (
                    <Card withBorder p="md" radius="md">
                        <Text fw={600} mb={8}>Afinidad</Text>
                        <Grid>
                            <Grid.Col span={6}>
                                <Text size="sm" c="dimmed" mb={6}>Categorías</Text>
                                <Group gap="xs" wrap="wrap">
                                    {record.categorias_afinidad?.length ? (
                                        record.categorias_afinidad.map((c, i) => (
                                            <Chip key={`c-${i}`} checked color="teal" readOnly>{c.nombre_categoria}</Chip>
                                        ))
                                    ) : (
                                        <Text size="sm" c="dimmed">Sin categorías</Text>
                                    )}
                                </Group>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Text size="sm" c="dimmed" mb={6}>Marcas</Text>
                                <Group gap="xs" wrap="wrap">
                                    {record.marcas_afinidad?.length ? (
                                        record.marcas_afinidad.map((m, i) => (
                                            <Chip key={`m-${i}`} checked readOnly>{m.nombre_marca}</Chip>
                                        ))
                                    ) : (
                                        <Text size="sm" c="dimmed">Sin marcas</Text>
                                    )}
                                </Group>
                            </Grid.Col>
                        </Grid>
                    </Card>
                ) : null}

                <Tabs defaultValue="contactos">
                    <Tabs.List>
                        <Tabs.Tab value="contactos">Contactos</Tabs.Tab>
                        <Tabs.Tab value="direcciones">Direcciones</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="contactos" pt="md">
                        <Card withBorder p="md" radius="md">
                            {record.contactos.length === 0 ? (
                                <Text size="sm" c="dimmed">Sin contactos</Text>
                            ) : (
                                <Table striped withTableBorder>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Nombre</Table.Th>
                                            <Table.Th>Email</Table.Th>
                                            <Table.Th>Teléfono</Table.Th>
                                            <Table.Th>Principal</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {record.contactos.map((c, i) => (
                                            <Table.Tr key={i}>
                                                <Table.Td>{c.nombre}</Table.Td>
                                                <Table.Td>{c.email}</Table.Td>
                                                <Table.Td>{c.telefono || '-'}</Table.Td>
                                                <Table.Td>{c.es_principal ? 'Sí' : 'No'}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Card>
                    </Tabs.Panel>

                    <Tabs.Panel value="direcciones" pt="md">
                        <Card withBorder p="md" radius="md">
                            {record.direcciones.length === 0 ? (
                                <Text size="sm" c="dimmed">Sin direcciones</Text>
                            ) : (
                                <Table striped withTableBorder>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Calle</Table.Th>
                                            <Table.Th>Número</Table.Th>
                                            <Table.Th>Comuna</Table.Th>
                                            <Table.Th>Código Postal</Table.Th>
                                            <Table.Th>Facturación</Table.Th>
                                            <Table.Th>Despacho</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {record.direcciones.map((d, i) => (
                                            <Table.Tr key={i}>
                                                <Table.Td>{d.calle}</Table.Td>
                                                <Table.Td>{d.numero || '-'}</Table.Td>
                                                <Table.Td>#{d.id_comuna}</Table.Td>
                                                <Table.Td>{d.codigo_postal || '-'}</Table.Td>
                                                <Table.Td>{d.es_facturacion ? 'Sí' : 'No'}</Table.Td>
                                                <Table.Td>{d.es_despacho ? 'Sí' : 'No'}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </Card>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Modal>
    );
}


