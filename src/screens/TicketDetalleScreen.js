import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { actualizarTicket, obtenerTicket } from '../lib/datos';
import { useAuth } from '../context/AuthContext';
import Pantalla from '../components/Pantalla';
import Icono from '../components/Icono';
import {
  Aviso,
  Boton,
  Campo,
  Cargando,
  Chip,
  Encabezado,
  Panel,
  Rotulo,
  useEscritorio,
} from '../components/ui';
import { c, ESTADOS, PRIORIDADES, r, s, t } from '../theme';
import { fechaHora, horas, sla } from '../lib/formato';

export default function TicketDetalleScreen({ route, navigation }) {
  const { id } = route.params;
  const { usuarioId, esSoporte, esAdmin } = useAuth();
  const escritorio = useEscritorio();

  const [ticket, setTicket] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [solucion, setSolucion] = useState('');

  const cargar = useCallback(async () => {
    const { ticket: fila, eventos: bitacora, error: err } = await obtenerTicket(id);
    if (err) setError(err);
    setTicket(fila);
    setEventos(bitacora);
    setCargando(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  async function actualizar(cambios) {
    setGuardando(true);
    setError('');
    const { error: err } = await actualizarTicket(id, cambios);
    setGuardando(false);
    if (err) {
      setError(err);
    } else {
      setError('');
      setSolucion('');
      await cargar();
    }
  }

  if (cargando) {
    return (
      <Pantalla sinScroll>
        <Cargando texto="Abriendo solicitud" />
      </Pantalla>
    );
  }

  if (!ticket) {
    return (
      <Pantalla>
        <Encabezado titulo="Solicitud no disponible" volver={() => navigation.goBack()} />
        <Aviso texto="No se encontró la solicitud o tu rol no tiene permiso para verla." />
      </Pantalla>
    );
  }

  const estado = ESTADOS[ticket.estado] ?? ESTADOS.pendiente;
  const prioridad = PRIORIDADES[ticket.prioridad] ?? PRIORIDADES.media;
  const reloj = sla(ticket.creado_at, ticket.vence_at, ticket.estado);
  const soyTecnico = ticket.tecnico_id === usuarioId;
  const terminado = ['resuelto', 'cancelado'].includes(ticket.estado);
  const puedeGestionar = esSoporte || soyTecnico || esAdmin;

  const columnaAcciones = (
    <>
      {/* Estado del acuerdo de servicio */}
      <Panel estilo={{ marginBottom: s.md }}>
        <View style={a.filaEntre}>
          <Rotulo>Tiempo de atención</Rotulo>
          <Text
            style={[t.pequeno, { color: reloj.vencido ? c.rojo : c.textoSuave, fontWeight: '700' }]}
          >
            {reloj.texto}
          </Text>
        </View>
        <View style={a.pista}>
          <View
            style={[
              a.avance,
              {
                width: `${Math.round(reloj.progreso * 100)}%`,
                backgroundColor: reloj.vencido
                  ? c.rojo
                  : reloj.cerrado
                    ? c.gris
                    : reloj.progreso > 0.75
                      ? c.ambar
                      : c.verde,
              },
            ]}
          />
        </View>
        <Text style={[t.pequeno, { color: c.textoTenue, marginTop: s.sm, fontSize: 11.5 }]}>
          Vence el {fechaHora(ticket.vence_at)}
        </Text>
      </Panel>

      {/* Ficha de datos */}
      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.md }}>Seguimiento</Rotulo>
        <Dato clave="Reportado por" valor={ticket.reportante_nombre} />
        <Dato clave="Técnico" valor={ticket.tecnico_nombre ?? 'Sin atender'} />
        <Dato clave="Ambiente" valor={`${ticket.ambiente_codigo} · ${ticket.ambiente_nombre}`} />
        <Dato clave="Categoría" valor={ticket.categoria_nombre} />
        <Dato clave="Reportado" valor={fechaHora(ticket.creado_at)} />
        <Dato clave="Atendido" valor={fechaHora(ticket.atendido_at)} />
        <Dato clave="Resuelto" valor={fechaHora(ticket.resuelto_at)} />
        <Dato clave="Tiempo de respuesta" valor={horas(ticket.horas_respuesta)} />
        <Dato clave="Tiempo total" valor={horas(ticket.horas_resolucion)} ultimo />
      </Panel>

      {/* Acciones del equipo de soporte */}
      {puedeGestionar && !terminado && (
        <Panel estilo={{ marginBottom: s.md }}>
          <Rotulo estilo={{ marginBottom: s.md }}>Acciones de soporte</Rotulo>

          {ticket.estado === 'pendiente' && (
            <View style={{ marginBottom: s.md }}>
              <Boton
                titulo="Atender esta falla"
                icono="llave"
                onPress={() => actualizar({ tecnico_id: usuarioId, estado: 'en_proceso' })}
                cargando={guardando}
                ancho
              />
            </View>
          )}

          {ticket.tecnico_nombre && !soyTecnico && ticket.estado === 'en_proceso' && (
            <Text style={[t.pequeno, { color: c.textoTenue, marginBottom: s.sm }]}>
              Atendido por: {ticket.tecnico_nombre}
            </Text>
          )}

          <Campo
            etiqueta="¿Qué se hizo para solucionarlo?"
            valor={solucion}
            onChangeText={setSolucion}
            placeholder="Describe la solución aplicada..."
            multilinea
          />
          <Boton
            titulo="Marcar como resuelto"
            icono="check"
            onPress={() => {
              if (!solucion.trim()) {
                setError('Por favor describe la solución aplicada.');
                return;
              }
              actualizar({
                estado: 'resuelto',
                solucion: solucion.trim(),
                tecnico_id: ticket.tecnico_id || usuarioId,
              });
            }}
            cargando={guardando}
            ancho
          />

          <View style={{ height: s.sm }} />
          <Boton
            titulo="Cancelar solicitud"
            variante="peligro"
            onPress={() => actualizar({ estado: 'cancelado' })}
            cargando={guardando}
            ancho
            pequeno
          />
        </Panel>
      )}
    </>
  );

  const columnaContenido = (
    <>
      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.sm }}>Descripción de la novedad</Rotulo>
        <Text style={[t.cuerpo, { color: c.texto, lineHeight: 22 }]}>{ticket.descripcion}</Text>

        {!!ticket.solucion && (
          <View style={a.solucion}>
            <View style={a.filaIcono}>
              <Icono nombre="check" tamano={15} color={c.verde} />
              <Rotulo color={c.verde}>Solución aplicada</Rotulo>
            </View>
            <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 6, lineHeight: 20 }]}>
              {ticket.solucion}
            </Text>
          </View>
        )}
      </Panel>

      <Panel>
        <Rotulo estilo={{ marginBottom: s.lg }}>Historial</Rotulo>
        {eventos.map((ev, i) => (
          <View key={ev.id} style={a.evento}>
            <View style={a.linea}>
              <View style={[a.punto, { backgroundColor: colorEvento(ev) }]} />
              {i < eventos.length - 1 && <View style={a.hilo} />}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingBottom: i < eventos.length - 1 ? s.lg : 0 }}>
              <Text style={[t.pequeno, { color: c.texto, fontWeight: '600' }]}>
                {tituloEvento(ev)}
              </Text>
              {!!ev.comentario && (
                <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 2, lineHeight: 19 }]}>
                  {ev.comentario}
                </Text>
              )}
              <Text style={[t.pequeno, { color: c.textoTenue, marginTop: 4, fontSize: 11 }]}>
                {fechaHora(ev.creado_at)}
                {ev.perfiles?.nombre ? ` · ${ev.perfiles.nombre}` : ''}
              </Text>
            </View>
          </View>
        ))}
      </Panel>
    </>
  );

  return (
    <Pantalla ancho={1040}>
      <Encabezado
        rotulo={ticket.codigo}
        titulo={ticket.titulo}
        volver={() => navigation.goBack()}
        accion={
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <Chip texto={estado.etiqueta} color={estado.color} fondo={estado.fondo} />
            <Chip texto={prioridad.etiqueta} color={prioridad.color} fondo={prioridad.fondo} />
          </View>
        }
      />

      <Aviso texto={error} />

      {escritorio ? (
        <View style={a.dosColumnas}>
          <View style={{ flex: 1.5, minWidth: 320 }}>{columnaContenido}</View>
          <View style={{ flex: 1, minWidth: 280 }}>{columnaAcciones}</View>
        </View>
      ) : (
        <>
          {columnaAcciones}
          {columnaContenido}
        </>
      )}
    </Pantalla>
  );
}

