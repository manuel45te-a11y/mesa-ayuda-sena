import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { traducirError } from '../lib/errores';
import { Aviso, Boton, Campo, Rotulo } from '../components/ui';
import Icono, { Logotipo } from '../components/Icono';
import { c, r, s, t } from '../theme';

export default function RecuperarClaveScreen({ navigation }) {
  const { recuperarClave, actualizarClave, recuperandoClave, cancelarRecuperacion, demo } = useAuth();

  const [correo, setCorreo] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [confirmarClave, setConfirmarClave] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function onSolicitarEnlace() {
    if (!correo.trim()) {
      setError('Escribe tu correo electrónico.');
      return;
    }

    setError('');
    setCargando(true);
    const mensaje = await recuperarClave(correo.trim());
    setCargando(false);

    if (mensaje) {
      setError(traducirError(mensaje));
      return;
    }

    setEnviado(true);
    setOk(
      demo
        ? 'En modo demostración no se envían correos reales, pero la prueba fue exitosa.'
        : `Enviamos un enlace de recuperación a ${correo.trim()}. Revisa tu bandeja de entrada o spam.`
    );
  }

  async function onActualizarClave() {
    if (!nuevaClave) {
      setError('Escribe la nueva contraseña.');
      return;
    }
    if (nuevaClave.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaClave !== confirmarClave) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setError('');
    setCargando(true);
    const mensaje = await actualizarClave(nuevaClave);
    setCargando(false);

    if (mensaje) {
      setError(traducirError(mensaje));
      return;
    }

    setOk('Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva clave.');
    setTimeout(() => {
      cancelarRecuperacion();
      navigation.replace('Login');
    }, 1500);
  }

  function volver() {
    cancelarRecuperacion();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Login');
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={a.scroll}>
        <View style={a.marco}>
          <Pressable onPress={volver} style={a.volver} hitSlop={8}>
            <Icono nombre="atras" tamano={17} color={c.textoSuave} />
            <Text style={[t.pequeno, { color: c.textoSuave }]}>Volver al inicio de sesión</Text>
          </Pressable>

          <View style={a.caja}>
            <Logotipo tamano={38} />

            {recuperandoClave ? (
              <>
                <Rotulo estilo={{ marginTop: s.lg, marginBottom: s.sm }}>Seguridad</Rotulo>
                <Text style={a.titulo}>Nueva contraseña</Text>
                <Text style={a.subtitulo}>
                  Ingresa tu nueva clave para acceder a la mesa de ayuda.
                </Text>

                <Aviso texto={error} />
                <Aviso texto={ok} tipo="ok" />

                <Campo
                  etiqueta="Nueva contraseña"
                  valor={nuevaClave}
                  onChangeText={setNuevaClave}
                  placeholder="Mínimo 6 caracteres"
                  secure
                />
                <Campo
                  etiqueta="Confirmar nueva contraseña"
                  valor={confirmarClave}
                  onChangeText={setConfirmarClave}
                  placeholder="Repite la contraseña"
                  secure
                />

                <Boton
                  titulo="Guardar nueva contraseña"
                  icono="check"
                  onPress={onActualizarClave}
                  cargando={cargando}
                  ancho
                />
              </>
            ) : enviado ? (
              <View style={{ alignItems: 'center', marginTop: s.lg }}>
                <View style={a.sobre}>
                  <Icono nombre="bandeja" tamano={26} color={c.marcaAlta} />
                </View>

                <Text style={[a.titulo, { textAlign: 'center' }]}>Revisa tu correo</Text>
                <Text style={a.textoExito}>
                  Enviamos las instrucciones a{' '}
                  <Text style={{ color: c.texto, fontWeight: '700' }}>{correo.trim()}</Text>. Abre
                  el enlace para crear una nueva contraseña.
                </Text>

                <Aviso texto={ok} tipo="ok" />

                <Boton
                  titulo="Volver al inicio de sesión"
                  onPress={volver}
                  ancho
                />
                <View style={{ height: s.sm }} />
                <Boton
                  titulo="Reenviar enlace"
                  variante="secundario"
                  onPress={onSolicitarEnlace}
                  cargando={cargando}
                  ancho
                />
              </View>
            ) : (
              <>
                <Rotulo estilo={{ marginTop: s.lg, marginBottom: s.sm }}>Recuperación</Rotulo>
                <Text style={a.titulo}>¿Olvidaste tu contraseña?</Text>
                <Text style={a.subtitulo}>
                  Escribe el correo con el que te registraste y te enviaremos un enlace para restablecerla.
                </Text>

                <Aviso texto={error} />

                <Campo
                  etiqueta="Correo electrónico"
                  valor={correo}
                  onChangeText={setCorreo}
                  placeholder="tucorreo@ejemplo.com"
                  teclado="email-address"
                  autoCapitalize="none"
                />

                <Boton
                  titulo="Enviar enlace al correo"
                  icono="correo"
                  onPress={onSolicitarEnlace}
                  cargando={cargando}
                  ancho
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const a = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: s.lg },
  marco: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: s.md },
  caja: {
    width: '100%',
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.linea,
    borderRadius: r.xl,
    padding: s.xl,
  },
  titulo: { ...t.titulo, color: c.texto },
  subtitulo: { ...t.pequeno, color: c.textoSuave, marginTop: 4, marginBottom: s.xl },

  sobre: {
    width: 56,
    height: 56,
    borderRadius: r.lg,
    backgroundColor: c.marcaBaja,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.lg,
  },
  textoExito: {
    ...t.cuerpo,
    color: c.textoSuave,
    textAlign: 'center',
    marginTop: s.sm,
    marginBottom: s.xl,
    lineHeight: 21,
  },
});
