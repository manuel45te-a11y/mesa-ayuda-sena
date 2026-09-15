import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE_TICKETS = '@mesa_ayuda_demo_tickets';
const CLAVE_EVENTOS = '@mesa_ayuda_demo_eventos';
const CLAVE_CONSECUTIVO = '@mesa_ayuda_demo_consecutivo';

let activo = false;
export const esDemo = () => activo;

async function persistir() {
  const datos = [
    [CLAVE_TICKETS, JSON.stringify(tickets)],
    [CLAVE_EVENTOS, JSON.stringify(eventos)],
    [CLAVE_CONSECUTIVO, String(consecutivo)],
  ];
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      window.localStorage.setItem(CLAVE_TICKETS, JSON.stringify(tickets));
      window.localStorage.setItem(CLAVE_EVENTOS, JSON.stringify(eventos));
      window.localStorage.setItem(CLAVE_CONSECUTIVO, String(consecutivo));
    }
  } catch {}
  try {
    await AsyncStorage.multiSet(datos);
  } catch {}
}

export async function restaurarDemo() {
  try {
    let t, e, c;
    if (typeof window !== 'undefined' && window?.localStorage) {
      t = window.localStorage.getItem(CLAVE_TICKETS);
      e = window.localStorage.getItem(CLAVE_EVENTOS);
      c = window.localStorage.getItem(CLAVE_CONSECUTIVO);
    }
    if (!t) {
      const pares = await AsyncStorage.multiGet([
        CLAVE_TICKETS,
        CLAVE_EVENTOS,
        CLAVE_CONSECUTIVO,
      ]);
      t = pares[0]?.[1];
      e = pares[1]?.[1];
      c = pares[2]?.[1];
    }

    if (t) {
      tickets = JSON.parse(t);
      if (e) eventos = JSON.parse(e);
      if (c) consecutivo = Number(c);
      activo = true;
      return true;
    }
  } catch {}
  return false;
}

export const activarDemo = () => {
  activo = true;
  reiniciar();
  persistir();
};

export const desactivarDemo = () => {
  activo = false;
};

export const limpiarPersistenciaDemo = async () => {
  activo = false;
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      window.localStorage.removeItem(CLAVE_TICKETS);
      window.localStorage.removeItem(CLAVE_EVENTOS);
      window.localStorage.removeItem(CLAVE_CONSECUTIVO);
    }
  } catch {}
  try {
    await AsyncStorage.multiRemove([CLAVE_TICKETS, CLAVE_EVENTOS, CLAVE_CONSECUTIVO]);
  } catch {}
};

export const PERFIL_DEMO = {
  id: 'demo-usuario',
  nombre: 'Invitado',
  correo: 'demo@local',
  rol: 'admin',
  ficha: '0000000',
  programa: 'Análisis y Desarrollo de Software',
  telefono: '—',
  creado_at: new Date().toISOString(),
};

const TECNICO = { id: 'demo-tecnico', nombre: 'Carlos Ríos', rol: 'tecnico' };

export const CATEGORIAS = [
  { id: 'c1', nombre: 'Red e internet', sla_horas: 4 },
  { id: 'c2', nombre: 'Equipos de computo', sla_horas: 8 },
  { id: 'c3', nombre: 'Video y proyeccion', sla_horas: 6 },
  { id: 'c4', nombre: 'Software', sla_horas: 24 },
  { id: 'c5', nombre: 'Electrico', sla_horas: 4 },
  { id: 'c6', nombre: 'Mobiliario', sla_horas: 48 },
  { id: 'c7', nombre: 'Climatizacion', sla_horas: 24 },
];

