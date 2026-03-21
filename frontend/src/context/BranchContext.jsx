/**
 * BranchContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Contexto liviano para gestionar la sucursal y depósito activos.
 * Permite al POS y a los Reportes operar usando el depósito correcto.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

const BranchContext = createContext(null);

export function BranchProvider({ children }) {
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
      setSucursales(Object.values(sucMap));

      // Auto-seleccionar primera sucursal/depósito si no hay selección
      if (!sucursalActiva && Object.keys(sucMap).length > 0) {
        const firstSucursal = Object.values(sucMap)[0];
        setSucursalActiva(firstSucursal);
        localStorage.setItem('sucursal_activa', JSON.stringify(firstSucursal));
      }
      if (!depositoActivo && Array.isArray(data) && data.length > 0) {
        setDepositoActivo(data[0]);
        localStorage.setItem('deposito_activo', JSON.stringify(data[0]));
      }
    } catch (err) {
      console.error('Error cargando sucursales/depósitos:', err);
    } finally {
      setLoading(false);
    }
  }, [sucursalActiva, depositoActivo]);

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
