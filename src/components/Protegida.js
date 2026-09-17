import React from 'react';
import { View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { PANTALLAS, puedeEntrar } from '../navigation/rutas';
import Pantalla from './Pantalla';
import { Boton, Cargando, Vacio } from './ui';
import { ROLES } from '../theme';

// Envuelve una pantalla restringida por rol. Si el rol no alcanza, muestra un
// aviso en la misma dirección en lugar del contenido: quien abre el enlace
// entiende qué pasó, en vez de caer en otra pantalla sin explicación.
// Los roles de cada pantalla se declaran en navigation/rutas.js.
export function conPermiso(pantalla, Componente, { lateral = true } = {}) {
  function PantallaProtegida(props) {
    const { perfil } = useAuth();

    // Justo después de iniciar sesión el perfil tarda un instante en llegar.
    if (!perfil) {
      return (
        <Pantalla lateral={lateral} sinScroll>
          <Cargando />
        </Pantalla>
      );
    }

    if (!puedeEntrar(pantalla, perfil.rol)) {
      return <SinPermiso pantalla={pantalla} navigation={props.navigation} lateral={lateral} />;
    }

    return <Componente {...props} />;
  }

  PantallaProtegida.displayName = `ConPermiso(${pantalla})`;
  return PantallaProtegida;
}

function SinPermiso({ pantalla, navigation, lateral }) {
  const roles = (PANTALLAS[pantalla]?.roles ?? []).map((rol) => ROLES[rol] ?? rol).join(', ');

  return (
    <Pantalla lateral={lateral} sinScroll>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Vacio
          icono="candado"
          titulo="No tienes acceso a esta página"
          detalle={`Esta página es solo para: ${roles}. Si necesitas entrar, pídele acceso al administrador.`}
          accion={
            <Boton titulo="Ir al inicio" onPress={() => navigation.navigate('Tabs', { screen: 'Inicio' })} />
          }
        />
      </View>
    </Pantalla>
  );
}
