// mobile/src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    async function loadStorageData() {
        const storageUser = await AsyncStorage.getItem('user');
        const storageToken = await AsyncStorage.getItem('token');

        if (storageUser && storageToken) {
            setUser(JSON.parse(storageUser));
        }
        setLoading(false);
    }

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        let { token, user: userResponse, requires_empresa_select, empresas, usuario_id } = response.data;

        // Si el usuario es multi-empresa, auto-seleccionamos la primera para la App Mobile
        if (requires_empresa_select && empresas && empresas.length > 0) {
            const selResponse = await api.post('/auth/select-empresa', {
                usuario_id: usuario_id,
                empresa_id: empresas[0].empresa_id
            });
            token = selResponse.data.token;
            userResponse = selResponse.data.user;
        }

        if (!token) {
            throw new Error("No se pudo obtener el token de sesión");
        }

        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(userResponse));
        setUser(userResponse);
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['token', 'user']);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