export const AMBIENTES = [
  { id: 'a1', codigo: 'A-101', nombre: 'Sala de sistemas 1' },
  { id: 'a2', codigo: 'A-102', nombre: 'Sala de sistemas 2' },
  { id: 'a3', codigo: 'A-201', nombre: 'Aula multiple' },
  { id: 'a4', codigo: 'B-101', nombre: 'Laboratorio de redes' },
  { id: 'a5', codigo: 'B-102', nombre: 'Taller de mantenimiento' },
  { id: 'a6', codigo: 'B-203', nombre: 'Sala de diseno' },
  { id: 'a7', codigo: 'C-101', nombre: 'Biblioteca' },
  { id: 'a8', codigo: 'C-102', nombre: 'Auditorio' },
];

export const ACTIVOS = ['pendiente', 'en_proceso'];

let tickets = [];
let eventos = [];
let consecutivo = 0;

const hace = (horas) => new Date(Date.now() - horas * 3600 * 1000).toISOString();

function nuevoCodigo() {
  consecutivo += 1;
  return `MA-${new Date().getFullYear()}-${String(consecutivo).padStart(4, '0')}`;
}

// El tiempo de atención sale directo de la categoría o 24h por defecto.
function vencimiento(creadoAt, categoriaId) {
  const sla = CATEGORIAS.find((x) => x.id === categoriaId)?.sla_horas ?? 24;
  return new Date(new Date(creadoAt).getTime() + sla * 3600 * 1000).toISOString();
}

function crear({
  titulo,
  descripcion,
  categoria_id,
  ambiente_id,
  categoria,
  ambiente,
  prioridad = 'media',
  horasAtras = 0,
}) {
  const catTexto = categoria || (typeof categoria_id === 'string' && !categoria_id.startsWith('c') ? categoria_id : null);
  const ambTexto = ambiente || (typeof ambiente_id === 'string' && !ambiente_id.startsWith('a') ? ambiente_id : null);

  const catEncontrada = CATEGORIAS.find(
    (x) => x.id === categoria_id || (catTexto && x.nombre.toLowerCase() === catTexto.toLowerCase())
  );
  const ambEncontrado = AMBIENTES.find(
    (x) => x.id === ambiente_id || (ambTexto && (x.codigo.toLowerCase() === ambTexto.toLowerCase() || x.nombre.toLowerCase() === ambTexto.toLowerCase()))
  );

  const finalCatId = catEncontrada?.id ?? (catTexto ? 'c1' : categoria_id ?? 'c1');
  const finalAmbId = ambEncontrado?.id ?? (ambTexto ? 'a1' : ambiente_id ?? 'a1');
  const finalCatNombre = catTexto || catEncontrada?.nombre || 'General';
  const finalAmbCodigo = ambTexto || ambEncontrado?.codigo || 'Ambiente';

  const creado_at = hace(horasAtras);
  const ticket = {
    id: `t-${tickets.length + 1}`,
    codigo: nuevoCodigo(),
    titulo,
    descripcion,
    categoria_id: finalCatId,
    ambiente_id: finalAmbId,
    categoria_nombre: finalCatNombre,
    ambiente_codigo: finalAmbCodigo,
    prioridad,
    estado: 'pendiente',
    reportante_id: PERFIL_DEMO.id,
    tecnico_id: null,
    solucion: null,
    creado_at,
    atendido_at: null,
    resuelto_at: null,
    vence_at: vencimiento(creado_at, finalCatId),
    actualizado_at: creado_at,
  };
  tickets.push(ticket);
  eventos.push({
    id: `ev-${eventos.length + 1}`,
    ticket_id: ticket.id,
    actor_id: PERFIL_DEMO.id,
    tipo: 'creacion',
    estado_anterior: null,
    estado_nuevo: 'pendiente',
    comentario: 'Falla reportada',
    creado_at,
    perfiles: { nombre: PERFIL_DEMO.nombre },
  });
  persistir();
  return ticket;
}

