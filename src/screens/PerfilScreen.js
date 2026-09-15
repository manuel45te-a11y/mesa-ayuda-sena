import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { diasRestantes } from '../lib/sesion';
import Pantalla from '../components/Pantalla';
import { Boton, Chip, Encabezado, Panel, Rotulo } from '../components/ui';
import { Logotipo } from '../components/Icono';
import { c, r, ROLES, s, t } from '../theme';
import { fechaCorta, iniciales } from '../lib/formato';

const COLOR_ROL = {
  aprendiz: { color: c.azul, fondo: c.azulBajo },
  tecnico: { color: c.cian, fondo: c.cianBajo },
  admin: { color: c.marcaAlta, fondo: c.marcaBaja },
};

export default function PerfilScreen() {
  const { perfil, sesion, salir, demo, diasSesion } = useAuth();
  const rol = COLOR_ROL[perfil?.rol] ?? COLOR_ROL.aprendiz;
  const [dias, setDias] = useState(null);

  useEffect(() => {
    if (demo) return;
    diasRestantes().then(setDias);
  }, [demo]);

  return (
    <Pantalla lateral ancho={720}>
      <Encabezado rotulo="Cuenta" titulo="Mi perfil" />

      <Panel estilo={{ marginBottom: s.md }}>
        <View style={a.cabeza}>
          <View style={a.avatar}>
            <Text style={a.avatarTexto}>{iniciales(perfil?.nombre)}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[t.titulo, { color: c.texto, fontSize: 19 }]}>{perfil?.nombre}</Text>
            <Chip texto={ROLES[perfil?.rol] ?? 'Usuario'} color={rol.color} fondo={rol.fondo} />
          </View>
        </View>
      </Panel>

      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.md }}>Datos registrados</Rotulo>
        <Dato clave="Correo" valor={sesion?.user?.email} />
        <Dato clave="Ficha" valor={perfil?.ficha} />
        <Dato clave="Programa" valor={perfil?.programa} />
        <Dato clave="Teléfono" valor={perfil?.telefono} />
        <Dato clave="Cuenta creada" valor={fechaCorta(perfil?.creado_at)} ultimo />
      </Panel>

      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.sm }}>Sesión</Rotulo>
        <Text style={[t.pequeno, { color: c.textoSuave, marginBottom: s.lg }]}>
          {dias === null
            ? `La sesión se cierra sola a los ${diasSesion} días y hay que volver a entrar.`
            : dias === 0
              ? 'Tu sesión vence hoy: tendrás que volver a iniciar sesión.'
              : `Quedan ${dias} ${dias === 1 ? 'día' : 'días'} antes de que la sesión caduque y tengas que volver a entrar.`}
        </Text>
        <Boton titulo="Cerrar sesión" icono="salir" variante="secundario" onPress={salir} />
      </Panel>

      <View style={a.pie}>
        <Logotipo tamano={26} />
        <View>
          <Text style={[t.pequeno, { color: c.textoSuave, fontWeight: '600' }]}>
            Mesa de Ayuda · versión 1.0.0
          </Text>
          <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11 }]}>
            Proyecto formativo · Gestión de incidencias en ambientes de formación
          </Text>
        </View>
      </View>
    </Pantalla>
  );
}

function Dato({ clave, valor, ultimo }) {
  return (
    <View style={[a.dato, ultimo && { borderBottomWidth: 0, paddingBottom: 0 }]}>
      <Text style={[t.pequeno, { color: c.textoTenue }]}>{clave}</Text>
      <Text style={[t.pequeno, { color: c.texto, fontWeight: '500' }]}>{valor || '—'}</Text>
    </View>
  );
}

const a = StyleSheet.create({
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: s.lg },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: r.md,
    backgroundColor: c.marcaBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { ...t.titulo, color: c.marcaAlta, fontSize: 19 },

  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s.lg,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.linea,
  },

  pie: { flexDirection: 'row', alignItems: 'center', gap: s.md, marginTop: s.lg, opacity: 0.8 },
});
