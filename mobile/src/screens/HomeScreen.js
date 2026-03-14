import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Control</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Scanner')}>
        <Text style={styles.buttonText}>Abrir Escáner (Zebra/Cámara)</Text>
      </TouchableOpacity>
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Estado: Online</Text>
        <Text style={styles.statusText}>Sincronización: Completada</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  button: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusBox: { marginTop: 40, padding: 15, backgroundColor: '#e9ecef', borderRadius: 8 },
  statusText: { fontSize: 14, color: '#666' }
});

export default HomeScreen;
