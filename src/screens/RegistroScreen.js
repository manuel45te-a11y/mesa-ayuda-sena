import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { traducirError } from '../lib/errores';
import { Aviso, Boton, Campo, Rotulo, Separador } from '../components/ui';
import Icono, { Logotipo } from '../components/Icono';
import { c, r, s, t } from '../theme';

export default function RegistroScreen({ navigation }) {
  const { registrar, reenviarVerificacion } = useAuth();
  const [datos, setDatos] = useState({
    nombre: '',
    correo: '',
    clave: '',
    rol: 'aprendiz',
    ficha: '',
    programa: '',
    telefono: '',
  });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [porVerificar, setPorVerificar] = useState(false);

  const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }));

  async function onRegistrar() {
    if (!datos.nombre || !datos.correo || !datos.clave) {
      setError('El nombre, el correo y la contraseña son obligatorios.');
      return;
    }
    if (datos.clave.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setError('');
    setCargando(true);
    const { error: mensaje, requiereConfirmacion } = await registrar(datos);
    setCargando(false);

    if (mensaje) {
      setError(traducirError(mensaje));
      return;
    }

    if (requiereConfirmacion) {
      setPorVerificar(true);
      return;
    }

    setOk('Cuenta creada. Ya puedes iniciar sesión.');
    setTimeout(() => navigation.replace('Login'), 1200);
  }

  async function onReenviar() {
    setReenviando(true);
    const mensaje = await reenviarVerificacion(datos.correo);
    setReenviando(false);
    if (mensaje) setError(traducirError(mensaje));
    else setOk('Te lo enviamos de nuevo. Revisa tu correo.');
  }

  // Pantalla de espera: la cuenta existe pero falta abrir el enlace.
  if (porVerificar) {
    return (
      <View style={a.centro}>
        <View style={[a.caja, { alignItems: 'center' }]}>
          <View style={a.sobre}>
            <Icono nombre="bandeja" tamano={26} color={c.marcaAlta} />
          </View>

          <Text style={[a.titulo, { textAlign: 'center' }]}>Revisa tu correo</Text>
          <Text style={a.textoVerificar}>
            Enviamos un enlace de verificación a{' '}
            <Text style={{ color: c.texto, fontWeight: '700' }}>{datos.correo}</Text>. Ábrelo
            para activar la cuenta; hasta entonces no podrás iniciar sesión.
          </Text>

          <Aviso texto={error} />
          <Aviso texto={ok} tipo="ok" />

          <Boton titulo="Ya lo confirmé, iniciar sesión" onPress={() => navigation.replace('Login')} ancho />
          <View style={{ height: s.sm }} />
          <Boton
            titulo="Reenviar el correo"
            variante="secundario"
            onPress={onReenviar}
            cargando={reenviando}
            ancho
          />

          <Text style={a.pista}>
            Si no aparece en unos minutos, míralo en la carpeta de correo no deseado.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={a.scroll}>
        <View style={a.marco}>
          <Pressable onPress={() => navigation.goBack()} style={a.volver} hitSlop={8}>
            <Icono nombre="atras" tamano={17} color={c.textoSuave} />
            <Text style={[t.pequeno, { color: c.textoSuave }]}>Volver</Text>
          </Pressable>

          <View style={a.caja}>
            <Logotipo tamano={38} />
            <Rotulo estilo={{ marginTop: s.lg, marginBottom: s.sm }}>Nueva cuenta</Rotulo>
            <Text style={a.titulo}>Crea tu usuario</Text>
            <Text style={a.subtitulo}>
              Con esta cuenta podrás reportar fallas y seguir su atención.
            </Text>

            <Aviso texto={error} />
            <Aviso texto={ok} tipo="ok" />

            <Campo
              etiqueta="Nombre completo"
              valor={datos.nombre}
              onChangeText={set('nombre')}
              placeholder="Nombre y apellido"
            />
            <Campo
              etiqueta="Correo electrónico"
              valor={datos.correo}
              onChangeText={set('correo')}
              placeholder="tucorreo@ejemplo.com"
              teclado="email-address"
              autoCapitalize="none"
              ayuda="Te enviaremos un enlace para verificarlo."
            />
            <Campo
              etiqueta="Contraseña"
              valor={datos.clave}
              onChangeText={set('clave')}
              placeholder="Mínimo 6 caracteres"
              secure
            />

            <View style={{ marginBottom: s.lg }}>
              <Rotulo color={c.textoSuave} estilo={{ marginBottom: s.sm }}>
                Rol en el sistema
              </Rotulo>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { valor: 'aprendiz', etiqueta: 'Usuario', icono: 'persona', desc: 'Crea tickets' },
                  { valor: 'tecnico', etiqueta: 'Técnico', icono: 'llave', desc: 'Atiende y evidencia' },
                  { valor: 'admin', etiqueta: 'Administrador', icono: 'escudo', desc: 'Asigna y coordina' },
                ].map((item) => {
                  const seleccionado = datos.rol === item.valor;
                  return (
                    <Pressable
                      key={item.valor}
                      onPress={() => set('rol')(item.valor)}
                      style={[
                        {
                          flex: 1,
                          paddingVertical: s.sm,
                          paddingHorizontal: 8,
                          borderRadius: r.md,
                          borderWidth: 1.5,
                          borderColor: seleccionado ? c.marca : c.linea,
                          backgroundColor: seleccionado ? c.marcaBaja : c.panelAlto,
                          alignItems: 'center',
                          gap: 4,
                        },
                      ]}
                    >
                      <Icono
                        nombre={item.icono}
                        tamano={16}
                        color={seleccionado ? c.marcaAlta : c.textoTenue}
                      />
                      <Text
                        style={[
                          t.pequeno,
                          {
                            color: seleccionado ? c.texto : c.textoSuave,
                            fontWeight: seleccionado ? '700' : '500',
                            fontSize: 12,
                          },
                        ]}
                      >
                        {item.etiqueta}
                      </Text>
                      <Text
                        style={[
                          t.micro,
                          {
                            color: seleccionado ? c.marcaAlta : c.textoTenue,
                            fontSize: 9.5,
                            textAlign: 'center',
                          },
                        ]}
                      >
                        {item.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Separador margen={s.sm} />
            <Rotulo estilo={{ marginBottom: s.md }}>Datos opcionales</Rotulo>

            <Campo
              etiqueta="Teléfono"
              valor={datos.telefono}
              onChangeText={set('telefono')}
              placeholder="300 000 0000"
              teclado="phone-pad"
            />

            <Campo
              etiqueta="Número de ficha"
              valor={datos.ficha}
              onChangeText={set('ficha')}
              placeholder="Ej: 2758412"
              teclado="numeric"
              ayuda="Escribe tu número de ficha SAR."
            />

            <Campo
              etiqueta="Programa de formación"
              valor={datos.programa}
              onChangeText={set('programa')}
              placeholder="Ej: Análisis y Desarrollo de Software"
              ayuda="Escribe el nombre del programa al que perteneces."
            />

            <Boton titulo="Crear cuenta" onPress={onRegistrar} cargando={cargando} ancho />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const a = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: s.lg },
  centro: { flex: 1, backgroundColor: c.fondo, justifyContent: 'center', padding: s.lg },
  marco: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: s.md },
  caja: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
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
  textoVerificar: {
    ...t.cuerpo,
    color: c.textoSuave,
    textAlign: 'center',
    marginTop: s.sm,
    marginBottom: s.xl,
    lineHeight: 21,
  },
  pista: {
    ...t.pequeno,
    color: c.textoTenue,
    textAlign: 'center',
    marginTop: s.lg,
    fontSize: 11.5,
  },
});
