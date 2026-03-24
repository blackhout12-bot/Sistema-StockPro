import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, QrCode, X, Copy, CheckCircle2 } from 'lucide-react';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MfaSetupModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [qrData, setQrData] = useState(null);
    const [secret, setSecret] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Si no está abierto o no hay usuario, null
    if (!isOpen || !user) return null;

    const iniciarSetup = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/mfa/setup');
            setQrData(res.data.qrCodeDataUrl);
            setSecret(res.data.secret);
            setStep(2);
        } catch (error) {
            toast.error('Error generando credenciales TOTP');
        } finally {
            setLoading(false);
        }
    };

    const verificarSetup = async () => {
        if (!pin || pin.length < 6) {
            return toast.error('Ingrese el PIN de 6 dígitos');
        }
        setLoading(true);
        try {
            await api.post('/auth/mfa/verify', { secret, token: pin });
            setStep(3);
            toast.success('MFA habilitado correctamente');
        } catch (error) {
            toast.error(error.response?.data?.error || 'PIN incorrecto');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Secreto copiado');
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in-up">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                        <ShieldAlert className="text-brand-base w-5 h-5" />
                        <h2>Autenticación de Dos Factores (2FA)</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {step === 1 && (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <QrCode className="w-8 h-8 text-brand-base" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">Asegura tu cuenta empresarial</h3>
                            <p className="text-sm text-slate-600">
                                Agrega una capa extra de seguridad. Solicitarémos un código numérico adicional al iniciar sesión. Puedes usar Google Authenticator, Authy o Microsoft Authenticator.
                            </p>
                            <button
                                onClick={iniciarSetup}
                                disabled={loading}
                                className="w-full mt-4 bg-brand-base text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all shadow-md shadow-brand-500/20 active:scale-95"
                            >
                                {loading ? 'Preparando...' : 'Comenzar Configuración'}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <h3 className="text-md font-bold text-slate-800 text-center">Escanea el Código QR</h3>
                            <p className="text-xs text-slate-500 text-center leading-relaxed">
                                Abre tu app de autenticación y escanea esta imagen.<br/> Si no puedes, introduce el código manual debajo.
                            </p>
                            <div className="flex justify-center p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                {qrData ? (
                                    <img src={qrData} alt="MFA QR Code" className="w-48 h-48 object-contain rounded-lg" />
                                ) : (
                                    <div className="w-48 h-48 animate-pulse bg-slate-100 rounded-lg" />
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                <code className="flex-1 text-xs text-slate-600 font-mono text-center tracking-widest">{secret}</code>
                                <button onClick={copyToClipboard} className="p-1.5 text-slate-400 hover:text-brand-base transition-colors" title="Copiar secreto">
                                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                </button>
                            </div>

                            <div className="space-y-1 pt-2 border-t border-slate-100">
                                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">Código de Verificación</label>
                                <input
                                    type="text"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    className="w-full text-center text-xl tracking-[0.5em] font-mono py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                                />
                            </div>

                            <button
                                onClick={verificarSetup}
                                disabled={loading || pin.length < 6}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Verificando...' : 'Verificar y Activar'}
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center space-y-4 py-4">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">¡MFA Configurado Exitosamente!</h3>
                            <p className="text-sm text-slate-600">
                                Tu cuenta ahora está protegida por Autenticación de Dos Factores. Se te pedirá un código en cada inicio de sesión.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full mt-4 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                            >
                                Entendido
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MfaSetupModal;
