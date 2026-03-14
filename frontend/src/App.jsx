import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import EmpresaSelector from './components/EmpresaSelector';
import LoginForm from './LoginForm';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Movements from './pages/Movements';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Empresa from './pages/Empresa';
import Clientes from './pages/Clientes';
import Facturacion from './pages/Facturacion';
import ResetPassword from './pages/ResetPassword';
import AuditLogs from './pages/AuditLogs';
import PaymentsDashboard from './pages/PaymentsDashboard';
import AlertsPanel from './pages/AlertsPanel';
import Marketplace from './pages/Marketplace';

// ─── Rutas protegidas con AuthContext ───────────────────────────
function AppRoutes() {
  const { isAuthenticated, user, logout, empresaSelector } = useAuth();

  // Modal de selección de empresa (multi-tenant login)
  // Se muestra incluso si no está autenticado (caso de login con múltiples empresas)
  if (empresaSelector) {
    return <EmpresaSelector />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Stock Pro</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Sistema de Gestión de Inventario</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
            <LoginForm />
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user?.rol === 'admin';

  return (
    <Routes>
      <Route path="/" element={<MainLayout onLogout={logout} />}>
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Products />} />
        <Route path="movimientos" element={<Movements />} />
        <Route path="facturacion" element={<Facturacion />} />
        <Route path="reportes" element={<Reports />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="usuarios" element={isAdmin ? <Users /> : <Navigate to="/" replace />} />
        <Route path="empresa" element={isAdmin ? <Empresa /> : <Navigate to="/" replace />} />
        <Route path="auditoria" element={isAdmin ? <AuditLogs /> : <Navigate to="/" replace />} />
        <Route path="pagos-externos" element={isAdmin ? <PaymentsDashboard /> : <Navigate to="/" replace />} />
        <Route path="alertas-ia" element={isAdmin ? <AlertsPanel /> : <Navigate to="/" replace />} />
        <Route path="marketplace" element={isAdmin ? <Marketplace /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
