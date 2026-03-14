// mobile/App.js
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import PaymentScreen from './src/screens/PaymentScreen';

const Root = () => {
    const { isAuthenticated, loading } = useAuth();
    const [currentScreen, setCurrentScreen] = React.useState('Dashboard');

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    if (!isAuthenticated) return <LoginScreen />;

    // Simulación de navegación simple por estado
    const navigation = {
        navigate: (screen) => setCurrentScreen(screen)
    };

    switch (currentScreen) {
        case 'Inventory': return <InventoryScreen navigation={navigation} />;
        case 'Payments': return <PaymentScreen navigation={navigation} />;
        default: return <DashboardScreen navigation={navigation} />;
    }
};

export default function App() {
    return (
        <AuthProvider>
            <Root />
        </AuthProvider>
    );
}
