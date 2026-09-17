import React from 'react';
import { View } from 'react-native';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { Cargando, useEscritorio } from '../components/ui';
import { conPermiso } from '../components/Protegida';
import { BarraInferior, BarraLateral } from './Barras';
import { linking, tituloDocumento } from './rutas';
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
import UsuariosScreen from '../screens/UsuariosScreen';
import NoEncontradaScreen from '../screens/NoEncontradaScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Se declara fuera de los componentes para no crear una pantalla nueva en
// cada render (eso la desmontaría y perdería su estado).
const TableroProtegido = conPermiso('Tablero', DashboardScreen);
const UsuariosProtegido = conPermiso('Usuarios', UsuariosScreen);

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
      {/* Registradas para todos: quien no es administrador ve el aviso de acceso
          y las barras ocultan estas pestañas (ver rutas.js). */}
      <Tab.Screen name="Tablero" component={TableroProtegido} />
      <Tab.Screen name="Usuarios" component={UsuariosProtegido} />
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
    <NavigationContainer
      theme={tema}
      linking={linking}
      documentTitle={{ formatter: (_opciones, ruta) => tituloDocumento(ruta) }}
      fallback={
        <View style={{ flex: 1, backgroundColor: c.fondo, justifyContent: 'center' }}>
          <Cargando texto="Abriendo" />
        </View>
      }
    >
      <Stack.Navigator
        // Si alguien abre un enlace sin haber iniciado sesión (por ejemplo
        // /solicitudes/MA-2026-0004), primero ve el acceso y, al entrar, llega
        // a la página que había pedido.
        UNSTABLE_routeNamesChangeBehavior="lastUnhandled"
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
            <Stack.Screen name="NoEncontrada" component={NoEncontradaScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Tabs" component={Tabs} />
            <Stack.Screen name="NuevoTicket" component={NuevoTicketScreen} />
            <Stack.Screen name="TicketDetalle" component={TicketDetalleScreen} />
            <Stack.Screen name="NoEncontrada" component={NoEncontradaScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