// Avanza un ticket dejando rastro en la bitácora, igual que los triggers.
function avanzar(ticket, cambios) {
  const anterior = ticket.estado;
  Object.assign(ticket, cambios);
  ticket.actualizado_at = new Date().toISOString();

  if (cambios.estado && cambios.estado !== anterior) {
    if (cambios.estado === 'en_proceso' && !ticket.atendido_at) {
      ticket.atendido_at = new Date().toISOString();
    }
    if (cambios.estado === 'resuelto') {
      if (!ticket.atendido_at) ticket.atendido_at = new Date().toISOString();
      ticket.resuelto_at = new Date().toISOString();
    }

    eventos.push({
      id: `ev-${eventos.length + 1}`,
      ticket_id: ticket.id,
      actor_id: PERFIL_DEMO.id,
      tipo: 'cambio_estado',
      estado_anterior: anterior,
      estado_nuevo: cambios.estado,
      comentario: cambios.solucion ?? null,
      creado_at: new Date().toISOString(),
      perfiles: { nombre: PERFIL_DEMO.nombre },
    });
  }
  persistir();
  return ticket;
}

// Reescribe las marcas de tiempo de un ticket, y las de sus eventos, para
// que el histórico de ejemplo no se amontone en el instante de arranque.
function fechar(ticket, marcas) {
  Object.assign(ticket, marcas);

  const fechas = Object.values(marcas).sort();
  const propios = eventos.filter((e) => e.ticket_id === ticket.id && e.tipo !== 'creacion');
  propios.forEach((e, i) => {
    e.creado_at = fechas[Math.min(i, fechas.length - 1)];
  });
}

// Estado inicial: un ticket por cada situación que la interfaz debe mostrar.
function reiniciar() {
  tickets = [];
  eventos = [];
  consecutivo = 0;

  // Pendiente y vencido
  crear({
    titulo: 'El videobeam no proyecta',
    descripcion:
      'Enciende pero la imagen se ve azul. Probamos con otro cable HDMI y sigue igual.',
    categoria_id: 'c3',
    ambiente_id: 'a1',
    prioridad: 'alta',
    horasAtras: 9,
  });

  // Pendiente y dentro del plazo
  crear({
    titulo: 'Sin internet en el laboratorio de redes',
    descripcion:
      'Ningún equipo del ambiente tiene conexión. El switch tiene las luces apagadas.',
    categoria_id: 'c1',
    ambiente_id: 'a4',
    prioridad: 'alta',
    horasAtras: 0.4,
  });

  // En proceso
  const enProceso = crear({
    titulo: 'El equipo 12 no enciende',
    descripcion:
      'Al presionar el botón no da señal de vida. Ya se revisó que el cable de poder esté bien.',
    categoria_id: 'c2',
    ambiente_id: 'a2',
    prioridad: 'media',
    horasAtras: 6,
  });
  avanzar(enProceso, { tecnico_id: TECNICO.id, estado: 'en_proceso' });
  // Las marcas quedarían en "ahora"; se retrasan para que los tiempos
  // promedio del tablero se parezcan a los de un servicio real.
  fechar(enProceso, { atendido_at: hace(4) });

  // Resuelto
  const resuelto = crear({
    titulo: 'Dos sillas del ambiente están rotas',
    descripcion:
      'Las sillas de los puestos 8 y 9 tienen el espaldar suelto y no se pueden usar.',
    categoria_id: 'c6',
    ambiente_id: 'a6',
    prioridad: 'baja',
    horasAtras: 72,
  });
  avanzar(resuelto, { tecnico_id: TECNICO.id, estado: 'en_proceso' });
  avanzar(resuelto, {
    estado: 'resuelto',
    solucion: 'Se reemplazaron los tornillos del espaldar y se ajustaron ambas sillas.',
  });
  fechar(resuelto, { atendido_at: hace(70), resuelto_at: hace(67) });

  // En proceso, con el reloj ajustado
  const clima = crear({
    titulo: 'El aire acondicionado no enfría',
    descripcion: 'Prende y suena normal pero el aire sale caliente. Lleva así toda la semana.',
    categoria_id: 'c7',
    ambiente_id: 'a7',
    prioridad: 'media',
    horasAtras: 20,
  });
  avanzar(clima, { tecnico_id: TECNICO.id, estado: 'en_proceso' });
  fechar(clima, { atendido_at: hace(18) });

  // Pendiente, prioridad baja
  crear({
    titulo: 'Licencia del software de diseño vencida',
    descripcion: 'Al abrir el programa aparece un aviso de licencia expirada y se cierra solo.',
    categoria_id: 'c4',
    ambiente_id: 'a6',
    prioridad: 'baja',
    horasAtras: 6,
  });
}

