import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';

const ScannerScreen = () => {
  const devices = useCameraDevices();
  const device = devices.back;

  if (device == null) return <Text>Cargando cámara...</Text>;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Apunte al código de barras</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { position: 'absolute', bottom: 50, width: '100%', alignItems: 'center' },
  overlayText: { backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', padding: 10, borderRadius: 10 }
});

export default ScannerScreen;
