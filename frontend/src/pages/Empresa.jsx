import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
    Building2, Save, Globe, Phone, Mail, MapPin, Hash,
    Image, BarChart3, Settings, Users, Package, FileText,
    ShoppingBag, TrendingUp, ArrowUpCircle, ArrowDownCircle,
    CheckCircle, Crown, Calendar, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Constantes ───────────────────────────────────────────────────────────────
const TABS = [
    { id: 'perfil', label: 'Perfil', icon: Building2 },
    { id: 'identidad', label: 'Identidad', icon: Image },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
    { id: 'depositos', label: 'Depósitos', icon: MapPin },
];

const MONEDAS = [
    { codigo: 'ARS', simbolo: '$', label: 'Peso Argentino (ARS)' },
    { codigo: 'USD', simbolo: 'US$', label: 'Dólar Estadounidense (USD)' },
    { codigo: 'EUR', simbolo: '€', label: 'Euro (EUR)' },
    { codigo: 'BRL', simbolo: 'R$', label: 'Real Brasileño (BRL)' },
    { codigo: 'CLP', simbolo: '$', label: 'Peso Chileno (CLP)' },
    { codigo: 'MXN', simbolo: '$', label: 'Peso Mexicano (MXN)' },
    { codigo: 'COP', simbolo: '$', label: 'Peso Colombiano (COP)' },
    { codigo: 'PEN', simbolo: 'S/.', label: 'Sol Peruano (PEN)' },
];

const ZONAS = [
    'America/Argentina/Buenos_Aires',
    'America/Bogota',
    'America/Santiago',
    'America/Lima',
    'America/Mexico_City',
    'America/Montevideo',
    'America/Asuncion',
    'America/Caracas',
    'America/New_York',
    'Europe/Madrid',
    'UTC',
];