function colorEvento(ev) {
  if (ev.tipo === 'creacion') return c.azul;
  if (ev.estado_nuevo === 'resuelto') return c.verde;
  if (ev.estado_nuevo === 'cancelado') return c.textoTenue;
  return c.ambar;
}

function tituloEvento(ev) {
  if (ev.tipo === 'creacion') return 'Falla reportada';
  if (ev.tipo === 'cambio_estado') {
    const de = ESTADOS[ev.estado_anterior]?.etiqueta ?? ev.estado_anterior;
    const hacia = ESTADOS[ev.estado_nuevo]?.etiqueta ?? ev.estado_nuevo;
    return `${de} → ${hacia}`;
  }
  return ev.tipo;
}

function Dato({ clave, valor, ultimo }) {
  return (
    <View style={[a.dato, ultimo && { borderBottomWidth: 0, paddingBottom: 0 }]}>
      <Text style={[t.pequeno, { color: c.textoTenue }]}>{clave}</Text>
      <Text
        style={[t.pequeno, { color: c.texto, fontWeight: '500', flexShrink: 1, textAlign: 'right' }]}
      >
        {valor ?? '—'}
      </Text>
    </View>
  );
}

const a = StyleSheet.create({
  dosColumnas: { flexDirection: 'row', gap: s.md, alignItems: 'flex-start' },
  filaEntre: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.md,
  },
  filaIcono: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  pista: { height: 6, borderRadius: r.full, backgroundColor: c.panelSuave, overflow: 'hidden' },
  avance: { height: 6, borderRadius: r.full },

  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: s.md,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: c.linea,
  },

  solucion: {
    marginTop: s.lg,
    padding: s.md,
    borderRadius: r.md,
    backgroundColor: c.verdeBajo,
  },

  evento: { flexDirection: 'row', gap: s.md },
  linea: { width: 10, alignItems: 'center' },
  punto: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
  hilo: { flex: 1, width: 1.5, backgroundColor: c.linea, marginTop: 3 },
});
