// mobile/src/screens/PaymentScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, ScrollView, Linking, ActivityIndicator, Alert } from 'react-native';
import api from '../services/api';
import { COLORS, SPACING } from '../theme';

const PaymentScreen = () => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('mercadopago');
    const [loading, setLoading] = useState(false);

    const handleInitPayment = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            return Alert.alert('Error', 'Por favor ingresa un monto válido');
        }

        setLoading(true);
        try {
            const res = await api.post('/payments/init', {
                monto: parseFloat(amount),
                moneda: 'ARS',
                metodo: method
            });

            if (res.data.initUrl) {
                // Abrir el enlace de pago en el navegador o app nativa
                const supported = await Linking.canOpenURL(res.data.initUrl);
                if (supported) {
                    await Linking.openURL(res.data.initUrl);
                } else {
                    Alert.alert('Error', 'No se pudo abrir el enlace de pago');
                }
            } else {
                Alert.alert('Error', 'No se recibió la URL de pago');
            }
        } catch (err) {
            console.error('Error initiating payment:', err);
            Alert.alert('Error', 'Hubo un fallo al generar el pago. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Cargar Crédito</Text>
                    <Text style={styles.subtitle}>Selecciona el monto y el método de pago</Text>
                </View>
                
                <View style={styles.card}>
                    <Text style={styles.label}>Monto a pagar (ARS)</Text>
                    <View style={styles.inputContainer}>
                        <Text style={styles.currencySymbol}>$</Text>
                        <TextInput
                            style={styles.input}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="numeric"
                            placeholder="0.00"
                            placeholderTextColor={COLORS.gray}
                        />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.label}>Método de pago</Text>
                    <View style={styles.methods}>
                        {[
                            { id: 'mercadopago', name: 'Mercado Pago' },
                            { id: 'stripe', name: 'Stripe' }
                        ].map(m => (
                            <TouchableOpacity 
                                key={m.id}
                                style={[styles.methodBtn, method === m.id && styles.methodBtnActive]}
                                onPress={() => setMethod(m.id)}
                            >
                                <View style={[styles.radio, method === m.id && styles.radioActive]}>
                                    {method === m.id && <View style={styles.radioInner} />}
                                </View>
                                <Text style={[styles.methodText, method === m.id && styles.methodTextActive]}>
                                    {m.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.payBtn, loading && styles.payBtnDisabled]} 
                    onPress={handleInitPayment}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.payBtnText}>Ir a Pagar</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Transacción protegida y segura</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    content: { padding: SPACING.lg },
    header: { marginBottom: SPACING.xl },
    title: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
    subtitle: { fontSize: 14, color: COLORS.gray },
    card: { 
        backgroundColor: COLORS.white, 
        borderRadius: 20, 
        padding: SPACING.lg, 
        marginBottom: SPACING.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    label: { color: COLORS.gray, marginBottom: SPACING.sm, fontWeight: '600', fontSize: 12, uppercase: true, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', alignItems: 'center' },
    currencySymbol: { fontSize: 32, fontWeight: 'bold', color: COLORS.text, marginRight: 8 },
    input: { flex: 1, fontSize: 32, fontWeight: 'bold', color: COLORS.text, padding: 0 },
    section: { marginBottom: SPACING.xl },
    methods: { gap: SPACING.md },
    methodBtn: { 
        flexDirection: 'row',
        height: 65, 
        borderWidth: 1.5, 
        borderColor: '#E2E8F0', 
        borderRadius: 16, 
        alignItems: 'center', 
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.white
    },
    methodBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    radioActive: { borderColor: COLORS.primary },
    radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
    methodText: { fontWeight: '600', color: COLORS.text, fontSize: 16 },
    methodTextActive: { color: COLORS.primary },
    payBtn: { height: 60, backgroundColor: COLORS.primary, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.md, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    payBtnDisabled: { opacity: 0.7 },
    payBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
    footer: { marginTop: SPACING.xl, alignItems: 'center' },
    footerText: { fontSize: 12, color: COLORS.gray }
});

export default PaymentScreen;
