import React from 'react';
import { useForm } from '@mantine/form';
import { Button, Box, Textarea, Stack, Switch, Alert, Group, TextInput, NumberInput, Select, PasswordInput, LoadingOverlay } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ClienteSelect } from '../../clientes/components/ClienteSelect';
import { UsuarioB2BSelect } from '../../usuarios-b2b/components/UsuarioB2BSelect';
import { crearInstalacionCompletaMultiple } from '../services/instalacionService';
import { getUsuariosB2BByCliente, sugerirNombreUsuario } from '../../usuarios-b2b/services/usuarioB2BService';
import { getTiposCasoActivos } from '../../tipos-caso/services/tipoCasoService';
import type { CrearInstalacionCompletaPayload } from '../types';
import type { CategoriaTipoCaso } from '../../tipos-caso/types';

interface InstallationRequestFormProps {
  onSuccess?: () => void;
}

export const InstallationRequestForm = ({ onSuccess }: InstallationRequestFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<{
    id_cliente: number;
    id_usuario_b2b: number | undefined;
    categoria_tipo_caso: CategoriaTipoCaso | null;
    numero_usuarios: number;
    observaciones: string;
    fecha_solicitud: string | null;
    usar_fecha_personalizada: boolean;
    // Campos para usuario adicional
    crear_usuario_ahora: boolean;
    nombre_completo: string;
    usuario: string;
    email: string;
    password: string;
  }>({
    initialValues: {
      id_cliente: 0,
      id_usuario_b2b: undefined,
      categoria_tipo_caso: null,
      numero_usuarios: 1,
      observaciones: '',
      fecha_solicitud: null,
      usar_fecha_personalizada: false,
      // Campos para usuario adicional
      crear_usuario_ahora: true,
      nombre_completo: '',
      usuario: '',
      email: '',
      password: '',
    },
    validate: {
      id_cliente: (value) => (value === 0 ? 'Debe seleccionar un cliente' : null),
      categoria_tipo_caso: (value) => (!value ? 'Debe seleccionar un tipo de instalación' : null),
      id_usuario_b2b: (value, values) => {
        // Solo requerido para cambio de equipo
        if (values.categoria_tipo_caso === 'INSTALACION_CAMBIO_EQUIPO' && !value) {
          return 'Para cambio de equipo debe seleccionar el usuario B2B existente';
        }
        return null;
      },
      numero_usuarios: (value, values) => {
        // Solo requerido para cliente nuevo
        if (values.categoria_tipo_caso === 'INSTALACION_CLIENTE_NUEVO' && (!value || value < 1)) {
          return 'Debe especificar al menos 1 usuario';
        }
        return null;
      },
      // Validaciones para usuario adicional (solo si se crea ahora)
      nombre_completo: (value, values) => {
        if (values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL' && values.crear_usuario_ahora && !value?.trim()) {
          return 'El nombre completo es requerido';
        }
        return null;
      },
      usuario: (value, values) => {
        if (values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL' && values.crear_usuario_ahora && !value?.trim()) {
          return 'El nombre de usuario es requerido';
        }
        return null;
      },
      email: (value, values) => {
        if (values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL' && values.crear_usuario_ahora) {
          if (!value?.trim()) {
            return 'El email es requerido';
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return 'El formato del email no es válido';
          }
        }
        return null;
      },
      password: (value, values) => {
        if (values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL' && values.crear_usuario_ahora && (!value || value.length < 6)) {
          return 'La contraseña debe tener al menos 6 caracteres';
        }
        return null;
      },
    },
  });

  // Obtener tipos de caso activos
  const { data: tiposCaso = [] } = useQuery({
    queryKey: ['tipos-caso-activos'],
    queryFn: getTiposCasoActivos,
  });

  // Filtrar solo los tipos de caso relacionados con instalaciones
  const tiposInstalacion = tiposCaso.filter(tipo => 
    tipo.categoria_uso && [
      'INSTALACION_CLIENTE_NUEVO',
      'INSTALACION_USUARIO_ADICIONAL', 
      'INSTALACION_CAMBIO_EQUIPO'
    ].includes(tipo.categoria_uso)
  );

  // Obtener usuarios B2B del cliente seleccionado (para validación)
  useQuery({
    queryKey: ['usuarios-b2b-cliente', form.values.id_cliente],
    queryFn: () => getUsuariosB2BByCliente(form.values.id_cliente),
    enabled: !!form.values.id_cliente && form.values.categoria_tipo_caso === 'INSTALACION_CAMBIO_EQUIPO',
  });

  // Obtener sugerencia de nombre de usuario
  const { data: sugerenciaUsuario } = useQuery({
    queryKey: ['sugerir-usuario', form.values.id_cliente],
    queryFn: () => sugerirNombreUsuario(form.values.id_cliente),
    enabled: !!form.values.id_cliente && form.values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL',
  });

  // Actualizar el campo usuario cuando se obtiene la sugerencia
  React.useEffect(() => {
    if (sugerenciaUsuario?.nombre_sugerido && form.values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL') {
      form.setFieldValue('usuario', sugerenciaUsuario.nombre_sugerido);
    }
  }, [sugerenciaUsuario, form.values.categoria_tipo_caso]);

  const mutation = useMutation({
    mutationFn: crearInstalacionCompletaMultiple,
    onSuccess: (resultado) => {
      queryClient.invalidateQueries({ queryKey: ['instalaciones'] });
      
      let mensaje = `La solicitud de instalación ha sido registrada exitosamente.`;
      if (resultado.total_instalaciones > 1) {
        mensaje = `Se han creado ${resultado.total_instalaciones} solicitudes de instalación exitosamente.`;
      }
      
      let estadoInicial;
      if (esClienteNuevo) {
        estadoInicial = 'Pendiente Aprobación';
      } else if (resultado.total_instalaciones === 1 && resultado.instalaciones[0]?.estado === 'Usuario Creado') {
        estadoInicial = 'Usuario Creado (Proceso Automático)';
      } else {
        estadoInicial = 'Pendiente Instalación';
      }
      mensaje += ` Estado: ${estadoInicial}`;
      
      notifications.show({
        title: 'Solicitud(es) Creada(s)',
        message: mensaje,
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
      id_usuario_b2b: values.categoria_tipo_caso === 'INSTALACION_CAMBIO_EQUIPO' ? values.id_usuario_b2b : undefined,
      es_cliente_nuevo: values.categoria_tipo_caso === 'INSTALACION_CLIENTE_NUEVO',
      es_primer_usuario: values.categoria_tipo_caso === 'INSTALACION_CLIENTE_NUEVO',
      es_cambio_equipo: values.categoria_tipo_caso === 'INSTALACION_CAMBIO_EQUIPO',
      es_usuario_adicional: values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL',
      numero_usuarios: values.categoria_tipo_caso === 'INSTALACION_CLIENTE_NUEVO' ? values.numero_usuarios : undefined,
      observaciones: values.observaciones || undefined,
      fecha_solicitud: values.usar_fecha_personalizada && values.fecha_solicitud ? values.fecha_solicitud : undefined,
      // Datos del usuario adicional (solo si se crea ahora)
      datos_usuario_adicional: values.categoria_tipo_caso === 'INSTALACION_USUARIO_ADICIONAL' && values.crear_usuario_ahora ? {
        nombre_completo: values.nombre_completo,
        usuario: values.usuario,
        email: values.email,
        password: values.password,
      } : undefined,
    };
    
    mutation.mutate(payload);
  };

  const categoriaSeleccionada = form.values.categoria_tipo_caso;
  const esClienteNuevo = categoriaSeleccionada === 'INSTALACION_CLIENTE_NUEVO';

  // Determinar qué tipo de caso se creará
  const getTipoCasoInfo = () => {
    const tipoSeleccionado = tiposInstalacion.find(tipo => tipo.categoria_uso === categoriaSeleccionada);
    if (tipoSeleccionado) {
      return `Tipo de caso: ${tipoSeleccionado.nombre_tipo_caso}`;
    }
    return "Tipo de caso: Seleccione un tipo de instalación";
  };

  return (
    <Box pos="relative">
      <LoadingOverlay 
        visible={mutation.isPending} 
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ size: 'lg' }}
        zIndex={1000}
      />
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

          <Select
            label="Tipo de Instalación"
            description="Seleccione el tipo de instalación a realizar"
            withAsterisk
            placeholder="Seleccione un tipo de instalación"
            data={tiposInstalacion.map(tipo => ({
              value: tipo.categoria_uso!,
              label: tipo.nombre_tipo_caso,
              description: tipo.descripcion_tipo_caso
            }))}
            value={form.values.categoria_tipo_caso}
            onChange={(value) => form.setFieldValue('categoria_tipo_caso', value as CategoriaTipoCaso | null)}
            error={form.errors.categoria_tipo_caso as string | undefined}
          />

          {categoriaSeleccionada === 'INSTALACION_CLIENTE_NUEVO' && (
            <NumberInput
              label="Número de Usuarios"
              description="Cantidad de usuarios B2B que se crearán para este cliente"
              withAsterisk
              min={1}
              max={10}
              value={form.values.numero_usuarios}
              onChange={(value) => form.setFieldValue('numero_usuarios', Number(value) || 1)}
              error={form.errors.numero_usuarios as string | undefined}
            />
          )}

          {categoriaSeleccionada === 'INSTALACION_CAMBIO_EQUIPO' && (
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

          {categoriaSeleccionada === 'INSTALACION_USUARIO_ADICIONAL' && (
            <Box>
              <Alert icon={<IconInfoCircle />} color="blue" mb="md">
                <strong>Usuario Adicional</strong>
                <br />Puede crear el usuario ahora o después de aprobar la solicitud.
              </Alert>
              
              <Switch
                label="Crear usuario B2B ahora"
                description="Si está desactivado, se creará el usuario después de la aprobación"
                {...form.getInputProps('crear_usuario_ahora', { type: 'checkbox' })}
                mb="md"
              />
              
              {form.values.crear_usuario_ahora && (
                <Stack gap="md">
                  <Alert icon={<IconInfoCircle />} color="green" mb="md">
                    <strong>Proceso Automático</strong>
                    <br />Se creará automáticamente un nuevo usuario B2B y se aprobará la solicitud.
                    <br />Estado final: Pendiente de Instalación
                  </Alert>
                  
                  <TextInput
                    label="Nombre Completo"
                    withAsterisk
                    placeholder="Ej: Juan Pérez"
                    {...form.getInputProps('nombre_completo')}
                  />
                  
                  <TextInput
                    label="Nombre de Usuario"
                    withAsterisk
                    placeholder="Nombre de usuario sugerido automáticamente"
                    description={sugerenciaUsuario ? `Sugerido: ${sugerenciaUsuario.nombre_sugerido}` : 'Se generará automáticamente'}
                    {...form.getInputProps('usuario')}
                  />
                  
                  <TextInput
                    label="Email"
                    withAsterisk
                    type="email"
                    placeholder="usuario@empresa.com"
                    {...form.getInputProps('email')}
                  />
                  
                  <PasswordInput
                    label="Contraseña"
                    withAsterisk
                    placeholder="Mínimo 6 caracteres"
                    description="La contraseña inicial para el usuario B2B"
                    {...form.getInputProps('password')}
                  />
                </Stack>
              )}
              
              {!form.values.crear_usuario_ahora && (
                <Alert icon={<IconInfoCircle />} color="orange" mb="md">
                  <strong>Proceso Manual</strong>
                  <br />Se creará solo la solicitud de instalación.
                  <br />El usuario B2B se creará después usando el panel de acciones.
                  <br />Estado final: Pendiente de Instalación
                </Alert>
              )}
            </Box>
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
            {categoriaSeleccionada === 'INSTALACION_CLIENTE_NUEVO' && form.values.numero_usuarios > 1 
              ? `Crear ${form.values.numero_usuarios} Solicitudes de Instalación`
              : categoriaSeleccionada === 'INSTALACION_USUARIO_ADICIONAL'
              ? form.values.crear_usuario_ahora 
                ? 'Crear Usuario y Solicitud de Instalación (Automático)'
                : 'Crear Solicitud de Instalación (Usuario después)'
              : 'Crear Solicitud de Instalación'
            }
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

  // Función para crear fecha sin conversión de zona horaria
  const createLocalISOString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const str = e.currentTarget.value; // YYYY-MM-DD
    if (!str) return;
    const [yyyy, mm, dd] = str.split('-').map(Number);
    // conserva la hora/minutos actuales del campo
    const newDate = new Date(yyyy, (mm || 1) - 1, dd || 1, currentDate.getHours(), currentDate.getMinutes(), 0, 0);
    form.setFieldValue('fecha_solicitud', createLocalISOString(newDate));
  };

  const timeValue = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hh, mm] = e.currentTarget.value.split(':');
    const newDate = new Date(currentDate);
    newDate.setHours(parseInt(hh || '0', 10), parseInt(mm || '0', 10), 0, 0);
    form.setFieldValue('fecha_solicitud', createLocalISOString(newDate));
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
      <TextInput
        type="time"
        label="Hora de Solicitud"
        value={timeValue}
        onChange={handleTimeChange}
        required
      />
    </Group>
  );
}