// --- Lo que consume la capa de datos -----------------------------------------

const nombreDe = (id) =>
  id === PERFIL_DEMO.id ? PERFIL_DEMO.nombre : id === TECNICO.id ? TECNICO.nombre : null;

function detalle(t) {
  const horasEntre = (a, b) =>
    a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 3600000 : null;

  return {
    ...t,
    categoria_nombre: t.categoria_nombre || CATEGORIAS.find((x) => x.id === t.categoria_id)?.nombre || 'General',
    ambiente_codigo: t.ambiente_codigo || AMBIENTES.find((x) => x.id === t.ambiente_id)?.codigo || 'Ambiente',
    ambiente_nombre: t.ambiente_nombre || AMBIENTES.find((x) => x.id === t.ambiente_id)?.nombre || t.ambiente_codigo || 'Ambiente',
    reportante_nombre: nombreDe(t.reportante_id),
    tecnico_nombre: nombreDe(t.tecnico_id),
    horas_respuesta: horasEntre(t.creado_at, t.atendido_at ?? new Date().toISOString()),
    horas_resolucion: horasEntre(t.creado_at, t.resuelto_at ?? new Date().toISOString()),
  };
}

export const listar = () =>
  tickets
    .slice()
    .sort((a, b) => new Date(b.creado_at) - new Date(a.creado_at))
    .map(detalle);

export const obtener = (id) => {
  const t = tickets.find((x) => x.id === id);
  return t ? detalle(t) : null;
};

export const eventosDe = (id) =>
  eventos
    .filter((e) => e.ticket_id === id)
    .sort((a, b) => new Date(a.creado_at) - new Date(b.creado_at));

export const insertar = (datos) => crear({ ...datos, horasAtras: 0 });

export const modificar = async (id, cambios) => {
  const t = tickets.find((x) => x.id === id);
  if (t) {
    avanzar(t, cambios);
    await persistir();
  }
  return t;
};

export function indicadores() {
  const cuenta = (estado) => tickets.filter((t) => t.estado === estado).length;
  const activos = tickets.filter((t) => ACTIVOS.includes(t.estado));
  const promedio = (valores) => {
    const v = valores.filter((x) => x !== null && x !== undefined);
    return v.length ? Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)) : null;
  };

  return {
    total: tickets.length,
    pendientes: cuenta('pendiente'),
    en_proceso: cuenta('en_proceso'),
    resueltos: cuenta('resuelto'),
    cancelados: cuenta('cancelado'),
    vencidos: activos.filter((t) => new Date(t.vence_at) < new Date()).length,
    prom_horas_respuesta: promedio(
      tickets.filter((t) => t.atendido_at).map((t) => detalle(t).horas_respuesta)
    ),
    prom_horas_resolucion: promedio(
      tickets.filter((t) => t.resuelto_at).map((t) => detalle(t).horas_resolucion)
    ),
  };
}

export function porAmbiente() {
  return AMBIENTES.map((a) => {
    const suyos = tickets.filter((t) => t.ambiente_id === a.id);
    return {
      codigo: a.codigo,
      nombre: a.nombre,
      total: suyos.length,
      pendientes: suyos.filter((t) => ACTIVOS.includes(t.estado)).length,
    };
  })
    .filter((a) => a.total > 0)
    .sort((a, b) => b.total - a.total);
}
