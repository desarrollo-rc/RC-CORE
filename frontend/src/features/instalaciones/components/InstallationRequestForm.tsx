import { useForm } from '@mantine/form';
import { Button, Box, Textarea, Stack, Switch, Radio, Alert, Group, TextInput } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { UsuarioB2BSelect } from '../../usuarios-b2b/components/UsuarioB2BSelect';
import { crearInstalacionCompleta } from '../services/instalacionService';
import type { CrearInstalacionCompletaPayload } from '../types';

interface InstallationRequestFormProps {
  onSuccess?: () => void;
}

export const InstallationRequestForm = ({ onSuccess }: InstallationRequestFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<{
    id_cliente: number;
    id_usuario_b2b: number | undefined;
    es_cliente_nuevo: boolean;
    tipo_instalacion: 'primer_usuario' | 'usuario_adicional' | 'cambio_equipo';
    observaciones: string;
    fecha_solicitud: string | null;
    usar_fecha_personalizada: boolean;
  }>({
    initialValues: {
      id_cliente: 0,
      id_usuario_b2b: undefined,
      es_cliente_nuevo: false,
      tipo_instalacion: 'primer_usuario',
      observaciones: '',
      fecha_solicitud: null,
      usar_fecha_personalizada: false,
    },
    validate: {
      id_cliente: (value) => (value === 0 ? 'Debe seleccionar un cliente' : null),
      id_usuario_b2b: (value, values) => {
        // Solo requerido para cambio de equipo
        if (values.tipo_instalacion === 'cambio_equipo' && !value) {
          return 'Para cambio de equipo debe seleccionar el usuario B2B existente';
        }
        return null;
      },
    },
  });

  const mutation = useMutation({
    mutationFn: crearInstalacionCompleta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instalaciones'] });
      notifications.show({
        title: 'Solicitud Creada',
        message: `La solicitud de instalación ha sido registrada exitosamente. Estado: ${esClienteNuevo ? 'Pendiente Aprobación' : 'Pendiente Instalación'}`,
        color: 'green',
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error('Error al crear instalación:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Hubo un error al crear la solicitud';
      
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
      });
    },
  });

  const handleSubmit = (values: typeof form.values) => {
    const payload: CrearInstalacionCompletaPayload = {
      id_cliente: values.id_cliente,
      id_usuario_b2b: values.tipo_instalacion === 'cambio_equipo' ? values.id_usuario_b2b : undefined,
      es_cliente_nuevo: values.es_cliente_nuevo,
      es_primer_usuario: values.tipo_instalacion === 'primer_usuario',
      es_cambio_equipo: values.tipo_instalacion === 'cambio_equipo',
      observaciones: values.observaciones || undefined,
      fecha_solicitud: values.usar_fecha_personalizada && values.fecha_solicitud ? values.fecha_solicitud : undefined,
    };
    
    mutation.mutate(payload);
  };

  const tipoInstalacion = form.values.tipo_instalacion;
  const esClienteNuevo = form.values.es_cliente_nuevo;

  // Determinar qué tipo de caso se creará
  const getTipoCasoInfo = () => {
    if (esClienteNuevo) {
      return "Tipo de caso: 🆕 Instalación Cliente Nuevo";
    } else if (tipoInstalacion === 'cambio_equipo') {
      return "Tipo de caso: 🔄 Instalación Cambio de Equipo";
    } else if (tipoInstalacion === 'primer_usuario') {
      return "Tipo de caso: 👤 Instalación Usuario Nuevo";
    } else {
      return "Tipo de caso: ➕ Instalación Usuario Adicional";
    }
  };

  return (
    <Box>
      <Alert icon={<IconInfoCircle />} title="Proceso de Instalación" color="blue" mb="md">
        <strong>Flujo del proceso:</strong>
        <br />1. Crear solicitud → 2. Aprobación (si es cliente nuevo) → 3. Crear usuario → 4. Realizar instalación → 5. Finalizar
        <br />
        <strong>Tipo de caso: {getTipoCasoInfo()}</strong>
      </Alert>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <ClienteSelect
            label="Cliente"
            withAsterisk
            value={form.values.id_cliente.toString()}
            onChange={(value) => form.setFieldValue('id_cliente', Number(value))}
            error={form.errors.id_cliente as string | undefined}
          />

          <Switch
            label="¿Es un cliente nuevo en el sistema B2B?"
            description={esClienteNuevo ? "Requiere aprobación de gerencia" : "Cliente existente"}
            {...form.getInputProps('es_cliente_nuevo', { type: 'checkbox' })}
          />

          <Radio.Group
            label="Tipo de Instalación"
            description="Seleccione el tipo de instalación a realizar"
            withAsterisk
            {...form.getInputProps('tipo_instalacion')}
          >
            <Stack gap="xs" mt="xs">
              <Radio 
                value="primer_usuario" 
                label="Primer Usuario B2B del Cliente" 
                description="Se creará un nuevo usuario B2B"
              />
              <Radio 
                value="usuario_adicional" 
                label="Usuario Adicional" 
                description="Cliente ya tiene usuarios B2B, se creará un nuevo usuario"
              />
              <Radio 
                value="cambio_equipo" 
                label="Cambio de Equipo" 
                description="Reinstalación en un equipo diferente para usuario existente"
              />
            </Stack>
          </Radio.Group>

          {tipoInstalacion === 'cambio_equipo' && (
            <UsuarioB2BSelect
              label="Usuario B2B Existente"
              withAsterisk
              idCliente={form.values.id_cliente || undefined}
              description="Seleccione el usuario B2B que cambiará de equipo"
              value={form.values.id_usuario_b2b?.toString() || ''}
              onChange={(value) => form.setFieldValue('id_usuario_b2b', value ? Number(value) : undefined)}
              error={form.errors.id_usuario_b2b as string | undefined}
            />
          )}

          {tipoInstalacion === 'usuario_adicional' && (
            <Alert icon={<IconInfoCircle />} color="blue">
              Se creará un nuevo usuario B2B para este cliente. No es necesario seleccionar un usuario existente.
            </Alert>
          )}

          <Switch
            label="Usar fecha y hora de solicitud personalizada"
            description="Para instalaciones que ya se realizaron anteriormente"
            {...form.getInputProps('usar_fecha_personalizada', { type: 'checkbox' })}
          />

          {form.values.usar_fecha_personalizada && (
            <FechaHoraController form={form} />
          )}

          <Textarea
            label="Observaciones Iniciales"
            placeholder="Detalles importantes: contacto, horarios preferidos, requerimientos especiales, etc."
            minRows={3}
            {...form.getInputProps('observaciones')}
          />

          <Button type="submit" fullWidth loading={mutation.isPending}>
            Crear Solicitud de Instalación
          </Button>
          
        </Stack>
      </form>
    </Box>
  );
};

// Componente para manejar fecha y hora separadamente (igual que en pedidos)
function FechaHoraController({ form }: { form: any }) {
  const currentDate = form.values.fecha_solicitud ? new Date(form.values.fecha_solicitud) : new Date();
  
  const valueForInput = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.currentTarget.value; // YYYY-MM-DD
    if (!str) return;
    const [yyyy, mm, dd] = str.split('-').map(Number);
    // conserva la hora/minutos actuales del campo
    const newDate = new Date(yyyy, (mm || 1) - 1, dd || 1, currentDate.getHours(), currentDate.getMinutes(), 0, 0);
    form.setFieldValue('fecha_solicitud', newDate.toISOString());
  };

  const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hh, mm] = e.currentTarget.value.split(':');
    const newDate = new Date(currentDate);
    newDate.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0);
    form.setFieldValue('fecha_solicitud', newDate.toISOString());
  };

  return (
    <Group grow>
      <TextInput
        type="date"
        label="Fecha de Solicitud"
        value={valueForInput}
        onChange={handleDateChange}
        required
      />
      <TimeInput
        label="Hora de Solicitud"
        value={timeValue}
        onChange={handleTimeChange}
        required
      />
    </Group>
  );
}