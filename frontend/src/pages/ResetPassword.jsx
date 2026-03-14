import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { Lock, ArrowRight, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [nuevaPassword, setNuevaPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (nuevaPassword !== confirmPassword) {
            return toast.error('Las contraseñas no coinciden');
        }
        if (nuevaPassword.length < 8) {
            return toast.error('La contraseña debe tener al menos 8 caracteres');
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, nuevaPassword });
            toast.success('Contraseña actualizada correctamente');
            setSuccess(true);
            setTimeout(() => navigate('/'), 3000);
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al restablecer la contraseña';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="text-red-500 font-bold text-xl">Token faltante</div>
                    <p className="text-gray-600">El enlace de recuperación no es válido.</p>
                    <button onClick={() => navigate('/')} className="text-indigo-600 font-bold hover:underline">Volver al inicio</button>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-xl border border-gray-100 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={48} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">¡Contraseña Actualizada!</h2>
                    <p className="text-gray-600">Tu contraseña ha sido cambiada con éxito. Serás redirigido al inicio de sesión en unos segundos.</p>
                    <button onClick={() => navigate('/')} className="w-full py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-900 transition-all">
                        Ir al Login ahora
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] px-4">
            <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-black rounded-2xl shadow-lg mb-6 text-white font-black text-2xl tracking-tighter">
                        SP
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nueva Contraseña</h2>
                    <p className="mt-2 text-sm text-gray-600">Establece tu nueva clave de acceso segura</p>
                </div>

                <div className="bg-white py-10 px-8 shadow-sm rounded-[32px] border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Nueva Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={nuevaPassword}
                                    onChange={(e) => setNuevaPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-black focus:border-black sm:text-sm bg-gray-50/50 hover:bg-gray-50 transition-all outline-none"
                                    placeholder="Mínimo 8 caracteres"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 px-1">Confirmar Contraseña</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-black focus:border-black sm:text-sm bg-gray-50/50 hover:bg-gray-50 transition-all outline-none"
                                    placeholder="Repite tu nueva contraseña"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg text-base font-black text-white bg-black hover:bg-gray-900 focus:outline-none transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Actualizar Contraseña</span>
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