const PLAN_CONFIG = {
    starter: { label: 'Starter', color: 'bg-gray-100 text-gray-700', icon: '🚀' },
    pro: { label: 'Pro', color: 'bg-indigo-100 text-indigo-700', icon: '⭐' },
    enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700', icon: '👑' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n, symbol = '$') =>
    `${symbol} ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;

const StatCard = ({ icon: Icon, label, value, sub, color = 'indigo' }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
        <div className={`bg-${color}-50 p-3 rounded-lg shrink-0`}>
            <Icon size={22} className={`text-${color}-600`} />
        </div>
        <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const Field = ({ label, children, col2 = false }) => (
    <div className={col2 ? 'md:col-span-2' : ''}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition';

// ─── Componente principal ─────────────────────────────────────────────────────
const Empresa = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol?.toLowerCase() === 'admin';

    const [tab, setTab] = useState('perfil');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Datos del perfil
    const [perfil, setPerfil] = useState({
        nombre: '', documento_identidad: '', email: '', telefono: '',
        direccion: '', sitio_web: '', pais: '', ciudad: '', codigo_postal: ''
    });

    // Identidad visual
    const [branding, setBranding] = useState({
        color_primario: '#6366f1',
        color_secundario: '#4f46e5',
        eslogan: '',
        logo_url: '',
        nombre_fantasia: ''
    });
    const [logoPreview, setLogoPreview] = useState('');

    // Estadísticas
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);

    // Configuración
    const [config, setConfig] = useState({
        moneda: 'ARS', simbolo_moneda: '$',
        zona_horaria: 'America/Argentina/Buenos_Aires',
        formato_fecha: 'DD/MM/YYYY',
        formato_hora: '24h',
        separador_decimal: ',',
        idioma: 'es-AR'
    });

    const [inventario, setInventario] = useState({
        stock_critico: 5,
        permitir_negativo: false,
        stock_max_global: '',
        alertas_habilitadas: true,
        alertas_canal: 'inapp',
        control_lotes: false,
        control_vencimientos: false
    });

    const [impuestos, setImpuestos] = useState({
        iva_defecto: 21,
        cuit: '',
        condicion_fiscal: 'Responsable Inscripto',
        percepciones_json: '[]',
        retenciones_json: '[]'
    });

    const [integraciones, setIntegraciones] = useState({
        email_host: '',
        email_port: 587,
        afip_cert_path: '',
        mercadopago_token: '',
        mercadolibre_token: '',
        ecommerce_url: '',
        ecommerce_secret: '',
        erp_key: ''
    });

    const [dashboard, setDashboard] = useState({
        kpis_visibles: '[]',
        rango_default: 'mes_actual',
        refresco_segundos: 300,
        widgets_visibles: '[]'
    });

    const [showAddCompModal, setShowAddCompModal] = useState(false);
    const [newComp, setNewComp] = useState({
        tipo_comprobante: '',
        prefijo: '0001',
        proximo_nro: 1,
        activo: true
    });

    const [depositos, setDepositos] = useState([]);
    const [showDepModal, setShowDepModal] = useState(false);
    const [depEdit, setDepEdit] = useState(null);

    const KPI_OPTIONS = [
        { id: 'total_productos', label: 'Total Productos', desc: 'Conteo total del catálogo' },
        { id: 'stock_bajo', label: 'Stock Bajo', desc: 'Alertas de reposición crítica' },
        { id: 'valor_inventario', label: 'Valorización', desc: 'Total monetario en stock' },
        { id: 'ventas_mes', label: 'Ventas Mensuales', desc: 'Total facturado este mes' },
        { id: 'clientes_nuevos', label: 'Clientes', desc: 'Nuevos usuarios registrados' },
        { id: 'movimientos', label: 'Movimientos', desc: 'Flujo de stock reciente' }
    ];

    const toggleKpi = (id) => {
        let current = [];
        try {
            current = JSON.parse(dashboard.kpis_visibles || '[]');
        } catch { current = []; }

        const next = current.includes(id)
            ? current.filter(x => x !== id)
            : [...current, id];

        setDashboard(d => ({ ...d, kpis_visibles: JSON.stringify(next) }));
    };

    const [comprobantes, setComprobantes] = useState([]);

    // ── Carga de datos ──────────────────────────────────────────
    const fetchEmpresa = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/empresa/configuracion/completa');
            const d = res.data || {};

            setPerfil({
                nombre: d.nombre || '',
                documento_identidad: d.documento_identidad || '',
                email: d.email || '',
                telefono: d.telefono || '',
                direccion: d.direccion || '',
                sitio_web: d.sitio_web || '',
                pais: d.pais || '',
                ciudad: d.ciudad || '',
                codigo_postal: d.codigo_postal || '',
            });

            setBranding({
                color_primario: d.branding_color_primario || '#6366f1',
                color_secundario: d.branding_color_secundario || '#4f46e5',
                eslogan: d.branding_eslogan || '',
                logo_url: d.logo_url || '',
                nombre_fantasia: d.branding_nombre_fantasia || ''
            });

            setLogoPreview(d.logo_url || '');

            setConfig({
                moneda: d.moneda || 'ARS',
                simbolo_moneda: d.simbolo_moneda || '$',
                zona_horaria: d.zona_horaria || 'America/Argentina/Buenos_Aires',
                formato_fecha: d.regional_formato_fecha || 'DD/MM/YYYY',
                formato_hora: d.regional_formato_hora || '24h',
                separador_decimal: d.regional_separador_decimal || ',',
                idioma: d.regional_idioma || 'es-AR'
            });

            setInventario({
                stock_critico: d.inv_stock_critico_global || 5,
                permitir_negativo: !!d.inv_permitir_negativo,
                stock_max_global: d.inv_stock_max_global || '',
                alertas_habilitadas: d.inv_alertas_habilitadas !== false,
                alertas_canal: d.inv_alertas_canal || 'inapp',
                control_lotes: !!d.inv_control_lotes,
                control_vencimientos: !!d.inv_control_vencimientos
            });

            setImpuestos({
                iva_defecto: d.config_iva_defecto || 21,
                cuit: d.config_cuit_cuil || '',
                condicion_fiscal: d.config_condicion_fiscal || 'Responsable Inscripto',
                percepciones_json: d.config_percepciones_json || '[]',
                retenciones_json: d.config_retenciones_json || '[]'
            });

            setIntegraciones({
                email_host: d.int_email_host || '',
                email_port: d.int_email_port || 587,
                afip_cert_path: d.int_afip_cert_path || '',
                mercadopago_token: d.int_mercadopago_token || '',
                mercadolibre_token: d.int_mercadolibre_token || '',
                ecommerce_url: d.int_ecommerce_url || '',
                ecommerce_secret: d.int_ecommerce_secret || '',
                erp_key: d.int_erp_key || ''
            });

            setDashboard({
                kpis_visibles: d.dash_kpis_visibles || '[]',
                rango_default: d.dash_rango_default || 'mes_actual',
                refresco_segundos: d.dash_refresco_segundos || 300,
                widgets_visibles: d.dash_widgets_visibles || '[]'
            });

            setComprobantes(d.comprobantes || []);
        } catch (err) {
            toast.error('Error al cargar datos de la empresa');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepositos = useCallback(async () => {
        try {
            const res = await api.get('/empresa/configuracion/depositos');
            setDepositos(res.data || []);
        } catch (err) {
            console.error('Error cargando depositos', err);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await api.get('/empresa/estadisticas');
            setStats(res.data);
        } catch {
            toast.error('Error al cargar estadísticas');
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => { fetchEmpresa(); }, [fetchEmpresa]);
    useEffect(() => {
        if (tab === 'estadisticas' && !stats) fetchStats();
        if (tab === 'depositos' && depositos.length === 0) fetchDepositos();
    }, [tab, stats, depositos.length, fetchStats, fetchDepositos]);

    // ── Handlers de guardado ────────────────────────────────────
    const savePerfil = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/empresa', { ...perfil, logo_url: branding.logo_url });
            toast.success('Perfil actualizado correctamente');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al guardar perfil');
        } finally { setSaving(false); }
    };

    const saveIdentidad = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put('/empresa/configuracion/branding', branding);
            setLogoPreview(branding.logo_url);
            toast.success('Identidad visual actualizada');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al guardar identidad');
        } finally { setSaving(false); }
    };

    const saveConfig = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const regionalPayload = {
                moneda: config.moneda,
                simbolo_moneda: config.simbolo_moneda,
                zona_horaria: config.zona_horaria,
                regional_formato_fecha: config.formato_fecha,
                regional_formato_hora: config.formato_hora,
                regional_separador_decimal: config.separador_decimal,
                idioma: config.idioma
            };

            const inventarioPayload = {
                ...inventario,
                stock_max_global: inventario.stock_max_global === '' ? null : inventario.stock_max_global
            };

            const integracionesPayload = {
                ...integraciones,
                email_port: integraciones.email_port === '' ? null : integraciones.email_port
            };

            const dashboardPayload = {
                ...dashboard,
                kpis_visibles: typeof dashboard.kpis_visibles === 'string' ? dashboard.kpis_visibles : JSON.stringify(dashboard.kpis_visibles),
                widgets_visibles: typeof dashboard.widgets_visibles === 'string' ? dashboard.widgets_visibles : JSON.stringify(dashboard.widgets_visibles)
            };

            await Promise.all([
                api.put('/empresa/configuracion/regional', regionalPayload),
                api.put('/empresa/configuracion/inventario', inventarioPayload),
                api.put('/empresa/configuracion/impuestos', impuestos),
                api.put('/empresa/configuracion/integraciones', integracionesPayload),
                api.put('/empresa/configuracion/dashboard', dashboardPayload).then(() => {
                    localStorage.setItem('dash_kpis', dashboard.kpis_visibles);
                    // Disparar evento para que el Dashboard se entere en tiempo real
                    window.dispatchEvent(new Event('storage'));
                })
            ]);
            toast.success('Configuración guardada correctamente');
        } catch (err) {
            console.error('Error saving config:', err);
            toast.error(err.response?.data?.error || 'Error al guardar configuración');
        } finally { setSaving(false); }
    };

    const saveComprobante = async (comp) => {
        try {
            // Limpiar payload para evitar errores de validación Zod (quitar ID y empresa_id)
            const payload = {
                tipo_comprobante: comp.tipo_comprobante,
                prefijo: comp.prefijo,
                proximo_nro: Number(comp.proximo_nro),
                activo: comp.activo
            };
            await api.put(`/empresa/configuracion/comprobantes/${comp.id}`, payload);
            toast.success(`Comprobante ${comp.tipo_comprobante} actualizado`);
            fetchEmpresa();
        } catch (err) {
            console.error('Error al actualizar:', err);
            toast.error(err.response?.data?.error || 'Error al actualizar comprobante');
        }
    };

    const handleAddComprobante = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                tipo_comprobante: String(newComp.tipo_comprobante),
                prefijo: String(newComp.prefijo),
                proximo_nro: Number(newComp.proximo_nro),
                activo: Boolean(newComp.activo)
            };

            if (isNaN(payload.proximo_nro) || payload.proximo_nro < 1) {
                return toast.error('El número próximo debe ser un valor válido mayor que 0');
            }
            if (!payload.tipo_comprobante) {
                return toast.error('Debe seleccionar o escribir un tipo de comprobante');
            }

            await api.post('/empresa/configuracion/comprobantes', payload);
            toast.success('Comprobante creado correctamente');
            setShowAddCompModal(false);
            setNewComp({ tipo_comprobante: '', prefijo: '0001', proximo_nro: 1, activo: true });
            fetchEmpresa();
        } catch (err) {
            console.error('Error al crear comprobante:', err);
            toast.error(err.response?.data?.error || 'Error al crear comprobante');
        }
    };

    const handleSaveDeposito = async (e) => {
        e.preventDefault();
        try {
            if (depEdit.id) {
                await api.put(`/empresa/configuracion/depositos/${depEdit.id}`, depEdit);
                toast.success('Depósito actualizado');
            } else {
                await api.post('/empresa/configuracion/depositos', depEdit);
                toast.success('Depósito creado');
            }
            setShowDepModal(false);
            fetchDepositos();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al guardar depósito');
        }
    };

    const handleDeleteDeposito = async (id) => {
        if (!confirm('¿Seguro que desea eliminar/desactivar este depósito? (Si tiene stock, la acción será rechazada)')) return;
        try {
            await api.delete(`/empresa/configuracion/depositos/${id}`);
            toast.success('Depósito desactivado');
            fetchDepositos();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Error al eliminar depósito');
        }
    };

    const handleMonedaChange = (codigo) => {
        const m = MONEDAS.find(x => x.codigo === codigo);
        setConfig(c => ({ ...c, moneda: codigo, simbolo_moneda: m?.simbolo || '$' }));
    };


    // ── Render ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const planInfo = PLAN_CONFIG[stats?.plan_activo || 'starter'] || PLAN_CONFIG.starter;

    return (
        <div className="max-w-5xl mx-auto space-y-6">

            {/* ── Hero Header ── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5">
                {logoPreview ? (
                    <img
                        src={logoPreview}
                        alt="Logo"
                        className="h-16 w-16 rounded-xl object-contain border border-gray-100 bg-gray-50 p-1"
                        onError={() => setLogoPreview('')}
                    />
                ) : (
                    <div className="h-16 w-16 rounded-xl bg-indigo-50 flex items-center justify-center">
                        <Building2 size={32} className="text-indigo-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-gray-900 truncate">
                        {perfil.nombre || 'Mi Empresa'}
                    </h1>
                    <p className="text-sm text-gray-500">{perfil.documento_identidad || 'Sin NIT/RUT configurado'}</p>
                </div>
                <span className={`hidden sm:flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-full ${planInfo.color}`}>
                    {planInfo.icon} Plan {planInfo.label}
                </span>
            </div>

            {/* ── Tabs ── */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-200 px-2">
                    <nav className="flex gap-0.5 -mb-px overflow-x-auto">
                        {TABS.map(t => {
                            const Icon = t.icon;
                            const active = tab === t.id;
                            // Ocultar config/estadísticas/depósitos a no-admin
                            if (!isAdmin && (t.id === 'configuracion' || t.id === 'estadisticas' || t.id === 'depositos')) return null;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${active
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon size={15} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6">

                    {/* ══ TAB: PERFIL ══════════════════════════════════════ */}
                    {tab === 'perfil' && (
                        <form onSubmit={savePerfil} className="space-y-6">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Datos Fiscales</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Aparecerán en facturas y comprobantes del sistema.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <Field label="Razón Social / Nombre Comercial *" col2>
                                    <input required className={inputCls} value={perfil.nombre}
                                        onChange={e => setPerfil(p => ({ ...p, nombre: e.target.value }))}
                                        placeholder="Ej. Distribuidora El Sol S.A." />
                                </Field>

                                <Field label="NIT / RUT / CUIT *">
                                    <div className="relative">
                                        <Hash size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input required className={`${inputCls} pl-9`} value={perfil.documento_identidad}
                                            onChange={e => setPerfil(p => ({ ...p, documento_identidad: e.target.value }))}
                                            placeholder="20-12345678-9" />
                                    </div>
                                </Field>

                                <Field label="Correo Electrónico">
                                    <div className="relative">
                                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="email" className={`${inputCls} pl-9`} value={perfil.email}
                                            onChange={e => setPerfil(p => ({ ...p, email: e.target.value }))}
                                            placeholder="contacto@empresa.com" />
                                    </div>
                                </Field>

                                <Field label="Teléfono">
                                    <div className="relative">
                                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input className={`${inputCls} pl-9`} value={perfil.telefono}
                                            onChange={e => setPerfil(p => ({ ...p, telefono: e.target.value }))}
                                            placeholder="+54 11 1234-5678" />
                                    </div>
                                </Field>

                                <Field label="Sitio Web">
                                    <div className="relative">
                                        <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input className={`${inputCls} pl-9`} value={perfil.sitio_web}
                                            onChange={e => setPerfil(p => ({ ...p, sitio_web: e.target.value }))}
                                            placeholder="https://www.empresa.com" />
                                    </div>
                                </Field>

                                <Field label="País">
                                    <input className={inputCls} value={perfil.pais}
                                        onChange={e => setPerfil(p => ({ ...p, pais: e.target.value }))}
                                        placeholder="Argentina" />
                                </Field>

                                <Field label="Ciudad">
                                    <input className={inputCls} value={perfil.ciudad}
                                        onChange={e => setPerfil(p => ({ ...p, ciudad: e.target.value }))}
                                        placeholder="Buenos Aires" />
                                </Field>

                                <Field label="Código Postal">
                                    <input className={inputCls} value={perfil.codigo_postal}
                                        onChange={e => setPerfil(p => ({ ...p, codigo_postal: e.target.value }))}
                                        placeholder="C1001" />
                                </Field>

                                <Field label="Dirección Principal" col2>
                                    <div className="relative">
                                        <MapPin size={15} className="absolute left-3 top-3 text-gray-400" />
                                        <textarea rows={3} className={`${inputCls} pl-9`} value={perfil.direccion}
                                            onChange={e => setPerfil(p => ({ ...p, direccion: e.target.value }))}
                                            placeholder="Av. Corrientes 1234, CABA" />
                                    </div>
                                </Field>
                            </div>

                            {isAdmin && (
                                <div className="flex justify-end pt-2">
                                    <button type="submit" disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition text-sm">
                                        <Save size={16} />
                                        {saving ? 'Guardando...' : 'Guardar Perfil'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {/* ══ TAB: IDENTIDAD ═══════════════════════════════════ */}
                    {tab === 'identidad' && (
                        <form onSubmit={saveIdentidad} className="space-y-8">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Branding e Identidad</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Personaliza la apariencia de tu empresa en el sistema y comprobantes.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                                {/* Branding Colors */}
                                <div className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Color Primario">
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="h-10 w-12 border-none p-0 bg-transparent cursor-pointer"
                                                    value={branding.color_primario}
                                                    onChange={e => setBranding(b => ({ ...b, color_primario: e.target.value }))}
                                                />
                                                <input
                                                    className={`${inputCls} font-mono uppercase`}
                                                    value={branding.color_primario}
                                                    onChange={e => setBranding(b => ({ ...b, color_primario: e.target.value }))}
                                                />
                                            </div>
                                        </Field>
                                        <Field label="Color Secundario">
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="h-10 w-12 border-none p-0 bg-transparent cursor-pointer"
                                                    value={branding.color_secundario}
                                                    onChange={e => setBranding(b => ({ ...b, color_secundario: e.target.value }))}
                                                />
                                                <input
                                                    className={`${inputCls} font-mono uppercase`}
                                                    value={branding.color_secundario}
                                                    onChange={e => setBranding(b => ({ ...b, color_secundario: e.target.value }))}
                                                />
                                            </div>
                                        </Field>
                                    </div>

                                    <Field label="Nombre de Fantasía" col2>
                                        <input
                                            className={inputCls}
                                            value={branding.nombre_fantasia}
                                            onChange={e => setBranding(b => ({ ...b, nombre_fantasia: e.target.value }))}
                                            placeholder="Ej. Distribuidora El Sol"
                                        />
                                    </Field>

                                    <Field label="Eslogan Comercial" col2>
                                        <input
                                            className={inputCls}
                                            value={branding.eslogan}
                                            onChange={e => setBranding(b => ({ ...b, eslogan: e.target.value }))}
                                            placeholder="Ej. Calidad y Servicio a su alcance"
                                        />
                                    </Field>

                                    <Field label="URL del Logo" col2>
                                        <input
                                            className={inputCls}
                                            value={branding.logo_url}
                                            onChange={e => setBranding(b => ({ ...b, logo_url: e.target.value }))}
                                            placeholder="https://mi-empresa.com/logo.png"
                                            disabled={!isAdmin}
                                        />
                                    </Field>
                                </div>

                                {/* Preview Card */}
                                <div className="space-y-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Previsualización de Marca</p>
                                    <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center text-center">
                                        <div className="mb-4">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="max-h-24 object-contain" onError={() => setLogoPreview('')} />
                                            ) : (
                                                <div className="h-20 w-20 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                                                    <Image size={40} style={{ color: branding.color_primario }} />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold" style={{ color: branding.color_primario }}>{perfil.nombre}</h3>
                                        <p className="text-sm italic" style={{ color: branding.color_secundario }}>{branding.eslogan || 'Tu eslogan aquí'}</p>

                                        <div className="mt-6 flex gap-2">
                                            <div className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: branding.color_primario }}>Botón Primario</div>
                                            <div className="px-4 py-2 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: branding.color_secundario }}>Botón Secundario</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex justify-end pt-2">
                                    <button type="submit" disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md active:scale-95 text-sm">
                                        <Save size={16} />
                                        {saving ? 'Guardando...' : 'Guardar Identidad'}
                                    </button>
                                </div>
                            )}
                        </form>
                    )}

                    {/* ══ TAB: DEPÓSITOS ══════════════════════════════════════ */}
                    {tab === 'depositos' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Gestión de Depósitos y Sucursales</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Controla las ubicaciones físicas donde se almacena tu stock.</p>
                                </div>
                                <button
                                    onClick={() => { setDepEdit({ nombre: '', direccion: '', es_principal: false, activo: true }); setShowDepModal(true); }}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
                                >
                                    + Nuevo Depósito
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-xl">
                                    <thead className="bg-gray-50 font-bold">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Nombre</th>
                                            <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Dirección</th>
                                            <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">Tipo</th>
                                            <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Stock Units</th>
                                            <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">Estado</th>
                                            <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {depositos.map((d) => (
                                            <tr key={d.id}>
                                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{d.nombre}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{d.direccion || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {d.es_principal ? (
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">PRINCIPAL</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">SECUNDARIO</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-medium">{d.stock_total_unidades}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${d.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {d.activo ? 'ACTIVO' : 'INACTIVO'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right space-x-3">
                                                    <button onClick={() => { setDepEdit(d); setShowDepModal(true); }} className="text-indigo-600 hover:text-indigo-900 font-bold text-xs">Editar</button>
                                                    {!d.es_principal && (
                                                        <button onClick={() => handleDeleteDeposito(d.id)} className="text-red-600 hover:text-red-900 font-bold text-xs">Desactivar</button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {depositos.length === 0 && (
                                            <tr><td colSpan={6} className="text-center py-6 text-gray-400">Cargando depósitos...</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ══ TAB: ESTADÍSTICAS ════════════════════════════════ */}
                    {tab === 'estadisticas' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Estadísticas del Tenant</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Métricas acumuladas de tu empresa en el sistema.</p>
                                </div>
                                <button onClick={fetchStats} disabled={statsLoading}
                                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50">
                                    <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
                                    Actualizar
                                </button>
                            </div>

                            {/* Plan badge */}
                            {stats && (
                                <div className={`flex items-center gap-3 p-4 rounded-xl border ${stats.plan_activo === 'enterprise' ? 'bg-amber-50 border-amber-200' :
                                    stats.plan_activo === 'pro' ? 'bg-indigo-50 border-indigo-200' :
                                        'bg-gray-50 border-gray-200'
                                    }`}>
                                    <Crown size={20} className={
                                        stats.plan_activo === 'enterprise' ? 'text-amber-600' :
                                            stats.plan_activo === 'pro' ? 'text-indigo-600' : 'text-gray-500'
                                    } />
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            Plan {PLAN_CONFIG[stats.plan_activo]?.label || 'Starter'}
                                        </p>
                                        {stats.miembro_desde && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Calendar size={11} />
                                                Miembro desde {new Date(stats.miembro_desde).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {statsLoading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
                                    ))}
                                </div>
                            ) : stats ? (
                                <div className="space-y-4">
                                    {/* Inventario */}
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Inventario</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatCard icon={Package} label="Total Productos" color="indigo"
                                            value={stats.total_productos}
                                            sub={`${stats.productos_sin_stock} sin stock`} />
                                        <StatCard icon={Package} label="Stock Bajo" color="amber"
                                            value={stats.productos_stock_bajo}
                                            sub="Requieren reposición" />
                                        <StatCard icon={TrendingUp} label="Valor Inventario" color="green"
                                            value={fmt(stats.valor_inventario, config.simbolo_moneda)}
                                            sub="Estimado actual" />
                                    </div>

                                    {/* Operaciones */}
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2">Operaciones</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatCard icon={FileText} label="Facturas Emitidas" color="purple"
                                            value={stats.total_facturas}
                                            sub={fmt(stats.ventas_totales, config.simbolo_moneda) + ' total'} />
                                        <StatCard icon={ArrowUpCircle} label="Entradas de Stock" color="green"
                                            value={stats.total_entradas} />
                                        <StatCard icon={ArrowDownCircle} label="Salidas de Stock" color="red"
                                            value={stats.total_salidas} />
                                    </div>

                                    {/* Personas */}
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-2">Personas</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <StatCard icon={Users} label="Usuarios del Sistema" color="indigo"
                                            value={stats.total_usuarios}
                                            sub="Activos en este tenant" />
                                        <StatCard icon={ShoppingBag} label="Clientes Registrados" color="blue"
                                            value={stats.total_clientes} />
                                        <StatCard icon={CheckCircle} label="Movimientos Totales" color="gray"
                                            value={stats.total_movimientos} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-10">Sin estadísticas disponibles</p>
                            )}
                        </div>
                    )}

                    {/* ══ TAB: CONFIGURACIÓN ═══════════════════════════════ */}
                    {tab === 'configuracion' && (
                        <div className="space-y-10">
                            {/* Subsección: Regional */}
                            <form onSubmit={saveConfig} className="space-y-6">
                                <div className="border-b border-gray-100 pb-4">
                                    <h2 className="text-base font-semibold text-gray-900">Configuración Regional</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Afecta el formato de moneda y fechas en todo el sistema.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Moneda Principal">
                                        <select className={inputCls} value={config.moneda}
                                            onChange={e => handleMonedaChange(e.target.value)}
                                            disabled={!isAdmin}>
                                            {MONEDAS.map(m => (
                                                <option key={m.codigo} value={m.codigo}>{m.label}</option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field label="Símbolo de Moneda">
                                        <input className={inputCls} value={config.simbolo_moneda}
                                            onChange={e => setConfig(c => ({ ...c, simbolo_moneda: e.target.value }))}
                                            placeholder="$" maxLength={5}
                                            disabled={!isAdmin} />
                                    </Field>

                                    <Field label="Formato de Fecha">
                                        <select className={inputCls} value={config.formato_fecha}
                                            onChange={e => setConfig(c => ({ ...c, formato_fecha: e.target.value }))}>
                                            <option value="DD/MM/YYYY">DD/MM/YYYY (Día/Mes/Año)</option>
                                            <option value="MM/DD/YYYY">MM/DD/YYYY (Mes/Día/Año)</option>
                                            <option value="YYYY-MM-DD">YYYY-MM-DD (Estándar ISO)</option>
                                        </select>
                                    </Field>

                                    <Field label="Separador Decimal">
                                        <select className={inputCls} value={config.separador_decimal}
                                            onChange={e => setConfig(c => ({ ...c, separador_decimal: e.target.value }))}>
                                            <option value=",">Coma ( , )</option>
                                            <option value=".">Punto ( . )</option>
                                        </select>
                                    </Field>

                                    <Field label="Idioma del Sistema">
                                        <select className={inputCls} value={config.idioma}
                                            onChange={e => setConfig(c => ({ ...c, idioma: e.target.value }))}>
                                            <option value="es-AR">Español (Argentina)</option>
                                            <option value="es-ES">Español (España)</option>
                                            <option value="en-US">Inglés (US)</option>
                                        </select>
                                    </Field>

                                    <Field label="Formato de Hora">
                                        <select className={inputCls} value={config.formato_hora}
                                            onChange={e => setConfig(c => ({ ...c, formato_hora: e.target.value }))}>
                                            <option value="24h">24 Horas (14:30)</option>
                                            <option value="12h">12 Horas (02:30 PM)</option>
                                        </select>
                                    </Field>
                                </div>

                                {/* Subsección: Inventario */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h2 className="text-base font-semibold text-gray-900">Parámetros de Inventario</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Define las reglas globales de stock para tu empresa.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Stock Crítico Global">
                                        <input type="number" className={inputCls} value={inventario.stock_critico}
                                            onChange={e => setInventario(i => ({ ...i, stock_critico: parseInt(e.target.value) || 0 }))}
                                            min={0} />
                                        <p className="text-[10px] text-gray-400 mt-1">Nivel en el que se activarán las alertas de reposición.</p>
                                    </Field>

                                    <Field label="Stock Máximo Global">
                                        <input type="number" className={inputCls} value={inventario.stock_max_global}
                                            onChange={e => setInventario(i => ({ ...i, stock_max_global: parseInt(e.target.value) || '' }))}
                                            min={0} />
                                        <p className="text-[10px] text-gray-400 mt-1">Límite sugerido para evitar sobrestock.</p>
                                    </Field>

                                    <Field label="Canal de Alertas">
                                        <select className={inputCls} value={inventario.alertas_canal}
                                            onChange={e => setInventario(i => ({ ...i, alertas_canal: e.target.value }))}>
                                            <option value="inapp">Solo en Sistema (Notificaciones UI)</option>
                                            <option value="email">Por Correo Electrónico</option>
                                            <option value="both">Ambos Canales</option>
                                        </select>
                                    </Field>

                                    <div className="flex flex-col gap-3 pt-6">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="permitir_negativo"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={inventario.permitir_negativo}
                                                onChange={e => setInventario(i => ({ ...i, permitir_negativo: e.target.checked }))}
                                            />
                                            <label htmlFor="permitir_negativo" className="text-sm font-medium text-gray-700">
                                                Permitir Stock Negativo
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="alertas_habilitadas"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={inventario.alertas_habilitadas}
                                                onChange={e => setInventario(i => ({ ...i, alertas_habilitadas: e.target.checked }))}
                                            />
                                            <label htmlFor="alertas_habilitadas" className="text-sm font-medium text-gray-700">
                                                Habilitar Alertas de Reposición
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="control_lotes"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={inventario.control_lotes}
                                                onChange={e => setInventario(i => ({ ...i, control_lotes: e.target.checked }))}
                                            />
                                            <label htmlFor="control_lotes" className="text-sm font-medium text-gray-700">
                                                Activar Trazabilidad por Lotes
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                id="control_vencimientos"
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                checked={inventario.control_vencimientos}
                                                onChange={e => setInventario(i => ({ ...i, control_vencimientos: e.target.checked }))}
                                            />
                                            <label htmlFor="control_vencimientos" className="text-sm font-medium text-gray-700">
                                                Activar Control de Vencimientos
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Subsección: Impuestos */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h2 className="text-base font-semibold text-gray-900">Impuestos y Facturación</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Datos legales para la emisión de comprobantes.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="CUIT / CUIL">
                                        <input className={inputCls} value={impuestos.cuit}
                                            onChange={e => setImpuestos(i => ({ ...i, cuit: e.target.value }))}
                                            placeholder="20-12345678-9" />
                                    </Field>
                                    <Field label="IVA por Defecto (%)">
                                        <input type="number" className={inputCls} value={impuestos.iva_defecto}
                                            onChange={e => setImpuestos(i => ({ ...i, iva_defecto: parseFloat(e.target.value) }))}
                                            step="0.01" />
                                    </Field>
                                    <Field label="Condición Fiscal" col2>
                                        <select className={inputCls} value={impuestos.condicion_fiscal}
                                            onChange={e => setImpuestos(i => ({ ...i, condicion_fiscal: e.target.value }))}>
                                            <option value="Responsable Inscripto">Responsable Inscripto</option>
                                            <option value="Monotributo">Monotributo</option>
                                            <option value="Exento">Exento</option>
                                            <option value="Consumidor Final">Consumidor Final</option>
                                        </select>
                                    </Field>
                                </div>

                                {/* Subsección: Integraciones */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h2 className="text-base font-semibold text-gray-900">Integraciones Avanzadas</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Credenciales para conectar con pasarelas de pago y entes fiscales.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Servidor SMTP (Host)">
                                        <input className={inputCls} value={integraciones.email_host}
                                            onChange={e => setIntegraciones(i => ({ ...i, email_host: e.target.value }))}
                                            placeholder="smtp.gmail.com" />
                                    </Field>
                                    <Field label="Puerto SMTP">
                                        <input type="number" className={inputCls} value={integraciones.email_port}
                                            onChange={e => setIntegraciones(i => ({ ...i, email_port: parseInt(e.target.value) || '' }))}
                                            placeholder="587" />
                                    </Field>
                                    <Field label="Certificado AFIP (Path)">
                                        <input className={inputCls} value={integraciones.afip_cert_path}
                                            onChange={e => setIntegraciones(i => ({ ...i, afip_cert_path: e.target.value }))}
                                            placeholder="/certificados/afip.crt" />
                                    </Field>
                                    <Field label="MercadoPago Access Token">
                                        <input type="password" className={inputCls} value={integraciones.mercadopago_token}
                                            onChange={e => setIntegraciones(i => ({ ...i, mercadopago_token: e.target.value }))}
                                            placeholder="APP_USR-xxxxxxxxxxx" />
                                    </Field>
                                    <Field label="MercadoLibre Token">
                                        <input type="password" className={inputCls} value={integraciones.mercadolibre_token}
                                            onChange={e => setIntegraciones(i => ({ ...i, mercadolibre_token: e.target.value }))}
                                            placeholder="APP_USR-xxxxxxxxxxx" />
                                    </Field>
                                    <Field label="E-commerce Webhook URL">
                                        <input className={inputCls} value={integraciones.ecommerce_url}
                                            onChange={e => setIntegraciones(i => ({ ...i, ecommerce_url: e.target.value }))}
                                            placeholder="https://tienda.com/webhook" />
                                    </Field>
                                    <Field label="ERP External API Key">
                                        <input type="password" className={inputCls} value={integraciones.erp_key}
                                            onChange={e => setIntegraciones(i => ({ ...i, erp_key: e.target.value }))}
                                            placeholder="API-KEY-XXXXX" />
                                    </Field>
                                </div>

                                {/* Subsección: Dashboard */}
                                <div className="pt-4 border-t border-gray-100">
                                    <h2 className="text-base font-semibold text-gray-900">Configuración del Dashboard</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Define cómo se muestran las métricas en la pantalla principal.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <Field label="Indicadores Clave (KPIs) en Pantalla Principal" col2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                                            {KPI_OPTIONS.map(opt => {
                                                let current = [];
                                                try { current = JSON.parse(dashboard.kpis_visibles || '[]'); } catch { }
                                                const isSelected = current.includes(opt.id);
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => toggleKpi(opt.id)}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${isSelected
                                                            ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                            }`}
                                                    >
                                                        <div className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'
                                                            }`}>
                                                            {isSelected && <CheckCircle size={10} strokeWidth={4} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                                                            <p className="text-[10px] text-gray-500">{opt.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-3">Selecciona los indicadores que deseas visualizar en la vista principal del Dashboard.</p>
                                    </Field>

                                    <Field label="Rango de Fechas por Defecto">
                                        <select className={inputCls} value={dashboard.rango_default}
                                            onChange={e => setDashboard(d => ({ ...d, rango_default: e.target.value }))}>
                                            <option value="hoy">Día Actual</option>
                                            <option value="semana_actual">Semana Actual</option>
                                            <option value="mes_actual">Mes Actual</option>
                                            <option value="anio_actual">Año Actual</option>
                                        </select>
                                    </Field>

                                    <Field label="Frecuencia de Refresco (segundos)">
                                        <input type="number" className={inputCls} value={dashboard.refresco_segundos}
                                            onChange={e => setDashboard(d => ({ ...d, refresco_segundos: parseInt(e.target.value) || 0 }))}
                                            min={30} step={10} />
                                        <p className="text-[10px] text-gray-400 mt-1">Mínimo 30 segundos recomendado.</p>
                                    </Field>
                                </div>

                                {isAdmin && (
                                    <div className="flex justify-end">
                                        <button type="submit" disabled={saving}
                                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 shadow-md">
                                            <Save size={16} />
                                            {saving ? 'Guardando...' : 'Guardar Ajustes'}
                                        </button>
                                    </div>
                                )}
                            </form>

                            {/* Subsección: Comprobantes */}
                            <div className="space-y-4 pt-10 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-base font-semibold text-gray-900">Numeración de Comprobantes</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Configura los prefijos y el número siguiente para tus facturas.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddCompModal(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
                                    >
                                        + Nuevo Tipo
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 border border-gray-100 rounded-xl">
                                        <thead className="bg-gray-50 font-bold">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Tipo</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Prefijo</th>
                                                <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">Próximo Nro.</th>
                                                <th className="px-4 py-3 text-center text-xs text-gray-500 uppercase tracking-wider">Estado</th>
                                                <th className="px-4 py-3 text-right text-xs text-gray-500 uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {comprobantes.map((c, idx) => (
                                                <tr key={c.id}>
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.tipo_comprobante}</td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            className="w-20 px-2 py-1 border rounded text-sm bg-gray-50"
                                                            value={c.prefijo}
                                                            onChange={e => {
                                                                const newC = [...comprobantes];
                                                                newC[idx].prefijo = e.target.value;
                                                                setComprobantes(newC);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            className="w-24 px-2 py-1 border rounded text-sm bg-gray-50"
                                                            value={c.proximo_nro}
                                                            onChange={e => {
                                                                const newC = [...comprobantes];
                                                                newC[idx].proximo_nro = parseInt(e.target.value);
                                                                setComprobantes(newC);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {c.activo ? 'ACTIVO' : 'INACTIVO'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button
                                                            onClick={() => saveComprobante(c)}
                                                            className="text-indigo-600 hover:text-indigo-900 font-bold text-xs"
                                                        >
                                                            Actualizar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nuevo Comprobante */}
            {showAddCompModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Añadir Tipo de Comprobante</h3>
                        <form onSubmit={handleAddComprobante} className="space-y-4">
                            <Field label="Tipo de Comprobante">
                                <div className="space-y-2">
                                    <select
                                        required
                                        className={inputCls}
                                        value={newComp.tipo_comprobante}
                                        onChange={e => {
                                            if (e.target.value === 'OTRO') {
                                                const custom = prompt('Escriba el nombre del nuevo tipo de comprobante:');
                                                if (custom) setNewComp({ ...newComp, tipo_comprobante: custom });
                                            } else {
                                                setNewComp({ ...newComp, tipo_comprobante: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">Seleccione un tipo...</option>
                                        <option value="Factura A">Factura A</option>
                                        <option value="Factura B">Factura B</option>
                                        <option value="Factura C">Factura C</option>
                                        <option value="Nota de Crédito A">Nota de Crédito A</option>
                                        <option value="Nota de Crédito B">Nota de Crédito B</option>
                                        <option value="Nota de Débito A">Nota de Débito A</option>
                                        <option value="Recibo A">Recibo A</option>
                                        <option value="Recibo B">Recibo B</option>
                                        <option value="Remito">Remito</option>
                                        <option value="Ticket">Ticket</option>
                                        <option value="Cotización / Presupuesto">Cotización / Presupuesto</option>
                                        <option value="OTRO">-- OTRO (Personalizado) --</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400">Seleccione un tipo estándar o elija 'Otro' para definir uno nuevo.</p>
                                </div>
                            </Field>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Prefijo">
                                    <input required className={inputCls} value={newComp.prefijo}
                                        onChange={e => setNewComp({ ...newComp, prefijo: e.target.value })} />
                                </Field>
                                <Field label="Siguiente Nro">
                                    <input
                                        type="number"
                                        required
                                        className={inputCls}
                                        value={newComp.proximo_nro}
                                        min="1"
                                        onChange={e => {
                                            const val = parseInt(e.target.value);
                                            setNewComp({ ...newComp, proximo_nro: isNaN(val) ? '' : val });
                                        }}
                                    />
                                </Field>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddCompModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm active:scale-95 transition-all">Crear Comprobante</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Crear/Editar Depósito */}
            {showDepModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{depEdit?.id ? 'Editar Depósito' : 'Nuevo Depósito'}</h3>
                        <form onSubmit={handleSaveDeposito} className="space-y-4">
                            <Field label="Nombre del Depósito">
                                <input required className={inputCls} placeholder="Ej. Depósito Central" value={depEdit.nombre}
                                    onChange={e => setDepEdit({ ...depEdit, nombre: e.target.value })} />
                            </Field>
                            <Field label="Dirección / Ubicación">
                                <input className={inputCls} placeholder="Av. Principal 123" value={depEdit.direccion}
                                    onChange={e => setDepEdit({ ...depEdit, direccion: e.target.value })} />
                            </Field>
                            <div className="flex flex-col gap-3 pt-2">
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="dep_principal"
                                        className="h-4 w-4 text-indigo-600 rounded"
                                        checked={depEdit.es_principal}
                                        onChange={e => setDepEdit({ ...depEdit, es_principal: e.target.checked })} />
                                    <label htmlFor="dep_principal" className="text-sm font-medium text-gray-700">Es el Depósito Principal</label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input type="checkbox" id="dep_activo"
                                        className="h-4 w-4 text-indigo-600 rounded"
                                        checked={depEdit.activo}
                                        onChange={e => setDepEdit({ ...depEdit, activo: e.target.checked })} />
                                    <label htmlFor="dep_activo" className="text-sm font-medium text-gray-700">Depósito Activo</label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowDepModal(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-sm">Guardar Depósito</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Empresa;
