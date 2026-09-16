import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icono, { Logotipo } from '../components/Icono';
import { useAuth } from '../context/AuthContext';
import { ANCHO_LATERAL, c, r, ROLES, s, t } from '../theme';
import { iniciales } from '../lib/formato';

const NOMBRES_VISIBLES = {
  Inicio: 'Inicio',
  Tickets: 'Solicitudes',
  Tablero: 'Tablero',
  Perfil: 'Perfil',
};

const ICONOS = {
  Inicio: 'panel',
  Tickets: 'bandeja',
  Tablero: 'pulso',
  Perfil: 'persona',
};

// ---------------------------------------------------------------------------
//  Barra lateral (pantallas anchas)
// ---------------------------------------------------------------------------
export function BarraLateral({ state, navigation }) {
  const { perfil, salir, demo, cambiarRolDemo } = useAuth();

  return (
    <View style={b.lateral}>
      <View style={b.marca}>
        <Logotipo tamano={34} />
        <View>
          <Text style={b.marcaNombre}>Mesa de Ayuda</Text>
          <Text style={b.marcaPie}>Ambientes de formación</Text>
        </View>
      </View>

      <View style={{ gap: 2 }}>
        {state.routes.map((ruta, i) => (
          <ItemLateral
            key={ruta.key}
            etiqueta={NOMBRES_VISIBLES[ruta.name] ?? ruta.name}
            icono={ICONOS[ruta.name]}
            activo={state.index === i}
            onPress={() => navigation.navigate(ruta.name)}
          />
        ))}
      </View>

      <View style={{ flex: 1 }} />

      {demo && (
        <View style={b.cajaSelectorRol}>
          <Text style={b.rolTitulo}>Alternar Rol (Demo)</Text>
          <View style={b.filaRoles}>
            {[
              { id: 'aprendiz', texto: 'Usuario' },
              { id: 'tecnico', texto: 'Técnico' },
              { id: 'admin', texto: 'Admin' },
            ].map((rItem) => {
              const activo = (perfil?.rol === rItem.id) || (rItem.id === 'aprendiz' && perfil?.rol === 'usuario');
              return (
                <Pressable
                  key={rItem.id}
                  onPress={() => cambiarRolDemo(rItem.id)}
                  style={[b.botonRol, activo && b.botonRolActivo]}
                >
                  <Text style={[b.textoBotonRol, activo && b.textoBotonRolActivo]}>
                    {rItem.texto}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={b.usuario}>
        <View style={b.avatar}>
          <Text style={b.avatarTexto}>{iniciales(perfil?.nombre)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={b.usuarioNombre} numberOfLines={1}>
            {perfil?.nombre ?? '—'}
          </Text>
          <Text style={b.usuarioRol} numberOfLines={1}>
            {ROLES[perfil?.rol] ?? ''}
          </Text>
        </View>
        <Pressable onPress={salir} hitSlop={8} style={b.salir}>
          <Icono nombre="salir" tamano={16} color={c.textoTenue} />
        </Pressable>
      </View>
    </View>
  );
}

function ItemLateral({ etiqueta, icono, activo, onPress }) {
  const [encima, setEncima] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setEncima(true)}
      onHoverOut={() => setEncima(false)}
      style={[
        b.item,
        encima && !activo && { backgroundColor: c.panel },
        activo && { backgroundColor: c.marcaBaja },
      ]}
    >
      {activo && <View style={b.itemMarca} />}
      <Icono nombre={icono} tamano={18} color={activo ? c.marcaAlta : c.textoSuave} grosor={activo ? 1.9 : 1.6} />
      <Text style={[b.itemTexto, activo && { color: c.texto, fontWeight: '600' }]}>{etiqueta}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Barra inferior (móvil)
// ---------------------------------------------------------------------------
export function BarraInferior({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[b.inferior, { paddingBottom: Math.max(insets.bottom, s.sm) }]}>
      {state.routes.map((ruta, i) => {
        const activo = state.index === i;
        return (
          <Pressable
            key={ruta.key}
            onPress={() => navigation.navigate(ruta.name)}
            style={b.pestana}
          >
            <View style={[b.pestanaIcono, activo && { backgroundColor: c.marcaBaja }]}>
              <Icono
                nombre={ICONOS[ruta.name]}
                tamano={19}
                color={activo ? c.marcaAlta : c.textoTenue}
                grosor={activo ? 1.9 : 1.6}
              />
            </View>
            <Text style={[b.pestanaTexto, activo && { color: c.marcaAlta, fontWeight: '700' }]}>
              {NOMBRES_VISIBLES[ruta.name] ?? ruta.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const b = StyleSheet.create({
  lateral: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ANCHO_LATERAL,
    backgroundColor: c.fondo,
    borderRightWidth: 1,
    borderRightColor: c.linea,
    paddingHorizontal: s.md,
    paddingVertical: s.xl,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    paddingHorizontal: s.sm,
    marginBottom: s.xl,
  },
  marcaNombre: { ...t.cuerpo, color: c.texto, fontWeight: '700', letterSpacing: -0.2 },
  marcaPie: { ...t.pequeno, color: c.textoTenue, fontSize: 11 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    height: 42,
    paddingHorizontal: s.md,
    borderRadius: r.md,
  },
  itemMarca: {
    position: 'absolute',
    left: 0,
    top: 11,
    bottom: 11,
    width: 2.5,
    borderRadius: r.full,
    backgroundColor: c.marca,
  },
  itemTexto: { ...t.cuerpo, color: c.textoSuave, fontSize: 13.5 },

  cajaSelectorRol: {
    padding: 8,
    backgroundColor: c.panelAlto,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    marginBottom: s.sm,
  },
  rolTitulo: {
    ...t.micro,
    color: c.textoTenue,
    fontSize: 9.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  filaRoles: {
    flexDirection: 'row',
    gap: 4,
  },
  botonRol: {
    flex: 1,
    paddingVertical: 4,
    borderRadius: r.sm,
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.linea,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonRolActivo: {
    backgroundColor: c.marcaBaja,
    borderColor: c.marca,
  },
  textoBotonRol: {
    ...t.micro,
    color: c.textoTenue,
    fontSize: 10,
    fontWeight: '600',
  },
  textoBotonRolActivo: {
    color: c.marcaAlta,
    fontWeight: '700',
  },

  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    padding: s.sm,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    backgroundColor: c.panel,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: r.sm,
    backgroundColor: c.marcaBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { ...t.pequeno, color: c.marcaAlta, fontWeight: '700' },
  usuarioNombre: { ...t.pequeno, color: c.texto, fontWeight: '600' },
  usuarioRol: { ...t.pequeno, color: c.textoTenue, fontSize: 10.5 },
  salir: { padding: 4 },

  inferior: {
    flexDirection: 'row',
    backgroundColor: c.panel,
    borderTopWidth: 1,
    borderTopColor: c.linea,
    paddingTop: s.sm,
    ...Platform.select({ web: { paddingBottom: s.sm } }),
  },
  pestana: { flex: 1, alignItems: 'center', gap: 3 },
  pestanaIcono: {
    width: 46,
    height: 26,
    borderRadius: r.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pestanaTexto: { ...t.pequeno, color: c.textoTenue, fontSize: 10.5 },
});
