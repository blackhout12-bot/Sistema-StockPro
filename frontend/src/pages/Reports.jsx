import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import { useAuth } from '../context/AuthContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, AlertCircle, Package } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Reports = () => {
    const { token } = useAuth();
    const [stockData, setStockData] = useState([]);
    const [movementsData, setMovementsData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [startDate, setStartDate] = useState(
        new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (token) {
            fetchReportsData();
        }
    }, [token, startDate, endDate]);

    const fetchReportsData = async () => {
        setLoading(true);
        try {
            const rawProducts = await api.get('/productos');
            setStockData(rawProducts.data.map(p => ({
                name: p.nombre,
                stock: p.stock,
                valor: p.stock * p.precio
            })));

            const movsRes = await api.get(`/reportes/movimientos?fechaInicio=${startDate}&fechaFin=${endDate}`);
            const agg = {};
            movsRes.data.forEach(m => {
                const d = new Date(m.fecha).toISOString().split('T')[0];
                if (!agg[d]) agg[d] = { date: d, entradas: 0, salidas: 0 };
                if (m.tipo === 'entrada') agg[d].entradas += m.cantidad;
                if (m.tipo === 'salida') agg[d].salidas += m.cantidad;
            });
            setMovementsData(Object.values(agg).sort((a, b) => new Date(a.date) - new Date(b.date)));
        } catch (err) {
            console.error('Error al cargar reportes:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate Summary Widgets
    const totalInventoryValue = stockData.reduce((acc, curr) => acc + curr.valor, 0);
    const lowStockCount = stockData.filter(p => p.stock < 10).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Análisis y Reportes</h1>

                <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm border-none focus:ring-0 text-gray-600"
                    />
                    <span className="text-gray-400">→</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-sm border-none focus:ring-0 text-gray-600"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <>
                    {/* KPI Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                    <Package size={24} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Total Productos Diversos</p>
                                    <p className="text-2xl font-semibold text-gray-900">{stockData.length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-red-100 text-red-600">
                                    <AlertCircle size={24} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Alertas Stock Bajo</p>
                                    <p className="text-2xl font-semibold text-gray-900">{lowStockCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100 text-green-600">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Valor Estimado Inventario</p>
                                    <p className="text-2xl font-semibold text-gray-900">${totalInventoryValue.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Flujo de Movimientos (Line Chart) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Flujo de Movimientos</h3>
                            <div className="h-72">
                                {movementsData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={movementsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                            <YAxis tick={{ fontSize: 12 }} />
                                            <Tooltip />
                                            <Legend />
                                            <Line type="monotone" dataKey="entradas" name="Entradas" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                                            <Line type="monotone" dataKey="salidas" name="Salidas" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-400">
                                        No hay movimientos en este rango de fechas
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Top Stock Disponible (Bar Chart) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Disponible (Top 10)</h3>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stockData.sort((a, b) => b.stock - a.stock).slice(0, 10)} margin={{ top: 5, right: 0, bottom: 20, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                                        <YAxis tick={{ fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#f3f4f6' }} />
                                        <Bar dataKey="stock" name="Unidades" fill="#6366F1" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Distribución de Valor Monetario (Pie Chart) */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución del Valor en Inventario</h3>
                            <div className="h-80 flex justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stockData.filter(d => d.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, 15)} // Top 15 by value
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={120}
                                            paddingAngle={2}
                                            dataKey="valor"
                                            nameKey="name"
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        >
                                            {stockData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default Reports;
