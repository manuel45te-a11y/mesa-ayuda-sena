import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { crearTicket } from '../lib/datos';
import { useAuth } from '../context/AuthContext';
import Pantalla from '../components/Pantalla';
import { Aviso, Boton, Campo, Encabezado, Panel, Rotulo } from '../components/ui';
import { c, PRIORIDADES, r, s, t } from '../theme';

export default function NuevoTicketScreen({ navigation }) {
  const { usuarioId } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    ambiente: '',
    prioridad: 'media',
  });

  const set = (campo) => (valor) => setForm((f) => ({ ...f, [campo]: valor }));

  async function onGuardar() {
    if (form.titulo.trim().length < 5) {
      setError('El título debe tener al menos 5 caracteres.');
      return;
    }
    if (form.descripcion.trim().length < 10) {
      setError('Describe la falla con al menos 10 caracteres.');
      return;
    }
    if (!form.categoria.trim()) {
      setError('Escribe el tipo de problema o falla.');
      return;
    }
    if (!form.ambiente.trim()) {
      setError('Escribe el ambiente o lugar donde ocurre.');
      return;
    }

    setError('');
    setEnviando(true);
    const { ticket, error: err } = await crearTicket(
      {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim(),
        categoria: form.categoria.trim(),
        ambiente: form.ambiente.trim(),
        prioridad: form.prioridad,
      },
      usuarioId
    );
    setEnviando(false);

    if (err || !ticket) {
      setError(err ?? 'No se pudo crear la solicitud.');
      return;
    }
    navigation.replace('TicketDetalle', { id: ticket.id, codigo: ticket.codigo });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Pantalla ancho={720}>
        <Encabezado
          rotulo="Reporte"
          titulo="Nueva solicitud"
          descripcion="Describe la novedad del ambiente para asignarle atención inmediata."
          volver={() => navigation.goBack()}
        />

        <Aviso texto={error} />

        <Panel estilo={{ gap: 0 }}>
          <Campo
            etiqueta="¿Qué está fallando?"
            valor={form.titulo}
            onChangeText={set('titulo')}
            placeholder="El videobeam no proyecta"
            contador={120}
          />

          <Campo
            etiqueta="Descripción"
            valor={form.descripcion}
            onChangeText={set('descripcion')}
            placeholder="Enciende pero la imagen se ve azul. Ya probamos con otro cable HDMI."
            multilinea
            ayuda="Cuenta qué pasó, desde cuándo y qué ya intentaste."
          />

          <Campo
            etiqueta="Tipo de problema o falla"
            valor={form.categoria}
            onChangeText={set('categoria')}
            placeholder="Ej: Red e internet, Videobeam, Software, Electricidad..."
            ayuda="Escribe el tipo de problema que se presenta."
          />

          <Campo
            etiqueta="Ambiente o ubicación"
            valor={form.ambiente}
            onChangeText={set('ambiente')}
            placeholder="Ej: A-101, Laboratorio de redes, Sala 2..."
            ayuda="Escribe el código o nombre del ambiente de formación."
          />

          <Rotulo color={c.textoSuave} estilo={{ marginBottom: s.sm }}>
            Prioridad
          </Rotulo>
          <View style={a.prioridades}>
            {Object.entries(PRIORIDADES).map(([valor, p]) => {
              const activo = form.prioridad === valor;
              return (
                <Pressable
                  key={valor}
                  onPress={() => set('prioridad')(valor)}
                  style={[
                    a.prioridad,
                    activo && { borderColor: p.color, backgroundColor: p.fondo },
                  ]}
                >
                  <View style={[a.puntoPrioridad, { backgroundColor: p.color }]} />
                  <Text
                    style={[
                      t.pequeno,
                      { color: activo ? p.color : c.textoSuave, fontWeight: activo ? '700' : '500' },
                    ]}
                  >
                    {p.etiqueta}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Panel>

        <View style={a.acciones}>
          <Boton titulo="Cancelar" variante="fantasma" onPress={() => navigation.goBack()} />
          <Boton titulo="Enviar solicitud" onPress={onGuardar} cargando={enviando} icono="check" />
        </View>
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

const a = StyleSheet.create({
  prioridades: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  prioridad: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: s.md,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    backgroundColor: c.panelAlto,
  },
  puntoPrioridad: { width: 7, height: 7, borderRadius: 4 },

  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: s.md, marginTop: s.lg },
});
