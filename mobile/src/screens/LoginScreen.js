// mobile/src/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../theme';

const LoginScreen = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) return;
        setLoading(true);
        setError('');
        try {
            await login(email, password);
        } catch (err) {
            setError('Credenciales inválidas o error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <View style={styles.logo}>
                        <Text style={styles.logoText}>SP</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.title}>StockPro Mobile</Text>
                    <Text style={styles.subtitle}>Gestión de inventario en tiempo real</Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        style={styles.input}
                        placeholder="Correo Electrónico"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    
                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity 
                        style={[styles.button, loading && styles.buttonDisabled]} 
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Iniciar Sesión</Text>}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    content: { flex: 1, justifyContent: 'center', padding: SPACING.xl },
    logoContainer: { alignItems: 'center', marginBottom: SPACING.xl },
    logo: { width: 64, height: 64, backgroundColor: COLORS.primary, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    logoText: { color: COLORS.white, fontSize: 28, fontWeight: 'bold' },
    header: { alignItems: 'center', marginBottom: SPACING.xl },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
    subtitle: { color: COLORS.gray, marginTop: 4 },
    form: { gap: SPACING.md },
    input: { height: 50, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: SPACING.md, backgroundColor: COLORS.secondary },
    button: { height: 50, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: SPACING.sm },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
    errorText: { color: COLORS.error, fontSize: 13, textAlign: 'center' }
});

export default LoginScreen;
