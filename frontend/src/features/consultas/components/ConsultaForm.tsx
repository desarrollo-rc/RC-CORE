// frontend/src/features/consultas/components/ConsultaForm.tsx
import { useState } from 'react';
import { useForm } from '@mantine/form';
import { TextInput, Textarea, Button, Group, Select, Switch, Badge, ActionIcon } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { Consulta, ConsultaCreate } from '../types';

interface Props {
  onSubmit: (values: ConsultaCreate) => void;
  initialValues?: Partial<Consulta>;
  isSubmitting: boolean;
}

export function ConsultaForm({ onSubmit, initialValues, isSubmitting }: Props) {
  const [newTag, setNewTag] = useState('');
  
  const form = useForm<ConsultaCreate>({
    initialValues: {
      codigo_consulta: initialValues?.codigo_consulta || '',
      nombre: initialValues?.nombre || '',
      descripcion: initialValues?.descripcion || '',
      query_sql: initialValues?.query_sql || '',
      activo: initialValues?.activo ?? true,
      tipo: initialValues?.tipo || 'LECTURA',
      bdd_source: initialValues?.bdd_source || 'RC_CORE',
      categoria: initialValues?.categoria || '',
      tags: initialValues?.tags || [],
    },
  });

  const handleAddTag = () => {
    const currentTags = form.values.tags || [];
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      form.setFieldValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <TextInput required label="Código" {...form.getInputProps('codigo_consulta')} disabled={!!initialValues} />
      <TextInput required label="Nombre" {...form.getInputProps('nombre')} />
      <Textarea label="Descripción" {...form.getInputProps('descripcion')} />
      <Textarea required label="Query SQL" {...form.getInputProps('query_sql')} minRows={4} autosize />
      <Select
        label="Tipo"
        required
        data={['LECTURA', 'ESCRITURA', 'PROCESO']}
        {...form.getInputProps('tipo')}
      />
      <Select
        label="Origen de Datos (BBDD)"
        required
        data={['RC_CORE', 'SAPB1', 'OMSRC']}
        {...form.getInputProps('bdd_source')}
      />
      <TextInput label="Categoría" {...form.getInputProps('categoria')} />
      <div>
        <TextInput 
          label="Tags" 
          placeholder="Escribe un tag y presiona el botón para agregarlo"
          value={newTag}
          onChange={(e) => setNewTag(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddTag();
            }
          }}
          rightSection={
            <Button size="xs" onClick={handleAddTag} disabled={!newTag.trim()}>
              Agregar
            </Button>
          }
        />
        {form.values.tags && form.values.tags.length > 0 && (
          <Group gap="xs" mt="xs">
            {form.values.tags.map((tag, index) => (
              <Badge
                key={index}
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="blue"
                    radius="xl"
                    variant="transparent"
                    onClick={() => {
                      const newTags = form.values.tags?.filter((_, i) => i !== index) || [];
                      form.setFieldValue('tags', newTags);
                    }}
                  >
                    <IconX size={10} />
                  </ActionIcon>
                }
              >
                {tag}
              </Badge>
            ))}
          </Group>
        )}
      </div>
      <Switch mt="md" label="Activa" {...form.getInputProps('activo', { type: 'checkbox' })} />
      <Group justify="flex-end" mt="md">
        <Button type="submit" loading={isSubmitting}>Guardar</Button>
      </Group>
    </form>
  );
}