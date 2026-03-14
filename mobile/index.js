import React from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import ScannerScreen from './src/screens/ScannerScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Stock System Mobile' }} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Escanear Producto' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

AppRegistry.registerComponent('StockSystemMobile', () => App);
