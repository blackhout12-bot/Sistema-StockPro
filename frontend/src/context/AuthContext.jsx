// frontend/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import api from '../utils/axiosConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

    // Estado para el flujo de selección de empresa (multi-empresa)
    const [empresaSelector, setEmpresaSelector] = useState(null);
    const [misEmpresas, setMisEmpresas] = useState(() => {
        try { return JSON.parse(localStorage.getItem('misEmpresas')) || []; } catch { return []; }
    });
    // { usuario_id, empresas[] } — cuando el login devuelve requires_empresa_select

    // ── Acciones ──────────────────────────────────────────────────
    const _setSession = useCallback((jwtToken, userData) => {
        const userInfo = userData || jwtDecode(jwtToken);
        setToken(jwtToken);
        setUser(userInfo);
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
            let parsed = {};
            if (res.data?.feature_toggles) {
                parsed = typeof res.data.feature_toggles === 'string' ? JSON.parse(res.data.feature_toggles) : res.data.feature_toggles;
            }
            setFeatureToggles(parsed);
            localStorage.setItem('featureToggles', JSON.stringify(parsed));
        } catch (err) {
            console.error('Error cargando configuración global:', err);
        }
    }, [user, token]);

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
        setEmpresaSelector(null);
        setMisEmpresas([]);
        setFeatureToggles({});
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('misEmpresas');
        localStorage.removeItem('featureToggles');
    }, []);

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

    const value = {
        token,
        user,
        featureToggles,
        login,
        logout,
        selectEmpresa,
        switchEmpresa,
        misEmpresas,
        empresaSelector,       // null | { usuario_id, empresas[] }
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
