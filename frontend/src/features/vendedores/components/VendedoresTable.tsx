// frontend/src/features/vendedores/components/VendedoresTable.tsx
import React, { useState } from 'react';
import { Table, Button, Modal, Textarea, Group, ActionIcon, Tooltip, Badge, Text } from '@mantine/core';
import { IconMessageCircle, IconPencil, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import type { Vendedor } from '../types';
import { enviarWhatsappVendedor } from '../services/vendedorService';

interface VendedoresTableProps {
    records: Vendedor[];
    onEdit: (record: Vendedor) => void;
    onDeactivate: (record: Vendedor) => void;
    onActivate: (record: Vendedor) => void;
}

export function VendedoresTable({ records, onEdit, onDeactivate, onActivate }: VendedoresTableProps) {
    const queryClient = useQueryClient();
    const [modalOpened, setModalOpened] = useState(false);
    const [selectedVendedor, setSelectedVendedor] = useState<Vendedor | null>(null);
    const [mensaje, setMensaje] = useState('');

    const sendMessageMutation = useMutation({
        mutationFn: () => {
            if (!selectedVendedor) throw new Error("No hay vendedor seleccionado");
            return enviarWhatsappVendedor(selectedVendedor.id_vendedor, mensaje);
        },
        onSuccess: () => {
            notifications.show({
                title: 'Éxito',
                message: `Mensaje enviado a ${selectedVendedor?.usuario.nombre_completo}`,
                color: 'green',
            });
            closeModal();
        },
        onError: (error) => {
            notifications.show({
                title: 'Error',
                message: error.message || 'No se pudo enviar el mensaje',
                color: 'red',
            });
        },
    });

    const handleOpenModal = (vendedor: Vendedor) => {
        setSelectedVendedor(vendedor);
        setModalOpened(true);
    };

    const closeModal = () => {
        setModalOpened(false);
        setSelectedVendedor(null);
        setMensaje('');
    }

    const rows = records.map((record) => (
        <Table.Tr key={record.id_vendedor}>
            <Table.Td>{record.usuario.nombre_completo}</Table.Td>
            <Table.Td>{record.usuario.email}</Table.Td>
            <Table.Td>{record.codigo_vendedor_sap || 'N/A'}</Table.Td>
            <Table.Td>
                <Badge color={record.activo ? 'green' : 'gray'}>
                    {record.activo ? 'Activo' : 'Inactivo'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs" justify="flex-end">
                    <Tooltip label="Editar Código SAP"><ActionIcon variant="light" onClick={() => onEdit(record)}><IconPencil size={16} /></ActionIcon></Tooltip>
                    {record.activo ? (
                        <Tooltip label="Desactivar"><ActionIcon variant="light" color="red" onClick={() => onDeactivate(record)}><IconPlayerPause size={16} /></ActionIcon></Tooltip>
                    ) : (
                        <Tooltip label="Activar"><ActionIcon variant="light" color="green" onClick={() => onActivate(record)}><IconPlayerPlay size={16} /></ActionIcon></Tooltip>
                    )}
                    <Tooltip label="Enviar WhatsApp">
                        <ActionIcon variant="light" size="lg" onClick={() => handleOpenModal(record)}>
                            <IconMessageCircle size={20} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <>
            <Table striped highlightOnHover withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Nombre Completo</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Código SAP</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {rows.length > 0 ? rows : <Table.Tr><Table.Td colSpan={5}><Text c="dimmed" ta="center">No se encontraron vendedores.</Text></Table.Td></Table.Tr>}
                </Table.Tbody>
            </Table>
            <Modal
                opened={modalOpened}
                onClose={closeModal}
                title={`Enviar WhatsApp a ${selectedVendedor?.usuario.nombre_completo}`}
            >
                <Textarea
                    label="Mensaje"
                    placeholder="Escribe tu mensaje aquí..."
                    value={mensaje}
                    onChange={(event) => setMensaje(event.currentTarget.value)}
                    minRows={4}
                    autosize
                />
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closeModal}>Cancelar</Button>
                    <Button
                        onClick={() => sendMessageMutation.mutate()}
                        loading={sendMessageMutation.isPending}
                    >
                        Enviar Mensaje
                    </Button>
                </Group>
            </Modal>
        </>
    );
}