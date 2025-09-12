// src/features/dashboard/pages/DashboardPage.tsx
import { Title, Text, Paper, Grid, Group, Stack, ThemeIcon, Divider } from '@mantine/core';
import { FaUsers, FaBoxOpen, FaChartBar } from 'react-icons/fa';
import classes from './DashboardPage.module.css';

// Widget rediseñado para mayor impacto visual
const StatWidget = ({ title, icon, value, description }: { title: string; icon: React.ReactNode; value: string; description:string; }) => {
  return (
    <Paper withBorder p="md" radius="md" className={classes.widget}>
      <Group>
        <ThemeIcon color="red" variant="light" size={48} radius="md">
          {icon}
        </ThemeIcon>
        
        <Stack gap={0}>
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text fz={32} fw={700}>
            {value}
          </Text>
        </Stack>
      </Group>

      <Divider my="sm" />

      <Text fz="xs" c="dimmed" mt={7}>
        {description}
      </Text>
    </Paper>
  );
};

const DashboardPage = () => {
  return (
    <>
      <Title order={2} mb="lg" className={classes.pageTitle}>
        Dashboard
      </Title>

      {/* Banner de bienvenida con degradado para un look premium */}
      <Paper withBorder p="lg" mb="xl" radius="md" variant="gradient">
        <Title order={4} c="red">¡Bienvenido a RC CORE!</Title>
        <Text c="gray.3" mt={4}>
          Este es tu centro de control para la gestión B2B de Repuesto Center.
        </Text>
      </Paper>

      {/* Grilla para los KPIs */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <StatWidget 
            title="Ventas del Mes"
            icon={<FaChartBar size="1.8rem" />}
            value="--"
            description="KPIs de ventas se mostrarán aquí."
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <StatWidget 
            title="Clientes Activos B2B"
            icon={<FaUsers size="1.8rem" />}
            value="--"
            description="Métricas de clientes del canal online."
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
          <StatWidget 
            title="Productos Populares"
            icon={<FaBoxOpen size="1.8rem" />}
            value="--"
            description="Los productos más buscados y vendidos."
          />
        </Grid.Col>
      </Grid>
    </>
  );
};

export default DashboardPage;