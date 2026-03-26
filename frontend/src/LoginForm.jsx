import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from './utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import { ArrowRight, Building2, Mail, Lock, User, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const registerSchema = z.object({
  empresaNombre: z.string().min(2, 'Mínimo 2 caracteres para la empresa'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres para el nombre'),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Debe tener al menos 6 caracteres'),
});

const LoginForm = () => {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Estado del Flujo MFA (TOTP)
    const [mfaRequired, setMfaRequired] = useState(false);
    const [mfaUserId, setMfaUserId] = useState(null);
    const [mfaEmail, setMfaEmail] = useState('');
    const [mfaPin, setMfaPin] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: zodResolver(isLogin ? loginSchema : registerSchema),
        mode: 'onSubmit'
    });

    const onSubmit = async (data) => {
        console.log('[DEBUG_LOGIN_SUBMIT]', { email: data.email, password: data.password ? '****' : 'EMPTY' });
        setLoading(true);
        try {
            if (isForgotPassword) {
                await api.post('/auth/forgot-password', { email: data.email });
                toast.success('Si el correo existe, se envió un enlace de recuperación.');
                setIsForgotPassword(false);
                setIsLogin(true);
            } else if (isLogin && !mfaRequired) {
                const res = await api.post('/auth/login', { email: data.email, password: data.password });
                
                // Si requiere MFA, congelamos el auth handler e interceptamos con la step 2:
                if (res.data.requires_mfa) {
                    setMfaUserId(res.data.user_id);
                    setMfaEmail(res.data.email);
                    setMfaRequired(true);
                    return toast('Token requerido. Revisa tu app generadora.', { icon: '🛡️' });
                }

                login(res.data);
                if (!res.data.requires_empresa_select) {
                    toast.success('Sesión iniciada correctamente.');
                }
            } else {
                await api.post('/auth/register', { 
                    empresaNombre: data.empresaNombre, 
                    nombre: data.nombre, 
                    email: data.email, 
                    password: data.password 
                });
                toast.success('Empresa registrada. Ahora puedes iniciar sesión.');
                setIsLogin(true);
                reset();
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Error en la operación';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/auth/login-mfa', { user_id: mfaUserId, token: mfaPin });
            login(res.data);
            if (!res.data.requires_empresa_select) {
                toast.success('Sesión iniciada. ¡Bienvenido!');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Código incorrecto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full flex flex-col justify-center py-10 sm:px-6 lg:px-8 bg-[#FAFAFA]">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-xl tracking-tighter">TB</span>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    {mfaRequired ? 'Verificación de Seguridad' : (isForgotPassword ? 'Recuperar Cuenta' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'))}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    {mfaRequired ? 
                        `Ingresá el token (Authy, Google Auth) para ${mfaEmail}` :
                        (isForgotPassword ? 'Te enviaremos un enlace a tu correo' : (isLogin ? 'Accede a tu panel de control empresarial' : 'Comienza a gestionar tu negocio hoy mismo'))
                    }
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
                <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-gray-100 relative overflow-hidden">
                    {/* Top line accent */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>

                    {mfaRequired ? (
                        <form className="space-y-6 mt-2" onSubmit={handleMfaSubmit}>
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="w-8 h-8 text-brand-base" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 text-center uppercase tracking-widest mb-3">PIN DE 6 DÍGITOS</label>
                                <input
                                    type="text"
                                    value={mfaPin}
                                    onChange={(e) => setMfaPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="block w-full text-center text-3xl tracking-[0.5em] font-mono py-4 border border-gray-200 rounded-xl focus:ring-black focus:border-black bg-gray-50/50 hover:bg-gray-50 transition-colors placeholder:text-gray-300"
                                    placeholder="000000"
                                    autoFocus
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || mfaPin.length < 6}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-black hover:bg-gray-900 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Verificando...' : 'Autenticar'}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setMfaRequired(false); setMfaPin(''); }}
                                className="w-full text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mt-4 text-center"
                            >
                                Volver al inicio de sesión
                            </button>
                        </form>
                    ) : (
                        <>
                            <form className="space-y-5 mt-2" onSubmit={handleSubmit(onSubmit)}>
                                {!isLogin && (
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Building2 className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    {...register('empresaNombre')}
                                                    className={`block w-full pl-10 pr-3 py-2.5 border ${errors.empresaNombre ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-black focus:border-black sm:text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors`}
                                                    placeholder="Nombre de la empresa"
                                                />
                                            </div>
                                            {errors.empresaNombre && <p className="mt-1 text-xs text-red-500">{errors.empresaNombre.message}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <User className="h-5 w-5 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    {...register('nombre')}
                                                    className={`block w-full pl-10 pr-3 py-2.5 border ${errors.nombre ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-black focus:border-black sm:text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors`}
                                                    placeholder="Tu nombre y apellido"
                                                />
                                            </div>
                                            {errors.nombre && <p className="mt-1 text-xs text-red-500">{errors.nombre.message}</p>}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="email"
                                            {...register('email')}
                                            maxLength={255}
                                            className={`block w-full pl-10 pr-3 py-2.5 border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-black focus:border-black sm:text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors`}
                                            placeholder="ejemplo@correo.com"
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                                </div>

                                {!isForgotPassword && (
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
                                            {isLogin && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsForgotPassword(true);
                                                        setIsLogin(false);
                                                    }}
                                                    className="text-xs font-semibold text-gray-500 hover:text-black cursor-pointer transition-colors block"
                                                >
                                                    ¿Olvidaste tu contraseña?
                                                </button>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                {...register('password')}
                                                className={`block w-full pl-10 pr-3 py-2.5 border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-black focus:border-black sm:text-sm bg-gray-50/50 hover:bg-gray-50 transition-colors`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <>
                                                {isForgotPassword ? 'Enviar Enlace' : (isLogin ? 'Continuar' : 'Registrar')}
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-8">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100" />
                                    </div>
                                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="px-4 bg-white text-gray-400">O continuar con</span>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-sm bg-white border border-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] group"
                                    >
                                        <svg className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 1.2-4.53z" fill="#EA4335"/>
                                        </svg>
                                        <span>Google</span>
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-sm bg-white border border-gray-100 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98] group"
                                    >
                                        <svg className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" viewBox="0 0 23 23" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
                                            <path fill="#f35325" d="M1 1h10v10H1z"/>
                                            <path fill="#81bc06" d="M12 1h10v10H12z"/>
                                            <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                                            <path fill="#ffba08" d="M12 12h10v10H12z"/>
                                        </svg>
                                        <span>Microsoft 365</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-white text-gray-500">
                                            {isLogin ? '¿Primera vez?' : '¿Ya tienes cuenta?'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (isForgotPassword) {
                                                setIsForgotPassword(false);
                                                setIsLogin(true);
                                            } else {
                                                setIsLogin(!isLogin);
                                            }
                                            reset();
                                        }}
                                        className="text-sm font-semibold text-gray-900 hover:text-gray-700 transition-colors"
                                    >
                                        {isForgotPassword ? 'Volver al inicio de sesión' : (isLogin ? 'Crea una nueva cuenta de empresa' : 'Inicia sesión con tu cuenta existente')}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-fade-in-up {
                    animation: fadeInUp 0.5s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}} />
        </div>
    );
};

export default LoginForm;
