import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEscritorio } from './ui';
import Icono from './Icono';
import { useAuth } from '../context/AuthContext';
import { ANCHO_LATERAL, c, r, s, t } from '../theme';

// Contenedor común de todas las pantallas: reserva el espacio de la barra
// lateral en escritorio y centra el contenido con un ancho máximo legible.
export default function Pantalla({
  children,
  lateral = false,
  ancho = 940,
  refrescando,
  onRefrescar,
  sinScroll,
}) {
  const escritorio = useEscritorio();
  const insets = useSafeAreaInsets();
  const { demo } = useAuth();

  const relleno = {
    paddingLeft: (lateral && escritorio ? ANCHO_LATERAL : 0) + (escritorio ? s.xxl : s.lg),
    paddingRight: escritorio ? s.xxl : s.lg,
    paddingTop: (escritorio ? s.xxl : s.xl) + (escritorio ? 0 : insets.top),
    paddingBottom: s.xxxl,
  };

  const contenido = (
    <View style={{ width: '100%', maxWidth: ancho, alignSelf: 'center' }}>
      {demo && (
        <View style={p.cinta}>
          <Icono nombre="alerta" tamano={14} color={c.ambar} />
          <Text style={p.cintaTexto}>
            Modo demostración · los datos son de ejemplo y se pierden al recargar
          </Text>
        </View>
      )}
      {children}
    </View>
  );

  if (sinScroll) {
    return (
      <View style={{ flex: 1, backgroundColor: c.fondo, ...relleno }}>
        <View style={{ flex: 1, width: '100%', maxWidth: ancho, alignSelf: 'center' }}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.fondo }}
      contentContainerStyle={relleno}
      refreshControl={
        onRefrescar ? (
          <RefreshControl
            refreshing={!!refrescando}
            onRefresh={onRefrescar}
            tintColor={c.marca}
            colors={[c.marca]}
            progressBackgroundColor={c.panel}
          />
        ) : undefined
      }
    >
      {contenido}
    </ScrollView>
  );
}

const p = StyleSheet.create({
  cinta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: c.ambarBajo,
    borderRadius: r.sm,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    marginBottom: s.lg,
  },
  cintaTexto: { ...t.pequeno, color: c.ambar, fontSize: 11.5, flex: 1, minWidth: 0 },
});
