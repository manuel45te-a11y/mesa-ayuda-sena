import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { configurado } from '../lib/supabase';
import { traducirError } from '../lib/errores';
import { Aviso, Boton, Campo, Rotulo, useEscritorio } from '../components/ui';
import Icono, { Logotipo } from '../components/Icono';
import { c, r, s, t } from '../theme';

const VENTAJAS = [
  { icono: 'bandeja', texto: 'Cada reporte queda registrado con fecha y autor' },
  { icono: 'reloj', texto: 'Tiempo de atención acordado por tipo de falla' },
  { icono: 'pulso', texto: 'Indicadores reales del servicio de soporte' },
];

export default function LoginScreen({ navigation }) {
  const { entrar, entrarDemo, reenviarVerificacion, caducada, diasSesion } = useAuth();
  const escritorio = useEscritorio();

  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [cargando, setCargando] = useState(false);
  const [sinConfirmar, setSinConfirmar] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  async function onEntrar() {
    if (!correo || !clave) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setError('');
    setCargando(true);
    const mensaje = await entrar({ correo, clave });
    setCargando(false);

    if (mensaje) {
      setError(traducirError(mensaje));
      setSinConfirmar(mensaje.includes('not confirmed'));
    }
  }

  async function onReenviar() {
    setReenviando(true);
    const mensaje = await reenviarVerificacion(correo);
    setReenviando(false);
    setError(mensaje ? traducirError(mensaje) : '');
    if (!mensaje) {
      setSinConfirmar(false);
      setAviso('Te enviamos otro correo de verificación. Ábrelo y vuelve a entrar.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={a.scroll}>
        <View style={[a.marco, escritorio && a.marcoAncho]}>
          {/* Panel de marca, solo en pantallas anchas */}
          {escritorio && (
            <View style={a.presentacion}>
              <Logotipo tamano={46} />
              <Text style={a.presentacionTitulo}>El soporte del centro, ordenado</Text>
              <Text style={a.presentacionTexto}>
                Un solo lugar para reportar las fallas de los ambientes, asignarles responsable
                y saber cuánto se tarda en resolverlas.
              </Text>

              <View style={{ gap: s.md, marginTop: s.xl }}>
                {VENTAJAS.map((v) => (
                  <View key={v.texto} style={a.ventaja}>
                    <View style={a.ventajaIcono}>
                      <Icono nombre={v.icono} tamano={15} color={c.marcaAlta} />
                    </View>
                    <Text style={a.ventajaTexto}>{v.texto}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Formulario */}
          <View style={a.formulario}>
            {!escritorio && (
              <View style={a.marcaMovil}>
                <Logotipo tamano={38} />
                <View>
                  <Text style={a.marcaNombre}>Mesa de Ayuda</Text>
                  <Text style={a.marcaPie}>Ambientes de formación</Text>
                </View>
              </View>
            )}

            <Rotulo estilo={{ marginBottom: s.sm }}>Acceso</Rotulo>
            <Text style={a.titulo}>Inicia sesión</Text>
            <Text style={a.subtitulo}>Usa el correo con el que te registraste.</Text>

            {!configurado && (
              <Aviso
                tipo="info"
                texto="Falta conectar Supabase. Copia .env.example como .env, pega tu URL y tu anon key, y reinicia el servidor."
              />
            )}
            {caducada && (
              <Aviso
                tipo="info"
                texto={`Tu sesión se cerró al cumplir ${diasSesion} días. Vuelve a iniciar sesión para continuar.`}
              />
            )}
            <Aviso texto={error} />
            <Aviso texto={aviso} tipo="ok" />

            {sinConfirmar && (
              <View style={{ marginBottom: s.lg }}>
                <Boton
                  titulo="Reenviar el correo de verificación"
                  variante="secundario"
                  onPress={onReenviar}
                  cargando={reenviando}
                  ancho
                  pequeno
                />
              </View>
            )}

            <Campo
              etiqueta="Correo electrónico"
              valor={correo}
              onChangeText={setCorreo}
              placeholder="tucorreo@ejemplo.com"
              teclado="email-address"
              autoCapitalize="none"
            />
            <Campo
              etiqueta="Contraseña"
              valor={clave}
              onChangeText={setClave}
              placeholder="••••••••"
              secure
            />

            <View style={{ alignItems: 'flex-end', marginTop: -4, marginBottom: s.lg }}>
              <Pressable
                onPress={() => navigation.navigate('RecuperarClave')}
                hitSlop={8}
              >
                <Text style={{ ...t.pequeno, color: c.marcaAlta, fontWeight: '600' }}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>
            </View>

            <Boton titulo="Entrar" onPress={onEntrar} cargando={cargando} ancho />

            <View style={a.separador}>
              <View style={a.raya} />
              <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11 }]}>o</Text>
              <View style={a.raya} />
            </View>

            <Boton
              titulo="Entrar sin cuenta"
              variante="secundario"
              icono="pulso"
              onPress={entrarDemo}
              ancho
            />
            <Text style={a.notaDemo}>
              Modo demostración con datos de ejemplo. No toca la base de datos.
            </Text>

            <View style={a.pie}>
              <Text style={[t.pequeno, { color: c.textoTenue }]}>¿Todavía no tienes cuenta?</Text>
              <Pressable onPress={() => navigation.navigate('Registro')} hitSlop={6}>
                <Text style={a.enlace}>Crear una</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const a = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: s.lg },
  marco: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  marcoAncho: {
    maxWidth: 940,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: s.xxxl,
    borderWidth: 1,
    borderColor: c.linea,
    borderRadius: r.xl,
    backgroundColor: c.panel,
    padding: s.xxl,
  },

  // minWidth 0 evita que el texto largo empuje el ancho de la columna y
  // desborde el marco (min-width auto de flexbox).
  presentacion: { flex: 1, minWidth: 0, justifyContent: 'center', paddingRight: s.lg },
  presentacionTitulo: {
    ...t.display,
    color: c.texto,
    marginTop: s.xl,
    fontSize: 26,
    lineHeight: 33,
  },
  presentacionTexto: { ...t.cuerpo, color: c.textoSuave, marginTop: s.md, maxWidth: 360 },
  ventaja: { flexDirection: 'row', alignItems: 'center', gap: s.md },
  ventajaIcono: {
    width: 30,
    height: 30,
    borderRadius: r.sm,
    backgroundColor: c.marcaBaja,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ventajaTexto: { ...t.pequeno, color: c.textoSuave, flex: 1 },

  formulario: {
    flex: 1,
    minWidth: 0,
    maxWidth: 380,
    justifyContent: 'center',
  },
  marcaMovil: { flexDirection: 'row', alignItems: 'center', gap: s.md, marginBottom: s.xxl },
  marcaNombre: { ...t.cuerpo, color: c.texto, fontWeight: '700' },
  marcaPie: { ...t.pequeno, color: c.textoTenue, fontSize: 11 },

  titulo: { ...t.titulo, color: c.texto },
  subtitulo: { ...t.pequeno, color: c.textoSuave, marginTop: 4, marginBottom: s.xl },

  separador: { flexDirection: 'row', alignItems: 'center', gap: s.md, marginVertical: s.lg },
  raya: { flex: 1, height: 1, backgroundColor: c.linea },
  notaDemo: {
    ...t.pequeno,
    color: c.textoTenue,
    fontSize: 11,
    textAlign: 'center',
    marginTop: s.sm,
  },

  pie: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: s.lg },
  enlace: { ...t.pequeno, color: c.marcaAlta, fontWeight: '700' },
});
