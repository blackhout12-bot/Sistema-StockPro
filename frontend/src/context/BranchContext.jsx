/**
 * BranchContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Contexto liviano para gestionar la sucursal y depósito activos.
 * Permite al POS y a los Reportes operar usando el depósito correcto.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from './AuthContext';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [sucursalActiva, setSucursalActiva] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sucursal_activa')) || null; }
    catch { return null; }
  });

  const [depositoActivo, setDepositoActivo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('deposito_activo')) || null; }
    catch { return null; }
  });

  const [sucursales, setSucursales] = useState([]);
  const [depositos, setDepositos] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/empresa/configuracion/depositos');
      const data = res.data;
      // El endpoint devuelve depósitos con sucursal_id
      setDepositos(Array.isArray(data) ? data : []);

      // Derivar lista única de sucursales desde los depósitos
      const sucMap = {};
      (Array.isArray(data) ? data : []).forEach(d => {
        if (d.sucursal_id && !sucMap[d.sucursal_id]) {
          sucMap[d.sucursal_id] = {
            id: d.sucursal_id,
            nombre: d.sucursal_nombre || `Sucursal ${d.sucursal_id}`
          };
        }
      });
      const sucursalesArr = Object.values(sucMap);
      setSucursales(sucursalesArr);

      // Auto-seleccionar primera sucursal/depósito si no hay selección
      setSucursalActiva(prev => {
        if (!prev && sucursalesArr.length > 0) {
          localStorage.setItem('sucursal_activa', JSON.stringify(sucursalesArr[0]));
          return sucursalesArr[0];
        }
        return prev;
      });

      setDepositoActivo(prev => {
        if (!prev && Array.isArray(data) && data.length > 0) {
          localStorage.setItem('deposito_activo', JSON.stringify(data[0]));
          return data[0];
        }
        return prev;
      });
      
    } catch (err) {
      console.error('Error cargando sucursales/depósitos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // CARGA INICIAL: Prevenir que la app quede huérfana de sucursales
  useEffect(() => {
    if (isAuthenticated) {
        fetchBranches();
    }
  }, [fetchBranches, isAuthenticated]);

  // Filtrar depósitos de la sucursal activa
  const depositosDeSucursal = sucursalActiva
    ? depositos.filter(d => d.sucursal_id === sucursalActiva.id || !d.sucursal_id)
    : depositos;

  const selectSucursal = useCallback((sucursal) => {
    setSucursalActiva(sucursal);
    localStorage.setItem('sucursal_activa', JSON.stringify(sucursal));
    // Auto-seleccionar primer depósito de la nueva sucursal
    const deps = depositos.filter(d => d.sucursal_id === sucursal.id);
    if (deps.length > 0) {
      setDepositoActivo(deps[0]);
      localStorage.setItem('deposito_activo', JSON.stringify(deps[0]));
    }
  }, [depositos]);

  const selectDeposito = useCallback((deposito) => {
    setDepositoActivo(deposito);
    localStorage.setItem('deposito_activo', JSON.stringify(deposito));
  }, []);

  const clearBranch = useCallback(() => {
    setSucursalActiva(null);
    setDepositoActivo(null);
    setSucursales([]);
    setDepositos([]);
    localStorage.removeItem('sucursal_activa');
    localStorage.removeItem('deposito_activo');
  }, []);

  const value = {
    sucursalActiva,
    depositoActivo,
    sucursales,
    depositos,
    depositosDeSucursal,
    loading,
    fetchBranches,
    selectSucursal,
    selectDeposito,
    clearBranch
  };

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error('useBranch debe usarse dentro de <BranchProvider>');
  return ctx;
}

export default BranchContext;
