import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  actualizarTicket,
  asignarTecnico,
  cerrarTicket,
  listarTecnicos,
  obtenerEvidencias,
  obtenerTicket,
  subirEvidencia,
} from '../lib/datos';
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
  Separador,
  useEscritorio,
} from '../components/ui';
import { c, ESTADOS, PRIORIDADES, r, s, t } from '../theme';
import { fechaHora, horas, sla } from '../lib/formato';

const MUESTRAS_EVIDENCIA = [
  {
    nombre: 'Hardware_reparado.jpg',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    desc: 'Mantenimiento físico y sustitución de piezas defectuosas.',
  },
  {
    nombre: 'Conexion_red_ok.jpg',
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    desc: 'Prueba de enlace de red y verificación de conectividad.',
  },
  {
    nombre: 'Software_instalado.jpg',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    desc: 'Actualización y diagnóstico de operatividad del sistema.',
  },
];

export default function TicketDetalleScreen({ route, navigation }) {
  const { id } = route.params;
  const { usuarioId, esSoporte, esAdmin, esTecnico, perfil } = useAuth();
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

  // Formulario para montar evidencia
  const [evidenciaDesc, setEvidenciaDesc] = useState('');
  const [evidenciaImg, setEvidenciaImg] = useState('');
  const [evidenciaNombre, setEvidenciaNombre] = useState('');
  const [subiendoEvidencia, setSubiendoEvidencia] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  const cargar = useCallback(async () => {
    const [resTicket, resEvidencias, resTecnicos] = await Promise.all([
      obtenerTicket(id),
      obtenerEvidencias(id),
      listarTecnicos(),
    ]);

    if (resTicket.error) setError(resTicket.error);
    setTicket(resTicket.ticket);
    setEventos(resTicket.eventos);
    setEvidencias(resEvidencias.evidencias ?? []);
    setTecnicos(resTecnicos.tecnicos ?? []);

    if (resTicket.ticket?.tecnico_id) {
      setTecnicoSeleccionado(resTicket.ticket.tecnico_id);
    } else if (resTecnicos.tecnicos?.length > 0) {
      setTecnicoSeleccionado(resTecnicos.tecnicos[0].id);
    }

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

  // Flujo: Asignar técnico (Solo Admin)
  async function onAsignarTecnico() {
    if (!tecnicoSeleccionado) {
      setError('Selecciona un técnico para asignar la solicitud.');
      return;
    }
    setGuardando(true);
    setError('');
    const { error: err } = await asignarTecnico(
      id,
      tecnicoSeleccionado,
      `Asignado al técnico por ${perfil?.nombre || 'Administrador'}`
    );
    setGuardando(false);
    if (err) {
      setError(err);
    } else {
      await cargar();
    }
  }

  // Flujo: Montar evidencia (Técnico asignado o Admin)
  function abrirSelectorFoto() {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setEvidenciaImg(reader.result);
            setEvidenciaNombre(file.name);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Si está en entorno móvil nativo sin picker, usa la primera muestra como respaldo
      const muestra = MUESTRAS_EVIDENCIA[0];
      setEvidenciaImg(muestra.url);
      setEvidenciaNombre(muestra.nombre);
    }
  }

  async function onSubirEvidencia() {
    if (!evidenciaImg) {
      setError('Por favor selecciona o carga una fotografía o captura de evidencia.');
      return;
    }
    if (!evidenciaDesc.trim()) {
      setError('Describe brevemente la evidencia o trabajo técnico realizado.');
      return;
    }

    setSubiendoEvidencia(true);
    setError('');
    const { error: err } = await subirEvidencia(
      id,
      {
        imagen: evidenciaImg,
        descripcion: evidenciaDesc.trim(),
        nombre: evidenciaNombre || 'Evidencia técnica',
      },
      usuarioId
    );
    setSubiendoEvidencia(false);

    if (err) {
      setError(err);
    } else {
      setEvidenciaDesc('');
      setEvidenciaImg('');
      setEvidenciaNombre('');
      await cargar();
    }
  }

  // Flujo: Cerrar ticket con evidencia obligatoria (Técnico asignado o Admin)
  async function onCerrarTicket() {
    if (evidencias.length === 0) {
      setError(
        'Acción requerida: Para cerrar el ticket es obligatorio haber montado al menos una evidencia técnica.'
      );
      return;
    }
    if (!solucion.trim()) {
      setError('Por favor describe la solución técnica aplicada.');
      return;
    }

    setGuardando(true);
    setError('');
    const { error: err } = await cerrarTicket(
      id,
      {
        solucion: solucion.trim(),
        tecnicoId: ticket.tecnico_id || usuarioId,
      },
      usuarioId
    );
    setGuardando(false);

    if (err) {
      setError(err);
    } else {
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
  const puedeOperarTecnico = esAdmin || soyTecnico || (!ticket.tecnico_id && esTecnico);

  // Columna lateral derecha de gestión y estado
  const columnaAcciones = (
    <>
      {/* Estado del acuerdo de servicio (SLA) */}
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

      {/* Ficha técnica y datos */}
      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.md }}>Seguimiento del ticket</Rotulo>
        <Dato clave="Reportado por" valor={ticket.reportante_nombre} />
        <Dato
          clave="Técnico responsable"
          valor={
            ticket.tecnico_nombre ? (
              <Text style={{ color: c.cian, fontWeight: '700' }}>{ticket.tecnico_nombre}</Text>
            ) : (
              <Text style={{ color: c.ambar, fontWeight: '700' }}>Sin asignar</Text>
            )
          }
        />
        <Dato clave="Ambiente" valor={`${ticket.ambiente_codigo} · ${ticket.ambiente_nombre}`} />
        <Dato clave="Categoría" valor={ticket.categoria_nombre} />
        <Dato clave="Evidencias adjuntas" valor={`${evidencias.length} prueba(s)`} />
        <Dato clave="Reportado" valor={fechaHora(ticket.creado_at)} />
        <Dato clave="Atendido" valor={fechaHora(ticket.atendido_at)} />
        <Dato clave="Resuelto" valor={fechaHora(ticket.resuelto_at)} />
        <Dato clave="Tiempo de respuesta" valor={horas(ticket.horas_respuesta)} />
        <Dato clave="Tiempo total" valor={horas(ticket.horas_resolucion)} ultimo />
      </Panel>

      {/* PANEL DEL ADMINISTRADOR: Asignación de técnico */}
      {esAdmin && !terminado && (
        <Panel estilo={[{ marginBottom: s.md, borderColor: c.marca, borderWidth: 1.5 }]}>
          <View style={a.filaIcono}>
            <Icono nombre="asignar" tamano={17} color={c.marcaAlta} />
            <Rotulo color={c.marcaAlta}>Asignación de Técnico (Admin)</Rotulo>
          </View>
          <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 4, marginBottom: s.md }]}>
            {ticket.tecnico_nombre
              ? `Actualmente asignado a ${ticket.tecnico_nombre}. Puedes reasignarlo:`
              : 'Esta solicitud aún no tiene técnico. Asígnale un responsable:'}
          </Text>

          <View style={{ gap: 6, marginBottom: s.md }}>
            {tecnicos.map((tec) => {
              const activo = tecnicoSeleccionado === tec.id;
              return (
                <Pressable
                  key={tec.id}
                  onPress={() => setTecnicoSeleccionado(tec.id)}
                  style={[
                    a.tecnicoItem,
                    activo && { borderColor: c.marca, backgroundColor: c.marcaBaja },
                  ]}
                >
                  <View style={[a.radio, activo && { borderColor: c.marca }]}>
                    {activo && <View style={a.radioPunto} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        t.pequeno,
                        { color: activo ? c.texto : c.textoSuave, fontWeight: '600' },
                      ]}
                    >
                      {tec.nombre}
                    </Text>
                    <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11 }]}>
                      {tec.especialidad || 'Técnico de soporte'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Boton
            titulo={ticket.tecnico_id ? 'Reasignar Técnico' : 'Asignar a este Técnico'}
            icono="asignar"
            onPress={onAsignarTecnico}
            cargando={guardando}
            ancho
          />
        </Panel>
      )}

      {/* PANEL DEL TÉCNICO: Cierre de ticket verificado */}
      {puedeOperarTecnico && !terminado && (
        <Panel estilo={{ marginBottom: s.md }}>
          <View style={a.filaIcono}>
            <Icono nombre="check" tamano={17} color={c.verde} />
            <Rotulo color={c.verde}>Cierre de Solicitud (Técnico)</Rotulo>
          </View>

          {evidencias.length === 0 ? (
            <View style={a.alertaEvidencia}>
              <Icono nombre="alerta" tamano={16} color={c.ambar} />
              <Text style={[t.pequeno, { color: c.ambar, flex: 1, fontSize: 12 }]}>
                Antes de cerrar el ticket, debes{' '}
                <Text style={{ fontWeight: '700' }}>montar al menos una evidencia técnica</Text> en
                la sección inferior.
              </Text>
            </View>
          ) : (
            <View style={a.alertaOk}>
              <Icono nombre="check" tamano={16} color={c.verde} />
              <Text style={[t.pequeno, { color: c.verde, flex: 1, fontSize: 12 }]}>
                {evidencias.length} evidencia(s) técnica(s) montada(s). Listo para cierre.
              </Text>
            </View>
          )}

          <Campo
            etiqueta="Solución aplicada"
            valor={solucion}
            onChangeText={setSolucion}
            placeholder="Describe la solución aplicada y los componentes intervenidos..."
            multilinea
          />

          <Boton
            titulo="Cerrar ticket resuelto y evidenciado"
            icono="check"
            onPress={onCerrarTicket}
            cargando={guardando}
            deshabilitado={evidencias.length === 0}
            ancho
          />

          {esAdmin && (
            <>
              <View style={{ height: s.sm }} />
              <Boton
                titulo="Cancelar solicitud"
                variante="peligro"
                onPress={() => actualizar({ estado: 'cancelado' })}
                cargando={guardando}
                ancho
                pequeno
              />
            </>
          )}
        </Panel>
      )}
    </>
  );

  // Columna principal de contenido, descripción, evidencias e historial
  const columnaContenido = (
    <>
      {/* Descripción original reportada por el usuario */}
      <Panel estilo={{ marginBottom: s.md }}>
        <Rotulo estilo={{ marginBottom: s.sm }}>Descripción de la falla</Rotulo>
        <Text style={[t.cuerpo, { color: c.texto, lineHeight: 22 }]}>{ticket.descripcion}</Text>

        {!!ticket.solucion && (
          <View style={a.solucion}>
            <View style={a.filaIcono}>
              <Icono nombre="check" tamano={16} color={c.verde} />
              <Rotulo color={c.verde}>Solución final aplicada</Rotulo>
            </View>
            <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 6, lineHeight: 20 }]}>
              {ticket.solucion}
            </Text>
          </View>
        )}
      </Panel>

      {/* SECCIÓN DE EVIDENCIAS TÉCNICAS (Fotos y notas de soporte) */}
      <Panel estilo={{ marginBottom: s.md }}>
        <View style={a.filaEntre}>
          <View style={a.filaIcono}>
            <Icono nombre="camara" tamano={18} color={c.cian} />
            <Rotulo color={c.cian}>Evidencias Técnicas del Soporte</Rotulo>
          </View>
          <Chip
            texto={`${evidencias.length} adjunta(s)`}
            color={evidencias.length > 0 ? c.verde : c.ambar}
            fondo={evidencias.length > 0 ? c.verdeBajo : c.ambarBajo}
          />
        </View>

        {/* Formulario para montar evidencia (habilitado si no está terminado y puede operar) */}
        {puedeOperarTecnico && !terminado && (
          <View style={a.cajaMontarEvidencia}>
            <Text style={[t.pequeno, { color: c.texto, fontWeight: '700', marginBottom: 6 }]}>
              Montar nueva evidencia técnica
            </Text>
            <Text style={[t.pequeno, { color: c.textoTenue, marginBottom: s.md, fontSize: 12 }]}>
              Adjunta una fotografía o captura del ambiente intervenido y una descripción de las
              acciones realizadas.
            </Text>

            {/* Selector de foto */}
            <View style={{ marginBottom: s.md }}>
              <Rotulo color={c.textoSuave} estilo={{ marginBottom: 6 }}>
                Fotografía / Captura de evidencia
              </Rotulo>
              <View style={{ flexDirection: 'row', gap: s.sm, flexWrap: 'wrap' }}>
                <Boton
                  titulo="Cargar foto del dispositivo"
                  icono="camara"
                  variante="secundario"
                  pequeno
                  onPress={abrirSelectorFoto}
                />
                <Boton
                  titulo="Usar foto de prueba SENA"
                  icono="imagen"
                  variante="fantasma"
                  pequeno
                  onPress={() => {
                    const muestra = MUESTRAS_EVIDENCIA[evidencias.length % MUESTRAS_EVIDENCIA.length];
                    setEvidenciaImg(muestra.url);
                    setEvidenciaNombre(muestra.nombre);
                    if (!evidenciaDesc) setEvidenciaDesc(muestra.desc);
                  }}
                />
              </View>

              {/* Vista previa de la foto seleccionada */}
              {!!evidenciaImg && (
                <View style={a.previaFoto}>
                  <Image source={{ uri: evidenciaImg }} style={a.previaMiniatura} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[t.pequeno, { color: c.texto, fontWeight: '600' }]} numberOfLines={1}>
                      {evidenciaNombre || 'Imagen seleccionada'}
                    </Text>
                    <Text style={[t.pequeno, { color: c.marcaAlta, fontSize: 11 }]}>
                      ✓ Lista para montar
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setEvidenciaImg('');
                      setEvidenciaNombre('');
                    }}
                    hitSlop={8}
                    style={a.botonQuitarFoto}
                  >
                    <Icono nombre="cerrar" tamano={14} color={c.rojo} />
                  </Pressable>
                </View>
              )}
            </View>

            <Campo
              etiqueta="Nota o descripción del trabajo realizado"
              valor={evidenciaDesc}
              onChangeText={setEvidenciaDesc}
              placeholder="Ej: Se reemplazó el cable de poder y se probó encendido a 110V..."
              multilinea
            />

            <Boton
              titulo="Guardar y montar evidencia"
              icono="check"
              onPress={onSubirEvidencia}
              cargando={subiendoEvidencia}
              deshabilitado={!evidenciaImg || !evidenciaDesc.trim()}
              pequeno
            />
          </View>
        )}

        {/* Lista visual de evidencias montadas */}
        {evidencias.length === 0 ? (
          <View style={a.sinEvidencias}>
            <Icono nombre="imagen" tamano={22} color={c.textoTenue} />
            <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 6, fontWeight: '600' }]}>
              Aún no hay evidencias registradas en este ticket
            </Text>
            <Text style={[t.pequeno, { color: c.textoTenue, textAlign: 'center', fontSize: 11.5 }]}>
              {puedeOperarTecnico
                ? 'El técnico asignado debe subir evidencias fotográficas del trabajo antes de cerrar.'
                : 'El técnico asignado subirá fotos y notas técnicas aquí durante la atención.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: s.md, marginTop: s.sm }}>
            {evidencias.map((ev, idx) => (
              <View key={ev.id || idx} style={a.tarjetaEvidencia}>
                <Pressable
                  onPress={() => setFotoAmpliada(ev.ruta)}
                  style={a.contenedorMiniatura}
                >
                  <Image source={{ uri: ev.ruta }} style={a.fotoEvidencia} resizeMode="cover" />
                  <View style={a.iconoZoom}>
                    <Icono nombre="buscar" tamano={14} color="#FFFFFF" />
                  </View>
                </Pressable>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[t.pequeno, { color: c.texto, fontWeight: '700' }]}>
                    {ev.nombre || `Evidencia técnica #${idx + 1}`}
                  </Text>
                  {!!ev.descripcion && (
                    <Text style={[t.pequeno, { color: c.textoSuave, marginTop: 3, lineHeight: 18 }]}>
                      {ev.descripcion}
                    </Text>
                  )}
                  <Text style={[t.pequeno, { color: c.textoTenue, marginTop: 6, fontSize: 11 }]}>
                    Subido por: <Text style={{ color: c.cian }}>{ev.subido_por_nombre || 'Técnico'}</Text>{' '}
                    · {fechaHora(ev.creado_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Panel>

      {/* Bitácora de seguimiento histórico */}
      <Panel>
        <Rotulo style={{ marginBottom: s.lg }}>Trazabilidad e historial</Rotulo>
        {eventos.map((ev, i) => (
          <View key={ev.id || i} style={a.evento}>
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

      {/* Modal visor de foto ampliada */}
      {!!fotoAmpliada && (
        <Modal
          visible={!!fotoAmpliada}
          transparent
          animationType="fade"
          onRequestClose={() => setFotoAmpliada(null)}
        >
          <Pressable style={a.fondoModal} onPress={() => setFotoAmpliada(null)}>
            <View style={a.cajaModalFoto}>
              <Image
                source={{ uri: fotoAmpliada }}
                style={a.fotoModal}
                resizeMode="contain"
              />
              <Pressable
                onPress={() => setFotoAmpliada(null)}
                style={a.botonCerrarModal}
              >
                <Icono nombre="cerrar" tamano={18} color="#FFFFFF" />
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      )}
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
  if (ev.tipo === 'evidencia') return 'Evidencia técnica incorporada';
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
      <View style={{ flexShrink: 1, alignItems: 'flex-end' }}>
        {typeof valor === 'string' ? (
          <Text style={[t.pequeno, { color: c.texto, fontWeight: '500', textAlign: 'right' }]}>
            {valor || '—'}
          </Text>
        ) : (
          valor
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

  alertaEvidencia: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: c.ambarBajo,
    padding: s.sm,
    borderRadius: r.sm,
    marginBottom: s.md,
  },
  alertaOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.verdeBajo,
    padding: s.sm,
    borderRadius: r.sm,
    marginBottom: s.md,
  },

  solucion: {
    marginTop: s.lg,
    padding: s.md,
    borderRadius: r.md,
    backgroundColor: c.verdeBajo,
  },

  cajaMontarEvidencia: {
    padding: s.md,
    backgroundColor: c.panelAlto,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    marginBottom: s.md,
  },
  previaFoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginTop: s.sm,
    padding: s.sm,
    backgroundColor: c.panel,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: c.linea,
  },
  previaMiniatura: { width: 44, height: 44, borderRadius: 4 },
  botonQuitarFoto: { padding: 4 },

  sinEvidencias: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.xl,
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
  contenedorMiniatura: { position: 'relative' },
  fotoEvidencia: { width: 72, height: 72, borderRadius: r.sm },
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
  cajaModalFoto: {
    width: '100%',
    maxWidth: 700,
    height: '75%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fotoModal: { width: '100%', height: '100%', borderRadius: r.md },
  botonCerrarModal: {
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
