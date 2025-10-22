import { useState, useEffect } from 'react';
import { Box, Title, Button, Group, Modal, TextInput, Select, Collapse, Paper, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconFilter, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { InstalacionesList } from '../components/InstalacionesList';
import { InstallationRequestForm } from '../components/InstallationRequestForm';
import { getTiposCaso } from '../../tipos-caso/services/tipoCasoService';
import { getUsuariosB2B } from '../../usuarios-b2b/services/usuarioB2BService';
import { fetchAllClientes } from '../../clientes/services/clienteService';
import { getVendedores } from '../../vendedores/services/vendedorService';
import type { InstalacionFilters } from '../types';
import type { TipoCaso } from '../../tipos-caso/types';
import type { UsuarioB2B } from '../../usuarios-b2b/types';
import type { Cliente } from '../../clientes/types';
import type { Vendedor } from '../../vendedores/types';

export function InstalacionesPage() {
  const [modalOpened, { open, close }] = useDisclosure(false);
  const [filters, setFilters] = useState<InstalacionFilters>({ page: 1, per_page: 15 });
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(true);
  const [, setTiposCaso] = useState<TipoCaso[]>([]);
  const [, setUsuariosB2B] = useState<UsuarioB2B[]>([]);
  const [, setClientes] = useState<Cliente[]>([]);
  const [, setVendedores] = useState<Vendedor[]>([]);
  const [tipoCasoOptions, setTipoCasoOptions] = useState<{ value: string; label: string }[]>([]);
  const [usuarioB2BOptions, setUsuarioB2BOptions] = useState<{ value: string; label: string }[]>([]);
  const [clienteOptions, setClienteOptions] = useState<{ value: string; label: string }[]>([]);
  const [vendedorOptions, setVendedorOptions] = useState<{ value: string; label: string }[]>([]);

  // Cargar opciones para los filtros
  useEffect(() => {
    (async () => {
      try {
        const [tiposCasoResp, usuariosB2BResp, clientesResp, vendedoresResp] = await Promise.all([
          getTiposCaso(),
          getUsuariosB2B(),
          fetchAllClientes(),
          getVendedores(),
        ]);
        setTiposCaso(tiposCasoResp);
        setUsuariosB2B(usuariosB2BResp);
        setClientes(clientesResp);
        setVendedores(vendedoresResp);
        setTipoCasoOptions(
          tiposCasoResp.map(t => ({ value: t.id_tipo_caso.toString(), label: t.nombre_tipo_caso }))
        );
        setUsuarioB2BOptions(
          usuariosB2BResp.map(u => ({ value: u.id_usuario_b2b.toString(), label: u.nombre_completo }))
        );
        setClienteOptions(
          clientesResp.map(c => ({ value: c.id_cliente.toString(), label: c.nombre_cliente }))
        );
        setVendedorOptions(
          vendedoresResp.map(v => ({ value: v.id_vendedor.toString(), label: v.usuario?.nombre_completo || 'Sin nombre' }))
        );
      } catch (e) {
        // silencio: filtros siguen funcionando manualmente
      }
    })();
  }, []);

  const handlePageChange = (newPage: number) => {
    setFilters(currentFilters => ({ ...currentFilters, page: newPage }));
  };

  return (
    <Box>
      <Group justify="space-between" mb="xl">
        <Title order={2}>Instalaciones</Title>
        <Group>
          <Button
            variant="outline"
            leftSection={<IconFilter size={16} />}
            rightSection={filtersOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            onClick={toggleFilters}
          >
            {filtersOpened ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button leftSection={<IconPlus size={18} />} onClick={open}>
            Nueva Instalación
          </Button>
        </Group>
      </Group>
      
      <Collapse in={filtersOpened}>
        <Paper withBorder p="md" mb="md" style={{ borderColor: '#373a40' }}>
          <Text size="sm" fw={600} mb="md" c="dimmed">Filtros de Búsqueda</Text>
          
          <Group mb="md" grow>
            <Select
              label="Cliente"
              placeholder="Seleccione cliente"
              data={clienteOptions}
              searchable
              clearable
              value={filters.id_cliente ? String(filters.id_cliente) : null}
              onChange={(val) => setFilters(f => ({ ...f, page: 1, id_cliente: val ? Number(val) : undefined }))}
            />
            <Select
              label="Vendedor"
              placeholder="Seleccione vendedor"
              data={vendedorOptions}
              searchable
              clearable
              value={filters.id_vendedor ? String(filters.id_vendedor) : null}
              onChange={(val) => setFilters(f => ({ ...f, page: 1, id_vendedor: val ? Number(val) : undefined }))}
            />
            <Select
              label="Tipo de Caso"
              placeholder="Seleccione tipo de caso"
              data={tipoCasoOptions}
              searchable
              clearable
              value={filters.tipo_caso_id ? String(filters.tipo_caso_id) : null}
              onChange={(val) => setFilters(f => ({ ...f, page: 1, tipo_caso_id: val ? Number(val) : undefined }))}
            />
            <Select
              label="Usuario B2B"
              placeholder="Seleccione usuario B2B"
              data={usuarioB2BOptions}
              searchable
              clearable
              value={filters.usuario_b2b_id ? String(filters.usuario_b2b_id) : null}
              onChange={(val) => setFilters(f => ({ ...f, page: 1, usuario_b2b_id: val ? Number(val) : undefined }))}
            />
          </Group>

          <Group mb="md" grow>
            <Select
              label="Estado"
              placeholder="Seleccione estado"
              data={[
                { value: 'Pendiente Aprobación', label: 'Pendiente Aprobación' },
                { value: 'Pendiente Instalación', label: 'Pendiente Instalación' },
                { value: 'Usuario Creado', label: 'Usuario Creado' },
                { value: 'Configuración Pendiente', label: 'Configuración Pendiente' },
                { value: 'Agendada', label: 'Agendada' },
                { value: 'Completada', label: 'Completada' },
                { value: 'Cancelada', label: 'Cancelada' }
              ]}
              clearable
              value={filters.estado || null}
              onChange={(val) => setFilters(f => ({ ...f, page: 1, estado: val || undefined }))}
            />
          </Group>

          <Group grow>
            <TextInput
              type="date"
              label="Fecha desde"
              value={filters.fecha_desde || ''}
              onChange={(e: any) => {
                const val = e?.currentTarget?.value ?? e?.target?.value ?? '';
                setFilters(f => ({ ...f, page: 1, fecha_desde: val || undefined }));
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
            <TextInput
              type="date"
              label="Fecha hasta"
              value={filters.fecha_hasta || ''}
              onChange={(e: any) => {
                const val = e?.currentTarget?.value ?? e?.target?.value ?? '';
                setFilters(f => ({ ...f, page: 1, fecha_hasta: val || undefined }));
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </Group>
        </Paper>
      </Collapse>

      <InstalacionesList filters={filters} onPageChange={handlePageChange} />

      <Modal
        opened={modalOpened}
        onClose={close}
        title="Nueva Solicitud de Instalación"
        size="lg"
        centered
      >
        <InstallationRequestForm onSuccess={close} />
      </Modal>
    </Box>
  );
}