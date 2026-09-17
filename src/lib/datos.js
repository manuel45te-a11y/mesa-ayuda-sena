// ============================================================================
//  CAPA DE ACCESO A DATOS
//  Único punto por el que las pantallas piden información. Decide entre la
//  base de datos real (Supabase) y el modo demostración en memoria, de modo
//  que ninguna pantalla necesita saber cuál de los dos está activo.
// ============================================================================

import { supabase } from './supabase';
import * as demo from './demo';

const ACTIVOS = ['pendiente', 'en_proceso'];

// Cuando las políticas RLS no dejan cambiar una fila, Supabase no da error:
// simplemente no actualiza nada. Se pide la fila de vuelta para notarlo.
const SIN_PERMISO = 'No tienes permiso para hacer este cambio o la solicitud ya cambió. Recarga e intenta de nuevo.';

async function cambiarFila(tabla, id, cambios) {
  const { data, error } = await supabase.from(tabla).update(cambios).eq('id', id).select('id');
  if (error) return { error: error.message };
  if (!data?.length) return { error: SIN_PERMISO };
  return { error: null };
}

export async function catalogos() {
  if (demo.esDemo()) {
    return { categorias: demo.CATEGORIAS, ambientes: demo.AMBIENTES, error: null };
  }

  const [cat, amb] = await Promise.all([
    supabase.from('categorias').select('id, nombre, sla_horas').eq('activo', true).order('nombre'),
    supabase.from('ambientes').select('id, codigo, nombre').eq('activo', true).order('codigo'),
  ]);

  return {
    categorias: cat.data ?? [],
    ambientes: amb.data ?? [],
    error: cat.error?.message ?? amb.error?.message ?? null,
  };
}

export async function listarTickets() {
  if (demo.esDemo()) return { tickets: demo.listar(), error: null };

  const { data, error } = await supabase
    .from('v_tickets_detalle')
    .select('*')
    .order('creado_at', { ascending: false })
    .limit(200);

  return { tickets: data ?? [], error: error?.message ?? null };
}

const bitacora = (ticketId) =>
  supabase
    .from('ticket_eventos')
    .select('*, perfiles:actor_id (nombre)')
    .eq('ticket_id', ticketId)
    .order('creado_at', { ascending: true });

export async function obtenerTicket(id) {
  if (demo.esDemo()) {
    return { ticket: demo.obtener(id), eventos: demo.eventosDe(id), error: null };
  }

  const [t, e] = await Promise.all([
    supabase.from('v_tickets_detalle').select('*').eq('id', id).maybeSingle(),
    bitacora(id),
  ]);

  return { ticket: t.data ?? null, eventos: e.data ?? [], error: t.error?.message ?? null };
}

// La dirección web de una solicitud usa su código (/solicitudes/MA-2026-0004),
// que es lo que la gente ve y comparte, en vez del id interno.
export async function obtenerTicketPorCodigo(codigo) {
  if (demo.esDemo()) {
    const ticket = demo.obtenerPorCodigo(codigo);
    return { ticket, eventos: ticket ? demo.eventosDe(ticket.id) : [], error: null };
  }

  const t = await supabase.from('v_tickets_detalle').select('*').eq('codigo', codigo).maybeSingle();
  if (t.error || !t.data) {
    return { ticket: null, eventos: [], error: t.error?.message ?? null };
  }

  const e = await bitacora(t.data.id);
  return { ticket: t.data, eventos: e.data ?? [], error: null };
}

