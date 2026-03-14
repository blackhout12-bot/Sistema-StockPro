// mobile/src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://127.0.0.1:5000/api/v1'; // Cambiar por IP real en dispositivo físico

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await AsyncStorage.multiRemove(['token', 'user']);
        } else if (!error.response || error.code === 'ECONNABORTED' || error.message === 'Network Error') {
            // Manejo Offline / Reconciliación 
            console.log('[Offline] Guardando en cola de sincronización local...');
            if (error.config && error.config.method !== 'get') {
                try {
                    const queueStr = await AsyncStorage.getItem('offlineQueue');
                    const queue = queueStr ? JSON.parse(queueStr) : [];
                    queue.push({
                        url: error.config.url,
                        method: error.config.method,
                        data: error.config.data,
                        timestamp: Date.now()
                    });
                    await AsyncStorage.setItem('offlineQueue', JSON.stringify(queue));
                } catch (e) {
                    console.error('Error guarding offline request:', e);
                }
            }
            return Promise.reject({ offline: true, originalError: error });
        }
        return Promise.reject(error);
    }
);

export default api;
