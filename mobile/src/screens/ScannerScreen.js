// mobile/src/screens/ScannerScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../theme';

const ScannerScreen = () => {
    const [scannedData, setScannedData] = useState(null);

    // Scaffold para integración de cámara (e.g. react-native-vision-camera o react-native-camera)
    const simulateScan = () => {
        setScannedData('PROD-789-V2');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Escáner de Inventario</Text>
            
            <View style={styles.cameraPlaceholder}>
                <Text style={styles.placeholderText}>Cámara activa (Simulada)</Text>
            </View>

            {scannedData && (
                <View style={styles.resultBox}>
                    <Text style={styles.resultText}>Código: {scannedData}</Text>
                </View>
            )}

            <TouchableOpacity style={styles.scanBtn} onPress={simulateScan}>
                <Text style={styles.scanBtnText}>Simular Escaneo</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
    title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: SPACING.lg },
    cameraPlaceholder: { 
        height: 300, 
        backgroundColor: '#1E293B', 
        borderRadius: 20, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: SPACING.xl
    },
    placeholderText: { color: COLORS.white, fontWeight: '600' },
    resultBox: { padding: SPACING.md, backgroundColor: COLORS.success + '20', borderRadius: 12, marginBottom: SPACING.lg },
    resultText: { color: COLORS.success, fontWeight: 'bold', textAlign: 'center', fontSize: 16 },
    scanBtn: { backgroundColor: COLORS.primary, padding: SPACING.md, borderRadius: 12, alignItems: 'center' },
    scanBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 }
});

export default ScannerScreen;
