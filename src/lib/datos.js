// ============================================================================
//  CAPA DE ACCESO A DATOS
//  Único punto por el que las pantallas piden información. Decide entre la
//  base de datos real (Supabase) y el modo demostración en memoria, de modo
//  que ninguna pantalla necesita saber cuál de los dos está activo.
// ============================================================================

import { supabase } from './supabase';
import * as demo from './demo';

const ACTIVOS = ['pendiente', 'en_proceso'];

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

export async function obtenerTicket(id) {
  if (demo.esDemo()) {
    return { ticket: demo.obtener(id), eventos: demo.eventosDe(id), error: null };
  }

  const [t, e] = await Promise.all([
    supabase.from('v_tickets_detalle').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('ticket_eventos')
      .select('*, perfiles:actor_id (nombre)')
      .eq('ticket_id', id)
      .order('creado_at', { ascending: true }),
  ]);

  return { ticket: t.data ?? null, eventos: e.data ?? [], error: t.error?.message ?? null };
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

  const { error } = await supabase.from('tickets').update(cambios).eq('id', id);
  return { error: error?.message ?? null };
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
