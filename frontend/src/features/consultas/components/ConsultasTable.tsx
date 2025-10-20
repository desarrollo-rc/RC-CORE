// frontend/src/features/consultas/components/ConsultasTable.tsx
import { Table, Badge, ActionIcon, Group, Tooltip } from '@mantine/core';
import { IconPencil, IconTrash, IconPlayerPlay } from '@tabler/icons-react';
import type { Consulta } from '../types';

interface Props {
  data: Consulta[];
  onEdit: (consulta: Consulta) => void;
  onDelete: (consulta: Consulta) => void;
  onExecute: (consulta: Consulta) => void;
}

export function ConsultasTable({ data, onEdit, onDelete, onExecute }: Props) {
  const rows = data.map((consulta) => (
    <Table.Tr key={consulta.id_consulta}>
      <Table.Td>{consulta.codigo_consulta}</Table.Td>
      <Table.Td>{consulta.nombre}</Table.Td>
      <Table.Td>
        <Badge color={consulta.tipo === 'LECTURA' ? 'blue' : 'orange'}>
          {consulta.tipo}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color="grape">{consulta.bdd_source}</Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={consulta.activo ? 'green' : 'gray'}>
          {consulta.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Ejecutar Consulta">
            <ActionIcon 
              variant="subtle" 
              color="green" 
              onClick={() => onExecute(consulta)}
              disabled={consulta.tipo !== 'LECTURA'} // Solo se pueden ejecutar las de lectura directamente
            >
              <IconPlayerPlay size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Editar Consulta">
            <ActionIcon variant="subtle" color="blue" onClick={() => onEdit(consulta)}>
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Eliminar Consulta">
            <ActionIcon variant="subtle" color="red" onClick={() => onDelete(consulta)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Código</Table.Th>
          <Table.Th>Nombre</Table.Th>
          <Table.Th>Tipo</Table.Th>
          <Table.Th>Origen BDD</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}