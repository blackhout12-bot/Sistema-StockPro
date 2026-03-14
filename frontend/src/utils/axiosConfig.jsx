// frontend/src/utils/axiosConfig.js
import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
    baseURL: 'http://127.0.0.1:5000/api/v1',
    timeout: 15000,
});

// ─── Request Interceptor — inyecta token automáticamente ─────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        try {
            const selectedEmp = JSON.parse(localStorage.getItem('selectedEmpresa'));
            const userObj = JSON.parse(localStorage.getItem('user'));

            if (selectedEmp && selectedEmp.id) {
                config.headers['x-empresa-id'] = selectedEmp.id;
            } else if (userObj && userObj.empresa_id) {
                config.headers['x-empresa-id'] = userObj.empresa_id;
            }
        } catch (e) { }

        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response Interceptor — manejo global de errores ─────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                // Si el error 401 proviene del login, dejar que el formulario lo maneje naturalmente
                if (error.config && error.config.url && error.config.url.includes('/auth/login')) {
                    return Promise.reject(error);
                }

                console.warn('Sesión expirada. Redirigiendo al login...');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
                setTimeout(() => { window.location.href = '/'; }, 1500);
                return Promise.reject(error);
            }

            if (status === 403) {
                toast.error('No tenés permisos para realizar esta acción.');
                return Promise.reject(error);
            }

            if (status === 429) {
                toast.error('Demasiadas solicitudes. Por favor esperá un momento.');
                return Promise.reject(error);
            }

            if (status >= 500) {
                const backendMsg = error.response?.data?.message || error.response?.data?.error;
                toast.error(backendMsg || 'Error del servidor. Intenta nuevamente más tarde.');
            }
        } else if (error.request) {
            console.error('Network Error Detail:', error.request);
            toast.error('Sin conexión al servidor. Verificá que el backend esté activo.');
        } else {
            console.error('Error de configuración:', error.message);
        }

        return Promise.reject(error);
    }
);

export default api;
