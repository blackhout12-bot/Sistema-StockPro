import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import UserPanel from './UserPanel';
import SuperAdminDashboard from './SuperAdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const rol = user?.rol;

  if (rol === 'superadmin') return <SuperAdminDashboard />;
  if (rol === 'admin' || rol === 'gerente') return <AdminDashboard />;
  return <UserPanel />;
}
