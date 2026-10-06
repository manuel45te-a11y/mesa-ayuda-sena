import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { diasRestantes } from '../lib/sesion';
import Pantalla from '../components/Pantalla';
import { Boton, Chip, Encabezado, Panel, Rotulo, Separador } from '../components/ui';
import { Logotipo } from '../components/Icono';
import { TIPOS } from '../config/organizacion';
import { c, COLOR_ROLES, r, ROLES, s, t } from '../theme';
import { fechaCorta, iniciales } from '../lib/formato';

const ROLES_DEMO = [
  { rol: 'aprendiz', texto: 'Usuario' },
  { rol: 'tecnico', texto: 'Técnico' },
  { rol: 'admin', texto: 'Administrador' },
];

const TIPOS_DEMO = Object.entries(TIPOS).map(([tipo, datos]) => ({ tipo, texto: datos.corto }));

export default function PerfilScreen() {
  const { perfil, sesion, salir, demo, diasSesion, cambiarRolDemo, organizacion, cambiarTipoDemo } =
    useAuth();
  const rol = COLOR_ROLES[perfil?.rol] ?? COLOR_ROLES.aprendiz;
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

      {demo && (
        <Panel estilo={{ marginBottom: s.md, borderColor: c.marca, borderWidth: 1 }}>
          <Rotulo color={c.marcaAlta} estilo={{ marginBottom: 6 }}>
            Modo demostración · Cambiar de rol
          </Rotulo>
          <Text style={[t.pequeno, { color: c.textoSuave, marginBottom: s.md }]}>
            Prueba lo que puede hacer cada rol: el usuario reporta, el administrador asigna y el
            técnico sube evidencias y cierra.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
            {ROLES_DEMO.map((btn) => (
              <View key={btn.rol} style={{ flexGrow: 1, flexBasis: 110 }}>
                <Boton
                  titulo={btn.texto}
                  variante={perfil?.rol === btn.rol ? 'primario' : 'secundario'}
                  pequeno
                  ancho
                  onPress={() => cambiarRolDemo(btn.rol)}
                />
              </View>
            ))}
          </View>

          <Separador margen={s.lg} />

          <Rotulo color={c.marcaAlta} estilo={{ marginBottom: 6 }}>
            Tipo de organización
          </Rotulo>
          <Text style={[t.pequeno, { color: c.textoSuave, marginBottom: s.md }]}>
            La misma app sirve en cualquier lugar. Al cambiar el tipo cambian los nombres de los
            lugares, los datos que se piden al registrarse y los datos de ejemplo.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s.sm }}>
            {TIPOS_DEMO.map((btn) => (
              <View key={btn.tipo} style={{ flexGrow: 1, flexBasis: 110 }}>
                <Boton
                  titulo={btn.texto}
                  variante={organizacion.tipo === btn.tipo ? 'primario' : 'secundario'}
                  pequeno
                  ancho
                  onPress={() => cambiarTipoDemo(btn.tipo)}
                />
              </View>
            ))}
          </View>
        </Panel>
      )}

      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.md }}>Datos registrados</Rotulo>
        <Dato clave="Correo" valor={perfil?.correo ?? sesion?.user?.email} />
        {organizacion.campos.map((campo) => (
          <Dato key={campo.campo} clave={campo.etiqueta} valor={perfil?.[campo.campo]} />
        ))}
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
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[t.pequeno, { color: c.textoSuave, fontWeight: '600' }]}>
            {organizacion.producto} · versión 1.0.0
          </Text>
          <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11 }]} numberOfLines={1}>
            {organizacion.nombre || organizacion.etiqueta}
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
