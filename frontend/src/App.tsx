// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import { useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <MainLayout />; // El Outlet dentro de MainLayout renderizará las rutas hijas
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