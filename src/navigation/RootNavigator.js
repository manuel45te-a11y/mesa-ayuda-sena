import React from 'react';
import { View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { Cargando, useEscritorio } from '../components/ui';
import { BarraInferior, BarraLateral } from './Barras';
import { c } from '../theme';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import RecuperarClaveScreen from '../screens/RecuperarClaveScreen';
import InicioScreen from '../screens/InicioScreen';
import TicketsScreen from '../screens/TicketsScreen';
import NuevoTicketScreen from '../screens/NuevoTicketScreen';
import TicketDetalleScreen from '../screens/TicketDetalleScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tema = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: c.fondo,
    card: c.panel,
    border: c.linea,
    text: c.texto,
    primary: c.marca,
  },
};

function Tabs() {
  const { esAdmin } = useAuth();
  const escritorio = useEscritorio();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.fondo },
        // En escritorio la barra lateral va posicionada sobre el lienzo, así que
        // el contenedor de pestañas no debe reservar alto para ella.
        tabBarStyle: escritorio ? { display: 'none' } : undefined,
      }}
      tabBar={(props) => (escritorio ? <BarraLateral {...props} /> : <BarraInferior {...props} />)}
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Tickets" component={TicketsScreen} />
      {esAdmin && <Tab.Screen name="Tablero" component={DashboardScreen} />}
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { autenticado, cargando, recuperandoClave } = useAuth();

  if (cargando) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fondo, justifyContent: 'center' }}>
        <Cargando texto="Iniciando" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: c.fondo },
          animation: 'fade',
        }}
      >
        {recuperandoClave ? (
          <Stack.Screen name="RecuperarClave" component={RecuperarClaveScreen} />
        ) : !autenticado ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />
            <Stack.Screen name="RecuperarClave" component={RecuperarClaveScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="NuevoTicket" component={NuevoTicketScreen} />
            <Stack.Screen name="TicketDetalle" component={TicketDetalleScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
