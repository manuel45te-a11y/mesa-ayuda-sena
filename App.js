import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { c, MODO } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: c.fondo }}>
        <AuthProvider>
          {/* La barra del sistema sigue a la paleta: texto claro sobre el tema
              oscuro y texto oscuro sobre el claro. */}
          <StatusBar style={MODO === 'claro' ? 'dark' : 'light'} />
          <RootNavigator />
        </AuthProvider>
      </View>
    </SafeAreaProvider>
  );
}