export async function crearTicket(datos, usuarioId) {
  if (demo.esDemo()) {
    const t = demo.insertar(datos);
    return { ticket: { id: t.id, codigo: t.codigo }, error: null };
  }

  let catId = datos.categoria_id;
  let ambId = datos.ambiente_id;

  // Si vienen como texto libre, resolver con los catálogos de Supabase
  if (!catId && (datos.categoria || datos.categoria_nombre)) {
    const texto = (datos.categoria || datos.categoria_nombre).trim().toLowerCase();
    const { data: cats } = await supabase.from('categorias').select('id, nombre');
    const coincidencia = cats?.find((c) => c.nombre.toLowerCase().includes(texto) || texto.includes(c.nombre.toLowerCase()));
    catId = coincidencia?.id ?? cats?.[0]?.id;
  }
  if (!ambId && (datos.ambiente || datos.ambiente_codigo)) {
    const texto = (datos.ambiente || datos.ambiente_codigo).trim().toLowerCase();
    const { data: ambs } = await supabase.from('ambientes').select('id, codigo, nombre');
    const coincidencia = ambs?.find(
      (a) => a.codigo.toLowerCase().includes(texto) || a.nombre.toLowerCase().includes(texto) || texto.includes(a.codigo.toLowerCase())
    );
    ambId = coincidencia?.id ?? ambs?.[0]?.id;
  }

  const payload = {
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    prioridad: datos.prioridad || 'media',
    categoria_id: catId,
    ambiente_id: ambId,
    reportante_id: usuarioId,
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(payload)
    .select('id, codigo')
    .single();

  return { ticket: data ?? null, error: error?.message ?? null };
}

export async function actualizarTicket(id, cambios) {
  if (demo.esDemo()) {
    await demo.modificar(id, cambios);
    return { error: null };
  }

  return cambiarFila('tickets', id, cambios);
}

// ---------------------------------------------------------------------------
//  Asignación, evidencias y cierre
//  La bitácora no se escribe desde aquí: la llenan los triggers de la base de
//  datos (roles-y-asignacion.sql), con el autor de cada cambio.
// ---------------------------------------------------------------------------

// Técnicos y administradores activos, para el panel de asignación.
export async function listarTecnicos() {
  if (demo.esDemo()) {
    return { tecnicos: demo.listarTecnicos(), error: null };
  }

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, correo, telefono, rol')
    .in('rol', ['tecnico', 'admin'])
    .eq('activo', true)
    .order('nombre');

  return { tecnicos: data ?? [], error: error?.message ?? null };
}

// El administrador asigna o reasigna; un técnico puede tomar para sí una
// solicitud sin asignar. Si estaba pendiente, pasa a en proceso (la fecha de
// atención la pone la base de datos, y no se reescribe al reasignar).
export async function asignarTecnico(ticket, tecnicoId) {
  if (demo.esDemo()) {
    return demo.asignarTecnico(ticket.id, tecnicoId);
  }

  const cambios = { tecnico_id: tecnicoId };
  if (ticket.estado === 'pendiente') cambios.estado = 'en_proceso';
  return cambiarFila('tickets', ticket.id, cambios);
}

export async function subirEvidencia(ticketId, { imagen, descripcion, nombre }, usuarioId) {
  if (demo.esDemo()) {
    return demo.subirEvidencia(ticketId, { imagen, descripcion, nombre });
  }

  const { data, error } = await supabase
    .from('ticket_adjuntos')
    .insert({
      ticket_id: ticketId,
      ruta: imagen,
      nombre: nombre || 'Evidencia',
      descripcion: descripcion || null,
      subido_por: usuarioId,
    })
    .select('id')
    .single();

  return { evidencia: data ?? null, error: error?.message ?? null };
}

export async function obtenerEvidencias(ticketId) {
  if (demo.esDemo()) {
    return { evidencias: demo.obtenerEvidencias(ticketId), error: null };
  }

  const { data, error } = await supabase
    .from('ticket_adjuntos')
    .select('*, perfiles:subido_por (nombre)')
    .eq('ticket_id', ticketId)
    .order('creado_at', { ascending: false });

  return {
    evidencias: (data ?? []).map((e) => ({ ...e, subido_por_nombre: e.perfiles?.nombre })),
    error: error?.message ?? null,
  };
}

// Cierra con la solución. La base de datos exige al menos una evidencia y
// una solución de 10 caracteres; aquí se revisa antes para avisar sin esperar.
export async function cerrarTicket(ticket, { solucion }) {
  if (demo.esDemo()) {
    return demo.cerrarTicket(ticket.id, { solucion });
  }

  if ((solucion ?? '').trim().length < 10) {
    return { error: 'Describe la solución aplicada (mínimo 10 caracteres).' };
  }

  const { count, error: errorConteo } = await supabase
    .from('ticket_adjuntos')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_id', ticket.id);

  if (errorConteo) return { error: errorConteo.message };
  if (!count) return { error: 'Adjunta al menos una evidencia antes de cerrar la solicitud.' };

  return cambiarFila('tickets', ticket.id, { estado: 'resuelto', solucion: solucion.trim() });
}

export async function cancelarTicket(ticket) {
  if (demo.esDemo()) {
    return demo.cancelarTicket(ticket.id);
  }
  return cambiarFila('tickets', ticket.id, { estado: 'cancelado' });
}

// ---------------------------------------------------------------------------
//  Usuarios y roles (solo administrador)
// ---------------------------------------------------------------------------
export async function listarUsuarios() {
  if (demo.esDemo()) {
    return { usuarios: demo.listarUsuarios(), error: null };
  }

  const { data, error } = await supabase
    .from('perfiles')
    .select('id, nombre, correo, rol, ficha, programa, telefono, activo, creado_at')
    .order('nombre');

  return { usuarios: data ?? [], error: error?.message ?? null };
}

export async function cambiarRol(usuarioId, rol) {
  if (demo.esDemo()) {
    return demo.cambiarRol(usuarioId, rol);
  }
  return cambiarFila('perfiles', usuarioId, { rol });
}

// Contadores de la pantalla de inicio.
export async function resumenInicio(usuarioId, esSoporte) {
  if (demo.esDemo()) {
    const todos = demo.listar();
    const mios = esSoporte ? todos : todos.filter((t) => t.reportante_id === usuarioId);
    const activos = mios.filter((t) => ACTIVOS.includes(t.estado));

    return {
      pendientes: activos.length,
      vencidos: activos.filter((t) => new Date(t.vence_at) < new Date()).length,
      resueltos: mios.filter((t) => ['resuelto'].includes(t.estado)).length,
      sinAsignar: esSoporte
        ? todos.filter((t) => !t.tecnico_id && ACTIVOS.includes(t.estado)).length
        : 0,
      recientes: mios.slice(0, 4),
    };
  }

  const conteo = () => supabase.from('v_tickets_detalle').select('*', { count: 'exact', head: true });
  const mio = (q) => (esSoporte ? q : q.eq('reportante_id', usuarioId));

  const [pendientes, vencidos, resueltos, sinAsignar, ultimos] = await Promise.all([
    mio(conteo()).in('estado', ACTIVOS),
    mio(conteo()).in('estado', ACTIVOS).lt('vence_at', new Date().toISOString()),
    mio(conteo()).in('estado', ['resuelto']),
    esSoporte ? conteo().is('tecnico_id', null).in('estado', ACTIVOS) : Promise.resolve({ count: 0 }),
    mio(supabase.from('v_tickets_detalle').select('*'))
      .order('creado_at', { ascending: false })
      .limit(4),
  ]);

  return {
    pendientes: pendientes.count ?? 0,
    vencidos: vencidos.count ?? 0,
    resueltos: resueltos.count ?? 0,
    sinAsignar: sinAsignar.count ?? 0,
    recientes: ultimos.data ?? [],
  };
}

export async function tablero() {
  if (demo.esDemo()) {
    return { indicadores: demo.indicadores(), ambientes: demo.porAmbiente(), error: null };
  }

  const [i, a] = await Promise.all([
    supabase.from('v_indicadores').select('*').maybeSingle(),
    supabase.from('v_tickets_por_ambiente').select('*').limit(8),
  ]);

  return {
    indicadores: i.data ?? null,
    ambientes: a.data ?? [],
    error: i.error?.message ?? null,
  };
}
