// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import { AreasPage } from './features/areas/pages/AreasPage';
import { PermisosPage } from './features/permisos/pages/PermisosPage';
import { RolesPage } from './features/roles/pages/RolesPage';
import { UsuariosPage } from './features/usuarios/pages/UsuariosPage';
import { DivisionesPage } from './features/divisiones/pages/DivisionesPage';
import { CategorizacionPage } from './features/categorizacion/pages/CategorizacionPage';
import { AtributosPage } from './features/atributos/pages/AtributosPage';
import { MedidasPage } from './features/medidas/pages/MedidasPage';
import { MarcasPage } from './features/marcas/pages/MarcasPage';
import { CalidadesPage } from './features/calidades/pages/CalidadesPage';
import { PaisesPage } from './features/paises/pages/PaisesPage';
import { FabricasPage } from './features/fabricas/pages/FabricasPage';
import { OrigenesPage } from './features/origenes/pages/OrigenesPage';
import { CodigosReferenciaPage } from './features/codigos-referencia/pages/CodigosReferenciaPage';
import { CodigoReferenciaDetailPage } from './features/codigos-referencia/pages/CodigoReferenciaDetailPage';
import { ClasificacionServicioPage } from './features/clasificaciones-servicio/pages/ClasificacionServicioPage';
import { ClasificacionEstadisticaPage } from './features/clasificaciones-estadistica/pages/ClasificacionEstadisticaPage';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';


const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <MainLayout />;
};

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
        />
        {/* Rutas Protegidas */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/areas" element={<AreasPage />} />
          <Route path="/permisos" element={<PermisosPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/divisiones" element={<DivisionesPage />} />
          <Route path="/atributos" element={<AtributosPage />} />
          <Route path="/medidas" element={<MedidasPage />} />
          <Route path="/categorizacion" element={<CategorizacionPage />} />
          <Route path="/marcas" element={<MarcasPage />} />
          <Route path="/calidades" element={<CalidadesPage />} />
          <Route path="/paises" element={<PaisesPage />} />
          <Route path="/fabricas" element={<FabricasPage />} />
          <Route path="/origenes" element={<OrigenesPage />} />
          <Route path="/codigos-referencia" element={<CodigosReferenciaPage />} />
          <Route path="/codigos-referencia/:refId" element={<CodigoReferenciaDetailPage />} />
          <Route path="/clasificaciones-servicio" element={<ClasificacionServicioPage />} />
          <Route path="/clasificaciones-estadistica" element={<ClasificacionEstadisticaPage />} />
          {/* Aquí añadiremos las futuras rutas */}
          {/* <Route path="/clientes" element={<ClientListPage />} /> */}
          {/* <Route path="/productos" element={<ProductListPage />} /> */}
        </Route>

        {/* Ruta para manejar 404 o redirigir */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;