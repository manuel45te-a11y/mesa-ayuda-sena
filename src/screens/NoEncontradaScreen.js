import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Pantalla from '../components/Pantalla';
import { Boton, Vacio } from '../components/ui';

// Se muestra cuando la dirección escrita no corresponde a ninguna pantalla.
export default function NoEncontradaScreen({ navigation, route }) {
  const { autenticado } = useAuth();
  const direccion = legible(route.path);

  return (
    <Pantalla sinScroll>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Vacio
          icono="buscar"
          titulo="Esta página no existe"
          detalle={
            direccion
              ? `No hay ninguna página en ${direccion}. Revisa la dirección o vuelve al inicio.`
              : 'Revisa la dirección o vuelve al inicio.'
          }
          accion={
            autenticado ? (
              <Boton titulo="Ir al inicio" onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })} />
            ) : (
              <Boton titulo="Ir a iniciar sesión" onPress={() => navigation.navigate('Login')} />
            )
          }
        />
      </View>
    </Pantalla>
  );
}

// "/esto%20no" -> "/esto no", sin los parámetros de la dirección.
function legible(ruta) {
  if (!ruta) return null;
  const sinParametros = ruta.split('?')[0];
  try {
    return decodeURI(sinParametros);
  } catch {
    return sinParametros;
  }
}
