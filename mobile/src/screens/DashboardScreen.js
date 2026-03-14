// mobile/src/screens/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS, SPACING } from '../theme';

import api from '../services/api';

const DashboardScreen = ({ navigation }) => {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/empresa/estadisticas');
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = stats ? (Number(stats.ventas_totales || 0) + Number(stats.monto_pagos || 0)) : 0;
    const dailySales = `$${totalRevenue.toLocaleString()}`;
    const pendingOrders = stats?.productos_sin_stock || 0;

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.welcome}>Hola, Admin</Text>
                    <Text style={styles.date}>Sábado 14 de Marzo</Text>
                </View>

                {/* Card de Ventas */}
                <View style={styles.salesCard}>
                    <Text style={styles.salesLabel}>Ventas del Día</Text>
                    <Text style={styles.salesValue}>{dailySales}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>+15% vs ayer</Text>
                    </View>
                </View>

                {/* Accesos Rápidos */}
                <View style={styles.grid}>
                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Inventory')}>
                        <View style={[styles.iconBox, { backgroundColor: '#EBF8FF' }]}>
                            <Text style={{ fontSize: 24 }}>📦</Text>
                        </View>
                        <Text style={styles.gridLabel}>Inventario</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Payments')}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0FFF4' }]}>
                            <Text style={{ fontSize: 24 }}>💳</Text>
                        </View>
                        <Text style={styles.gridLabel}>Pagos</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF5F5' }]}>
                            <Text style={{ fontSize: 24 }}>📊</Text>
                        </View>
                        <Text style={styles.gridLabel}>Reportes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.gridItem}>
                        <View style={[styles.iconBox, { backgroundColor: '#FAF5FF' }]}>
                            <Text style={{ fontSize: 24 }}>🔔</Text>
                        </View>
                        <Text style={styles.gridLabel}>Alertas</Text>
                        {pendingOrders > 0 && <View style={styles.notifBadge}><Text style={styles.notifText}>{pendingOrders}</Text></View>}
                    </TouchableOpacity>
                </View>

                {/* Alerta de Stock Bajo */}
                <View style={styles.alertCard}>
                    <Text style={styles.alertTitle}>⚠️ Alerta de Stock</Text>
                    <Text style={styles.alertDesc}>3 productos por debajo del mínimo crítico.</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.secondary },
    content: { padding: SPACING.lg },
    header: { marginBottom: SPACING.xl },
    welcome: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
    date: { color: COLORS.gray, fontSize: 16 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    salesCard: { 
        backgroundColor: COLORS.primary, 
        padding: SPACING.xl, 
        borderRadius: 24, 
        marginBottom: SPACING.xl,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5
    },
    salesLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
    salesValue: { color: COLORS.white, fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
    badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
    gridItem: { 
        width: '47%', 
        backgroundColor: COLORS.white, 
        padding: SPACING.md, 
        borderRadius: 20, 
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
        position: 'relative'
    },
    iconBox: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    gridLabel: { fontWeight: '700', color: COLORS.text, fontSize: 14 },
    notifBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.error, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    notifText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold' },
    alertCard: { backgroundColor: '#FFF5F5', padding: SPACING.md, borderRadius: 16, marginTop: SPACING.xl, borderWidth: 1, borderColor: '#FED7D7' },
    alertTitle: { color: '#C53030', fontWeight: 'bold', fontSize: 16 },
    alertDesc: { color: '#9B2C2C', marginTop: 4 }
});

export default DashboardScreen;
