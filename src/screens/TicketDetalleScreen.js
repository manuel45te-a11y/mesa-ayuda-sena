import React, { useCallback, useState } from 'react';
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  asignarTecnico,
  cancelarTicket,
  cerrarTicket,
  listarTecnicos,
  obtenerEvidencias,
  obtenerTicket,
  obtenerTicketPorCodigo,
  subirEvidencia,
} from '../lib/datos';
import { traducirError } from '../lib/errores';
import { elegirFoto } from '../lib/fotos';
import { FOTOS_EJEMPLO } from '../lib/fotosEjemplo';
import { useAuth } from '../context/AuthContext';
import { volver } from '../navigation/rutas';
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
import { c, ESTADOS, PRIORIDADES, r, ROLES, s, t } from '../theme';
import { fechaHora, horas, sla } from '../lib/formato';

const MINIMO_SOLUCION = 10;

export default function TicketDetalleScreen({ route, navigation }) {
  // Se abre por código (/solicitudes/MA-2026-0004). El id se acepta por
  // compatibilidad con navegaciones que todavía lo pasen.
  const { codigo, id } = route.params ?? {};
  const { usuarioId, esAdmin, esTecnico, demo } = useAuth();
  const escritorio = useEscritorio();

  const [ticket, setTicket] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [evidencias, setEvidencias] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [solucion, setSolucion] = useState('');
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);

  // Evidencia que se está preparando
  const [foto, setFoto] = useState(null);
  const [notaEvidencia, setNotaEvidencia] = useState('');
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const cargar = useCallback(async () => {
    const res = codigo ? await obtenerTicketPorCodigo(codigo) : await obtenerTicket(id);
    if (res.error) setError(traducirError(res.error));
    setTicket(res.ticket);
    setEventos(res.eventos);

    if (res.ticket) {
      const [resEvidencias, resTecnicos] = await Promise.all([
        obtenerEvidencias(res.ticket.id),
        esAdmin ? listarTecnicos() : Promise.resolve({ tecnicos: [] }),
      ]);
      setEvidencias(resEvidencias.evidencias ?? []);
      setTecnicos(resTecnicos.tecnicos ?? []);
      setTecnicoSeleccionado((actual) => actual || res.ticket.tecnico_id || resTecnicos.tecnicos?.[0]?.id || '');
    }

    setCargando(false);
  }, [codigo, id, esAdmin]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  // Ejecuta una acción, muestra su error traducido o recarga la solicitud.
  async function ejecutar(accion, alTerminar) {
    setGuardando(true);
    setError('');
    const { error: err } = await accion();
    setGuardando(false);
    if (err) {
      setError(traducirError(err));
      return false;
    }
    alTerminar?.();
    await cargar();
    return true;
  }

  const onAsignar = () => {
    if (!tecnicoSeleccionado) {
      setError('Selecciona el técnico que va a atender la solicitud.');
      return;
    }
    ejecutar(() => asignarTecnico(ticket, tecnicoSeleccionado));
  };

  const onTomar = () => ejecutar(() => asignarTecnico(ticket, usuarioId));

  const onCerrar = () => {
    if (evidencias.length === 0) {
      setError('Adjunta al menos una evidencia antes de cerrar la solicitud.');
      return;
    }
    if (solucion.trim().length < MINIMO_SOLUCION) {
      setError(`Describe la solución aplicada (mínimo ${MINIMO_SOLUCION} caracteres).`);
      return;
    }
    ejecutar(() => cerrarTicket(ticket, { solucion }), () => setSolucion(''));
  };

  const onCancelar = () =>
    ejecutar(() => cancelarTicket(ticket), () => setConfirmarCancelacion(false));

  async function onElegirFoto(camara) {
    setError('');
    const { foto: elegida, error: err } = await elegirFoto({ camara });
    if (err) setError(err);
    if (elegida) setFoto(elegida);
  }

  function usarFotoDeEjemplo() {
    const ejemplo = FOTOS_EJEMPLO[evidencias.length % FOTOS_EJEMPLO.length];
    setFoto({ imagen: ejemplo.imagen, nombre: ejemplo.nombre });
    if (!notaEvidencia) setNotaEvidencia(ejemplo.descripcion);
  }

  async function onSubirEvidencia() {
    if (!foto) {
      setError('Elige la foto de la evidencia.');
      return;
    }
    if (!notaEvidencia.trim()) {
      setError('Escribe una nota corta del trabajo realizado.');
      return;
    }

    setSubiendoEvidencia(true);
    setError('');
    const { error: err } = await subirEvidencia(
      ticket.id,
      { imagen: foto.imagen, nombre: foto.nombre, descripcion: notaEvidencia.trim() },
      usuarioId
    );
    setSubiendoEvidencia(false);

    if (err) {
      setError(traducirError(err));
      return;
    }
    setFoto(null);
    setNotaEvidencia('');
    await cargar();
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
        <Encabezado titulo="Solicitud no disponible" volver={() => volver(navigation, 'Tabs', { screen: 'Tickets' })} />
        <Aviso texto={error || 'No se encontró la solicitud o tu rol no tiene permiso para verla.'} />
      </Pantalla>
    );
  }

  const estado = ESTADOS[ticket.estado] ?? ESTADOS.pendiente;
  const prioridad = PRIORIDADES[ticket.prioridad] ?? PRIORIDADES.media;
  const reloj = sla(ticket.creado_at, ticket.vence_at, ticket.estado);
  const soyTecnico = ticket.tecnico_id === usuarioId;
  const terminado = ['resuelto', 'cancelado'].includes(ticket.estado);

  // Quién puede hacer qué (las mismas reglas que exige la base de datos)
  const puedeAsignar = esAdmin && !terminado;
  const puedeTomar = esTecnico && !ticket.tecnico_id && ticket.estado === 'pendiente';
  const puedeTrabajar = ticket.estado === 'en_proceso' && (soyTecnico || esAdmin);
  const puedeCancelar = esAdmin && !terminado;

  const columnaAcciones = (
    <>
      {/* Estado del acuerdo de servicio */}
      <Panel estilo={{ marginBottom: s.md }}>
        <View style={a.filaEntre}>
          <Rotulo>Tiempo de atención</Rotulo>
          <Text style={[t.pequeno, { color: reloj.vencido ? c.rojo : c.textoSuave, fontWeight: '700' }]}>
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
        <Dato
          clave="Técnico responsable"
          valor={
            ticket.tecnico_nombre ? (
              <Text style={[t.pequeno, { color: c.cian, fontWeight: '700' }]}>{ticket.tecnico_nombre}</Text>
            ) : (
              <Text style={[t.pequeno, { color: c.ambar, fontWeight: '700' }]}>Sin asignar</Text>
            )
          }
        />
        <Dato clave="Ambiente" valor={`${ticket.ambiente_codigo} · ${ticket.ambiente_nombre}`} />
        <Dato clave="Categoría" valor={ticket.categoria_nombre} />
        <Dato clave="Evidencias" valor={String(evidencias.length)} />
        <Dato clave="Reportado" valor={fechaHora(ticket.creado_at)} />
        <Dato clave="Atendido" valor={fechaHora(ticket.atendido_at)} />
        <Dato clave="Resuelto" valor={fechaHora(ticket.resuelto_at)} />
        <Dato clave="Tiempo de respuesta" valor={horas(ticket.horas_respuesta)} />
        <Dato clave="Tiempo total" valor={horas(ticket.horas_resolucion)} ultimo />
      </Panel>

      {/* Administrador: asignar o reasignar */}
      {puedeAsignar && (
        <Panel estilo={[a.panelDestacado, { marginBottom: s.md }]}>
          <View style={a.filaIcono}>
            <Icono nombre="asignar" tamano={17} color={c.marcaAlta} />
            <Rotulo color={c.marcaAlta}>{ticket.tecnico_id ? 'Reasignar técnico' : 'Asignar técnico'}</Rotulo>
          </View>
          <Text style={a.ayuda}>
            {ticket.tecnico_nombre
              ? `La atiende ${ticket.tecnico_nombre}. Elige a otra persona para reasignarla.`
              : 'Elige quién va a atender la solicitud. Al asignarla pasa a en proceso.'}
          </Text>

          {tecnicos.length === 0 ? (
            <Aviso
              tipo="info"
              texto="Todavía no hay técnicos. Asigna el rol de técnico a alguien desde la pantalla Usuarios."
            />
          ) : (
            <View style={{ gap: 6, marginBottom: s.md }}>
              {tecnicos.map((tec) => {
                const elegido = tecnicoSeleccionado === tec.id;
                const actual = ticket.tecnico_id === tec.id;
                return (
                  <Pressable
                    key={tec.id}
                    onPress={() => setTecnicoSeleccionado(tec.id)}
                    style={[a.tecnicoItem, elegido && { borderColor: c.marca, backgroundColor: c.marcaBaja }]}
                  >
                    <View style={[a.radio, elegido && { borderColor: c.marca }]}>
                      {elegido && <View style={a.radioPunto} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[t.pequeno, { color: elegido ? c.texto : c.textoSuave, fontWeight: '600' }]}>
                        {tec.nombre}
                        {actual ? ' · actual' : ''}
                      </Text>
                      <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11 }]}>
                        {tec.especialidad || ROLES[tec.rol] || 'Técnico de soporte'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Boton
            titulo={ticket.tecnico_id ? 'Reasignar' : 'Asignar'}
            icono="asignar"
            onPress={onAsignar}
            cargando={guardando}
            deshabilitado={!tecnicoSeleccionado || tecnicoSeleccionado === ticket.tecnico_id}
            ancho
          />
        </Panel>
      )}

      {/* Técnico: tomar una solicitud sin asignar */}
      {puedeTomar && (
        <Panel estilo={{ marginBottom: s.md }}>
          <Rotulo estilo={{ marginBottom: s.sm }}>Sin asignar</Rotulo>
          <Text style={a.ayuda}>
            Nadie la está atendiendo. Si la tomas, quedas como responsable y pasa a en proceso.
          </Text>
          <Boton titulo="Tomar esta solicitud" icono="llave" onPress={onTomar} cargando={guardando} ancho />
        </Panel>
      )}

      {/* Técnico asignado o administrador: cerrar con evidencia */}
      {puedeTrabajar && (
        <Panel estilo={{ marginBottom: s.md }}>
          <View style={a.filaIcono}>
            <Icono nombre="check" tamano={17} color={c.verde} />
            <Rotulo color={c.verde}>Cerrar la solicitud</Rotulo>
          </View>

          {evidencias.length === 0 ? (
            <View style={[a.alerta, { backgroundColor: c.ambarBajo }]}>
              <Icono nombre="alerta" tamano={16} color={c.ambar} />
              <Text style={[t.pequeno, { color: c.ambar, flex: 1, fontSize: 12 }]}>
                Antes de cerrar, sube al menos una evidencia en la sección Evidencias.
              </Text>
            </View>
          ) : (
            <View style={[a.alerta, { backgroundColor: c.verdeBajo }]}>
              <Icono nombre="check" tamano={16} color={c.verde} />
              <Text style={[t.pequeno, { color: c.verde, flex: 1, fontSize: 12 }]}>
                {evidencias.length === 1 ? '1 evidencia adjunta.' : `${evidencias.length} evidencias adjuntas.`}
              </Text>
            </View>
          )}

          <Campo
            etiqueta="Solución aplicada"
            valor={solucion}
            onChangeText={setSolucion}
            placeholder="Qué se hizo y qué piezas se cambiaron…"
            multilinea
            ayuda={`Mínimo ${MINIMO_SOLUCION} caracteres.`}
          />
          <Boton
            titulo="Cerrar como resuelta"
            icono="check"
            onPress={onCerrar}
            cargando={guardando}
            deshabilitado={evidencias.length === 0}
            ancho
          />
        </Panel>
      )}

      {/* Administrador: cancelar */}
      {puedeCancelar && (
        <Panel estilo={{ marginBottom: s.md }}>
          {confirmarCancelacion ? (
            <>
              <Text style={[t.pequeno, { color: c.texto, marginBottom: s.md }]}>
                ¿Cancelar esta solicitud? Deja de contar como pendiente y ya no se puede reabrir.
              </Text>
              <View style={{ flexDirection: 'row', gap: s.sm, flexWrap: 'wrap' }}>
                <Boton titulo="No" variante="secundario" pequeno onPress={() => setConfirmarCancelacion(false)} />
                <Boton titulo="Sí, cancelar" variante="peligro" pequeno onPress={onCancelar} cargando={guardando} />
              </View>
            </>
          ) : (
            <Boton
              titulo="Cancelar solicitud"
              variante="peligro"
              onPress={() => setConfirmarCancelacion(true)}
              ancho
              pequeno
            />
          )}
        </Panel>
      )}
    </>
  );

  const columnaContenido = (
    <>
      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.sm }}>Descripción de la falla</Rotulo>
        <Text style={[t.cuerpo, { color: c.texto, lineHeight: 22 }]}>{ticket.descripcion}</Text>

        {!!ticket.solucion && (
          <View style={a.solucion}>
            <View style={a.filaIcono}>
              <Icono nombre="check" tamano={15} color={c.verde} />
              <Rotulo color={c.verde}>Solución aplicada</Rotulo>
            </View>
            <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 6, lineHeight: 20 }]}>{ticket.solucion}</Text>
          </View>
        )}
      </Panel>

      {/* Evidencias */}
      <Panel estilo={{ marginBottom: s.md }}>
        <View style={a.filaEntre}>
          <View style={a.filaIcono}>
            <Icono nombre="camara" tamano={18} color={c.cian} />
            <Rotulo color={c.cian}>Evidencias</Rotulo>
          </View>
          <Chip
            texto={String(evidencias.length)}
            color={evidencias.length > 0 ? c.verde : c.textoSuave}
            fondo={evidencias.length > 0 ? c.verdeBajo : c.grisBajo}
          />
        </View>

        {puedeTrabajar && (
          <View style={a.cajaEvidencia}>
            <Text style={[t.pequeno, { color: c.texto, fontWeight: '700', marginBottom: 4 }]}>Subir evidencia</Text>
            <Text style={[a.ayuda, { marginBottom: s.md }]}>
              Una foto del arreglo y una nota corta de lo que se hizo.
            </Text>

            <View style={a.botonesFoto}>
              {Platform.OS !== 'web' && (
                <Boton titulo="Tomar foto" icono="camara" variante="secundario" pequeno onPress={() => onElegirFoto(true)} />
              )}
              <Boton
                titulo={Platform.OS === 'web' ? 'Elegir foto' : 'Elegir de la galería'}
                icono="imagen"
                variante="secundario"
                pequeno
                onPress={() => onElegirFoto(false)}
              />
              {demo && (
                <Boton titulo="Usar foto de ejemplo" icono="imagen" variante="fantasma" pequeno onPress={usarFotoDeEjemplo} />
              )}
            </View>

            {!!foto && (
              <View style={a.previa}>
                <Image source={{ uri: foto.imagen }} style={a.previaMiniatura} />
                <Text style={[t.pequeno, { color: c.texto, fontWeight: '600', flex: 1 }]} numberOfLines={1}>
                  {foto.nombre}
                </Text>
                <Pressable onPress={() => setFoto(null)} hitSlop={8} style={{ padding: 4 }}>
                  <Icono nombre="cerrar" tamano={14} color={c.rojo} />
                </Pressable>
              </View>
            )}

            <Campo
              etiqueta="Nota del trabajo realizado"
              valor={notaEvidencia}
              onChangeText={setNotaEvidencia}
              placeholder="Ej.: se cambió el cable de poder y se probó el encendido"
              multilinea
            />
            <Boton
              titulo="Subir evidencia"
              icono="adjunto"
              onPress={onSubirEvidencia}
              cargando={subiendoEvidencia}
              deshabilitado={!foto || !notaEvidencia.trim()}
              pequeno
            />
          </View>
        )}

        {evidencias.length === 0 ? (
          <View style={a.sinEvidencias}>
            <Icono nombre="imagen" tamano={22} color={c.textoTenue} />
            <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 6, fontWeight: '600' }]}>Aún no hay evidencias</Text>
            <Text style={[t.pequeno, { color: c.textoTenue, textAlign: 'center', fontSize: 11.5 }]}>
              El técnico sube aquí las fotos del trabajo antes de cerrar la solicitud.
            </Text>
          </View>
        ) : (
          <View style={{ gap: s.md, marginTop: s.sm }}>
            {evidencias.map((ev, i) => (
              <View key={ev.id ?? i} style={a.tarjetaEvidencia}>
                <Pressable onPress={() => setFotoAmpliada(ev.ruta)} style={{ position: 'relative' }}>
                  <Image source={{ uri: ev.ruta }} style={a.fotoEvidencia} resizeMode="cover" />
                  <View style={a.iconoZoom}>
                    <Icono nombre="buscar" tamano={14} color="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[t.pequeno, { color: c.texto, fontWeight: '700' }]} numberOfLines={1}>
                    {ev.nombre || `Evidencia ${i + 1}`}
                  </Text>
                  {!!ev.descripcion && (
                    <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 3, lineHeight: 18 }]}>{ev.descripcion}</Text>
                  )}
                  <Text style={[t.pequeno, { color: c.textoTenue, marginTop: 6, fontSize: 11 }]}>
                    {ev.subido_por_nombre || 'Técnico'} · {fechaHora(ev.creado_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Panel>

      <Panel>
        <Rotulo estilo={{ marginBottom: s.lg }}>Historial</Rotulo>
        {eventos.map((ev, i) => (
          <View key={ev.id ?? i} style={a.evento}>
            <View style={a.linea}>
              <View style={[a.punto, { backgroundColor: colorEvento(ev) }]} />
              {i < eventos.length - 1 && <View style={a.hilo} />}
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingBottom: i < eventos.length - 1 ? s.lg : 0 }}>
              <Text style={[t.pequeno, { color: c.texto, fontWeight: '600' }]}>{tituloEvento(ev)}</Text>
              {!!ev.comentario && ev.comentario !== tituloEvento(ev) && (
                <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 2, lineHeight: 19 }]}>{ev.comentario}</Text>
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
        volver={() => volver(navigation, 'Tabs', { screen: 'Tickets' })}
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

      {/* Foto ampliada */}
      <Modal visible={!!fotoAmpliada} transparent animationType="fade" onRequestClose={() => setFotoAmpliada(null)}>
        <Pressable style={a.fondoModal} onPress={() => setFotoAmpliada(null)}>
          <View style={a.cajaModal}>
            {!!fotoAmpliada && <Image source={{ uri: fotoAmpliada }} style={a.fotoModal} resizeMode="contain" />}
            <Pressable onPress={() => setFotoAmpliada(null)} style={a.cerrarModal} hitSlop={8}>
              <Icono nombre="cerrar" tamano={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </Pantalla>
  );
}

function colorEvento(ev) {
  if (ev.tipo === 'creacion') return c.azul;
  if (ev.tipo === 'asignacion') return c.marcaAlta;
  if (ev.tipo === 'evidencia') return c.cian;
  if (ev.estado_nuevo === 'resuelto') return c.verde;
  if (ev.estado_nuevo === 'cancelado') return c.textoTenue;
  return c.ambar;
}

function tituloEvento(ev) {
  if (ev.tipo === 'creacion') return 'Falla reportada';
  if (ev.tipo === 'asignacion') return 'Asignación de técnico';
  if (ev.tipo === 'evidencia') return 'Evidencia adjunta';
  if (ev.tipo === 'cambio_estado') {
    const de = ESTADOS[ev.estado_anterior]?.etiqueta ?? ev.estado_anterior;
    const hacia = ESTADOS[ev.estado_nuevo]?.etiqueta ?? ev.estado_nuevo;
    return `${de} → ${hacia}`;
  }
  return ev.tipo;
}

// `valor` puede ser texto o un elemento ya armado (por ejemplo, con color).
function Dato({ clave, valor, ultimo }) {
  return (
    <View style={[a.dato, ultimo && { borderBottomWidth: 0, paddingBottom: 0 }]}>
      <Text style={[t.pequeno, { color: c.textoTenue }]}>{clave}</Text>
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        {React.isValidElement(valor) ? (
          valor
        ) : (
          <Text style={[t.pequeno, { color: c.texto, fontWeight: '500', textAlign: 'right' }]}>{valor || '—'}</Text>
        )}
      </View>
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
  ayuda: { ...t.pequeno, color: c.textoSuave, marginTop: 4, marginBottom: s.md },

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

  panelDestacado: { borderColor: c.marca, borderWidth: 1.5 },
  tecnicoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: c.linea,
    backgroundColor: c.panelAlto,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: c.textoTenue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.marca },

  alerta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: s.sm,
    borderRadius: r.sm,
    marginBottom: s.md,
    marginTop: s.sm,
  },

  solucion: {
    marginTop: s.lg,
    padding: s.md,
    borderRadius: r.md,
    backgroundColor: c.verdeBajo,
  },

  cajaEvidencia: {
    padding: s.md,
    backgroundColor: c.panelAlto,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    marginBottom: s.md,
  },
  botonesFoto: { flexDirection: 'row', gap: s.sm, flexWrap: 'wrap', marginBottom: s.md },
  previa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.md,
    padding: s.sm,
    backgroundColor: c.panel,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: c.linea,
  },
  previaMiniatura: { width: 44, height: 44, borderRadius: 4 },

  sinEvidencias: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.xl,
    paddingHorizontal: s.md,
    backgroundColor: c.panelAlto,
    borderRadius: r.md,
    gap: 4,
  },
  tarjetaEvidencia: {
    flexDirection: 'row',
    gap: s.md,
    padding: s.sm,
    backgroundColor: c.panelAlto,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    alignItems: 'center',
  },
  fotoEvidencia: { width: 72, height: 72, borderRadius: r.sm, backgroundColor: c.panel },
  iconoZoom: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: r.full,
    padding: 3,
  },

  evento: { flexDirection: 'row', gap: s.md },
  linea: { width: 10, alignItems: 'center' },
  punto: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
  hilo: { flex: 1, width: 1.5, backgroundColor: c.linea, marginTop: 3 },

  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: s.lg,
  },
  cajaModal: { width: '100%', maxWidth: 700, height: '75%', justifyContent: 'center', alignItems: 'center' },
  fotoModal: { width: '100%', height: '100%', borderRadius: r.md },
  cerrarModal: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: c.panelAlto,
    borderWidth: 1,
    borderColor: c.lineaFuerte,
    borderRadius: r.full,
    padding: 6,
  },
});
