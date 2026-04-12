// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosConfig';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const queryClient = useQueryClient();
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [user, setUser] = useState(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            // Anti-Corrupción: Forzar re-login si el usuario en caché corresponde a la versión pre Multi-Tenant
            if (u && (!u.empresa_id || !u.rol)) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null;
            }
            return u;
        } catch { return null; }
    });

    const [featureToggles, setFeatureToggles] = useState(() => {
        try { return JSON.parse(localStorage.getItem('featureToggles')) || {}; } catch { return {}; }
    });

    const [empresaConfig, setEmpresaConfig] = useState(() => {
        try { return JSON.parse(localStorage.getItem('empresaConfig')) || {}; } catch { return {}; }
    });

    const [plan, setPlan] = useState(() => {
        try { return localStorage.getItem('plan') || 'FULL'; } catch { return 'FULL'; }
    });

    const [planDescripcion, setPlanDescripcion] = useState(() => {
        try { return localStorage.getItem('planDescripcion') || 'Características activas para la organización.'; } catch { return 'Características activas para la organización.'; }
    });

    // Estado para el flujo de selección de empresa (multi-empresa)
    const [empresaSelector, setEmpresaSelector] = useState(null);
    const [misEmpresas, setMisEmpresas] = useState(() => {
        try { return JSON.parse(localStorage.getItem('misEmpresas')) || []; } catch { return []; }
    });
    // { usuario_id, empresas[] } — cuando el login devuelve requires_empresa_select
    
    const [isSuperAdmin, setIsSuperAdmin] = useState(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            return u?.panel === 'global' || u?.rol === 'superadmin';
        } catch { return false; }
    });

    // ── Acciones ──────────────────────────────────────────────────
    const _setSession = useCallback((jwtToken, userData) => {
        const userInfo = userData || jwtDecode(jwtToken);
        setToken(jwtToken);
        setUser(userInfo);
        const superFlag = userInfo.panel === 'global' || userInfo.rol === 'superadmin';
        setIsSuperAdmin(superFlag);
        
        if (superFlag) {
            setPlan('FULL');
            setPlanDescripcion('Acceso global y control total de la plataforma ERP.');
            localStorage.setItem('plan', 'FULL');
            localStorage.setItem('planDescripcion', 'Acceso global y control total de la plataforma ERP.');
        }

        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userInfo));
    }, []);

    const fetchMisEmpresas = useCallback(async () => {
        try {
            const res = await api.get('/auth/mis-empresas');
            setMisEmpresas(res.data);
            localStorage.setItem('misEmpresas', JSON.stringify(res.data));
        } catch (err) {
            console.error('Error cargando membresías:', err);
        }
    }, []);

    const fetchConfiguracionGlobal = useCallback(async () => {
        if (!user || !token) return;
        try {
            const res = await api.get('/empresa/configuracion/completa');
            const data = res.data || {};
            let parsed = {};
            if (data?.feature_toggles) {
                parsed = typeof data.feature_toggles === 'string' ? JSON.parse(data.feature_toggles) : data.feature_toggles;
            }
            setFeatureToggles(parsed);
            localStorage.setItem('featureToggles', JSON.stringify(parsed));

            // Store full empresa config (rubro, comprobantes, etc.)
            const config = {
                rubro: data.rubro || 'general',
                iva_defecto: data.config_iva_defecto || 21,
                comprobantes: data.comprobantes || [],
                nombre: data.nombre || '',
                feature_toggles: parsed
            };
            setEmpresaConfig(config);
            localStorage.setItem('empresaConfig', JSON.stringify(config));
        } catch (err) {
            console.error('Error cargando configuración global:', err);
        }
    }, [user, token]);

    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const storedToggles = JSON.parse(localStorage.getItem('feature_toggles') || localStorage.getItem('featureToggles') || '{}');
                setFeatureToggles(storedToggles);
            } catch (e) {
                console.error(e);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    /**
     * login() — acepta la respuesta del backend.
     * Si viene { requires_empresa_select, empresas[], usuario_id } activa el selector.
     * Si viene { token, user } loguea directamente.
     */
    const login = useCallback((resultado) => {
        if (resultado.requires_empresa_select) {
            setEmpresaSelector({
                usuario_id: resultado.usuario_id,
                empresas: resultado.empresas,
            });
            return;
        }
        setEmpresaSelector(null);
        _setSession(resultado.token, resultado.user);
        fetchMisEmpresas(); // Cargar la lista de empresas disponibles para este usuario
    }, [_setSession, fetchMisEmpresas]);

    /**
     * selectEmpresa() — llamado desde EmpresaSelector cuando el usuario elige empresa.
     */
    const selectEmpresa = useCallback(async (empresa_id) => {
        if (!empresaSelector) return;
        try {
            const res = await api.post('/auth/select-empresa', {
                usuario_id: empresaSelector.usuario_id,
                empresa_id,
            });
            setEmpresaSelector(null);
            _setSession(res.data.token, res.data.user);
            fetchMisEmpresas();
            // La configuración global se llamará por el useEffect al cambiar el user/token emitido por _setSession
            toast.success('¡Bienvenido!');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al seleccionar empresa');
        }
    }, [empresaSelector, _setSession, fetchMisEmpresas]);

    const switchEmpresa = useCallback(async (empresa_id) => {
        if (!user) return;
        try {
            const res = await api.post('/auth/select-empresa', {
                usuario_id: user.id,
                empresa_id,
            });
            _setSession(res.data.token, res.data.user);
            toast.success(`Cambiando a ${res.data.user.empresa_nombre || 'nueva empresa'}`);
            // Recargar para limpiar estados de componentes y re-inicializar datos del tenant
            window.location.reload();
        } catch (err) {
            toast.error('Error al cambiar de empresa');
        }
    }, [user, _setSession]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        setIsSuperAdmin(false);
        setEmpresaSelector(null);
        setMisEmpresas([]);
        setFeatureToggles({});
        setEmpresaConfig({});
        setPlan('FULL');
        setPlanDescripcion('Características activas para la organización.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('misEmpresas');
        localStorage.removeItem('featureToggles');
        localStorage.removeItem('empresaConfig');
        localStorage.removeItem('plan');
        localStorage.removeItem('planDescripcion');
        localStorage.removeItem('selectedEmpresa'); // Security patch: Evitar leak de empresa ID anterior
        localStorage.removeItem('sucursal_activa'); // Security patch: Limpiar sucursal
        localStorage.removeItem('deposito_activo'); // Security patch: Limpiar depósito
        
        // Destruir por completo la caché en memoria de React Query al hacer logout
        if (queryClient) {
            queryClient.clear();
        }
    }, [queryClient]);

    const refreshUser = useCallback(async () => {
        try {
            const res = await api.get('/auth/refresh');
            _setSession(res.data.token, res.data.user);
            return res.data.user;
        } catch (err) {
            console.error('Error refrescando usuario:', err);
            return null;
        }
    }, [_setSession]);

    // Validar token expirado al montar
    useEffect(() => {
        if (!token) return;
        try {
            const decoded = jwtDecode(token);
            if (decoded.exp * 1000 < Date.now()) {
                logout();
                toast.error('Tu sesión expiró. Iniciá sesión nuevamente.');
                return;
            }
            if (!user) setUser(decoded);
        } catch {
            logout();
        }
    }, [token, user, logout]);

    useEffect(() => {
        if (user && token) {
            fetchConfiguracionGlobal();
        }
    }, [user, token, fetchConfiguracionGlobal]);

    const updateFeatureToggles = useCallback((newToggles) => {
        setFeatureToggles(newToggles);
        localStorage.setItem('featureToggles', JSON.stringify(newToggles));
    }, []);

    const value = {
        token,
        user,
        isSuperAdmin,
        plan,
        setPlan,
        planDescripcion,
        setPlanDescripcion,
        featureToggles,
        empresaConfig,
        fetchConfiguracionGlobal,
        login,
        logout,
        selectEmpresa,
        switchEmpresa,
        refreshUser,
        updateFeatureToggles,
        misEmpresas,
        empresaSelector,
        isAuthenticated: !!token,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
    return ctx;
}

export default AuthContext;
