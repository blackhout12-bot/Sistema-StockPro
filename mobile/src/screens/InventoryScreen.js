// mobile/src/screens/InventoryScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { COLORS, SPACING } from '../theme';

const InventoryScreen = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/productos');
            setProducts(res.data);
        } catch (err) {
            console.error('Error fetching products:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Text style={styles.productName}>{item.nombre}</Text>
                <Text style={styles.sku}>SKU: {item.sku || 'N/A'}</Text>
            </View>
            <View style={styles.stockContainer}>
                <Text style={styles.stockValue}>{item.stock}</Text>
                <Text style={styles.stockLabel}>Unidades</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Inventario</Text>
            </View>
            {loading ? (
                <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>
            ) : (
                <FlatList
                    data={products}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.list}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.secondary },
    header: { padding: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    list: { padding: SPACING.md },
    card: { 
        backgroundColor: COLORS.white, 
        padding: SPACING.md, 
        borderRadius: 16, 
        marginBottom: SPACING.md, 
        flexDirection: 'row', 
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 2,
    },
    cardInfo: { flex: 1 },
    productName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
    sku: { color: COLORS.gray, fontSize: 12, marginTop: 2 },
    stockContainer: { alignItems: 'flex-end' },
    stockValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
    stockLabel: { fontSize: 10, color: COLORS.gray }
});

export default InventoryScreen;
