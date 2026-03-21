import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import EmpresaSelector from './components/EmpresaSelector';
import LoginForm from './LoginForm';
import MainLayout from './layouts/MainLayout';
import ResetPassword from './pages/ResetPassword';

import moduleRegistry, { getAccessibleModules } from './config/moduleRegistry';

// ── Loading Fallback ────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Cargando módulo...</p>
    </div>
  </div>
);

// ── Rutas protegidas ────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, user, logout, empresaSelector, featureToggles } = useAuth();

  if (empresaSelector) return <EmpresaSelector />;

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

  // ── Construir rutas dinámicamente desde el registry ──────────
  const accessibleModules = getAccessibleModules(featureToggles, user?.rol);

  return (
    <Routes>
      {/* Ruta de reset de contraseña (pública una vez logueado) */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Layout principal con todas las rutas dinámicas */}
      <Route path="/" element={<MainLayout onLogout={logout} />}>
        {accessibleModules.map(mod => {
          const LazyPage = React.lazy(mod.lazy);

          if (mod.index) {
            return (
              <Route
                key={mod.id}
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <LazyPage />
                  </Suspense>
                }
              />
            );
          }

          // Extraer el path relativo (quitar "/" inicial)
          const relativePath = mod.path.replace(/^\//, '');

          return (
            <Route
              key={mod.id}
              path={relativePath}
              element={
                <Suspense fallback={<PageLoader />}>
                  <LazyPage />
                </Suspense>
              }
            />
          );
        })}

        {/* Catch-all: redirige al dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          borderRadius: '1rem',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.05em'
        }
      }} />
      <AuthProvider>
        <BranchProvider>
          <AppRoutes />
        </BranchProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
