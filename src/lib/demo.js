import AsyncStorage from '@react-native-async-storage/async-storage';
import { FOTOS_EJEMPLO } from './fotosEjemplo';

// ============================================================================
//  MODO DEMOSTRACIÓN
//  Datos en memoria (y guardados en el dispositivo) que imitan a la base de
//  datos, incluidas sus reglas: quién asigna, quién sube evidencias, que no
//  se cierra sin evidencia, etc. Así la demostración se comporta igual que la
//  app conectada a Supabase.
// ============================================================================

const CLAVE_TICKETS = '@mesa_ayuda_demo_tickets';
const CLAVE_EVENTOS = '@mesa_ayuda_demo_eventos';
const CLAVE_ADJUNTOS = '@mesa_ayuda_demo_adjuntos';
const CLAVE_USUARIOS = '@mesa_ayuda_demo_usuarios';
const CLAVE_CONSECUTIVO = '@mesa_ayuda_demo_consecutivo';
const CLAVE_ROL_ACTIVO = '@mesa_ayuda_demo_rol_activo';

const CLAVES = [CLAVE_TICKETS, CLAVE_EVENTOS, CLAVE_ADJUNTOS, CLAVE_USUARIOS, CLAVE_CONSECUTIVO, CLAVE_ROL_ACTIVO];

let activo = false;
export const esDemo = () => activo;

// Personas de la demostración. Las tres primeras son los perfiles con los que
// se entra desde el selector de rol.
const PERSONAS = [
  {
    id: 'demo-admin',
    nombre: 'Admin Coordinador',
    correo: 'coordinacion@demo.local',
    rol: 'admin',
    ficha: null,
    programa: 'Coordinación de TIC y ambientes',
    telefono: '310 555 0101',
  },
  {
    id: 'demo-tecnico-1',
    nombre: 'Carlos Ríos',
    correo: 'carlos.rios@demo.local',
    rol: 'tecnico',
    especialidad: 'Redes y equipos',
    ficha: null,
    programa: 'Soporte e infraestructura TI',
    telefono: '310 555 0102',
  },
  {
    id: 'demo-usuario-1',
    nombre: 'María Gómez',
    correo: 'maria.gomez@demo.local',
    rol: 'aprendiz',
    ficha: '2758412',
    programa: 'Análisis y Desarrollo de Software',
    telefono: '310 555 0103',
  },
  {
    id: 'demo-tecnico-2',
    nombre: 'Laura Gómez',
    correo: 'laura.gomez@demo.local',
    rol: 'tecnico',
    especialidad: 'Audiovisuales y conectividad',
    ficha: null,
    programa: null,
    telefono: '310 555 0104',
  },
  {
    id: 'demo-tecnico-3',
    nombre: 'David Torres',
    correo: 'david.torres@demo.local',
    rol: 'tecnico',
    especialidad: 'Sistemas y climatización',
    ficha: null,
    programa: null,
    telefono: '310 555 0105',
  },
];

// Perfil con el que se entra para cada rol del selector. Su rol no se puede
// cambiar desde la pantalla Usuarios: se cambia con el selector.
const IDENTIDADES = { admin: 'demo-admin', tecnico: 'demo-tecnico-1', aprendiz: 'demo-usuario-1' };
export const ROLES_DEMO = Object.keys(IDENTIDADES);

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
let adjuntos = [];
let usuarios = PERSONAS.map((p) => ({ ...p }));
let consecutivo = 0;
let rolActivo = 'admin';

const hace = (horas) => new Date(Date.now() - horas * 3600 * 1000).toISOString();

// ---------------------------------------------------------------------------
//  Guardado en el dispositivo
// ---------------------------------------------------------------------------
async function persistir() {
  const datos = [
    [CLAVE_TICKETS, JSON.stringify(tickets)],
    [CLAVE_EVENTOS, JSON.stringify(eventos)],
    [CLAVE_ADJUNTOS, JSON.stringify(adjuntos)],
    [CLAVE_USUARIOS, JSON.stringify(usuarios)],
    [CLAVE_CONSECUTIVO, String(consecutivo)],
    [CLAVE_ROL_ACTIVO, rolActivo],
  ];
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      datos.forEach(([clave, valor]) => window.localStorage.setItem(clave, valor));
    }
  } catch {}
  try {
    await AsyncStorage.multiSet(datos);
  } catch {}
}

export async function restaurarDemo() {
  try {
    let valores = {};
    if (typeof window !== 'undefined' && window?.localStorage) {
      CLAVES.forEach((clave) => {
        valores[clave] = window.localStorage.getItem(clave);
      });
    }
    if (!valores[CLAVE_TICKETS]) {
      const pares = await AsyncStorage.multiGet(CLAVES);
      valores = Object.fromEntries(pares);
    }

    if (valores[CLAVE_TICKETS]) {
      tickets = JSON.parse(valores[CLAVE_TICKETS]);
      if (valores[CLAVE_EVENTOS]) eventos = JSON.parse(valores[CLAVE_EVENTOS]);
      if (valores[CLAVE_ADJUNTOS]) adjuntos = JSON.parse(valores[CLAVE_ADJUNTOS]);
      if (valores[CLAVE_USUARIOS]) usuarios = JSON.parse(valores[CLAVE_USUARIOS]);
      if (valores[CLAVE_CONSECUTIVO]) consecutivo = Number(valores[CLAVE_CONSECUTIVO]);
      if (IDENTIDADES[valores[CLAVE_ROL_ACTIVO]]) rolActivo = valores[CLAVE_ROL_ACTIVO];
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
      CLAVES.forEach((clave) => window.localStorage.removeItem(clave));
    }
  } catch {}
  try {
    await AsyncStorage.multiRemove(CLAVES);
  } catch {}
};

// ---------------------------------------------------------------------------
//  Perfil activo
// ---------------------------------------------------------------------------
const persona = (id) => usuarios.find((u) => u.id === id) ?? null;

export const obtenerPerfilDemo = () => persona(IDENTIDADES[rolActivo]) ?? persona(IDENTIDADES.admin);

export const cambiarRolDemo = (nuevoRol) => {
  if (IDENTIDADES[nuevoRol]) {
    rolActivo = nuevoRol;
    persistir();
  }
  return obtenerPerfilDemo();
};

const nombreDe = (id) => persona(id)?.nombre ?? null;

// ---------------------------------------------------------------------------
//  Reglas (las mismas de roles-y-asignacion.sql)
// ---------------------------------------------------------------------------
const esAdmin = (actor) => actor?.rol === 'admin';
const esSoporte = (actor) => ['tecnico', 'admin'].includes(actor?.rol);

// Técnico asignado o administrador, mientras la solicitud siga abierta.
const puedeTrabajar = (t, actor) =>
  ACTIVOS.includes(t.estado) && (t.tecnico_id === actor.id || esAdmin(actor));

function evento(ticket, actor, tipo, estadoAnterior, estadoNuevo, comentario) {
  eventos.push({
    id: `ev-${eventos.length + 1}`,
    ticket_id: ticket.id,
    actor_id: actor?.id ?? null,
    tipo,
    estado_anterior: estadoAnterior ?? null,
    estado_nuevo: estadoNuevo ?? null,
    comentario: comentario ?? null,
    creado_at: new Date().toISOString(),
    perfiles: actor ? { nombre: actor.nombre } : null,
  });
}

function textoAsignacion(antes, ahora) {
  if (!ahora) return `Se quitó a ${nombreDe(antes) ?? 'el técnico'}`;
  if (!antes) return `Asignada a ${nombreDe(ahora) ?? 'un técnico'}`;
  return `Reasignada de ${nombreDe(antes) ?? 'otro técnico'} a ${nombreDe(ahora) ?? 'un técnico'}`;
}

// Aplica un cambio como lo harían los triggers: fechas, paso a "en proceso" al
// asignar y un solo evento en la bitácora. No valida permisos: lo usan el
// arranque de los datos de ejemplo, las pruebas y las funciones de abajo.
function avanzar(ticket, cambios, actor = obtenerPerfilDemo()) {
  const antes = { ...ticket };
  const ahora = new Date().toISOString();
  Object.assign(ticket, cambios);
  ticket.actualizado_at = ahora;

  if (ticket.tecnico_id && antes.estado === 'pendiente' && ticket.estado === 'pendiente') {
    ticket.estado = 'en_proceso';
  }
  if (ticket.estado !== antes.estado) {
    if (ticket.estado === 'en_proceso') ticket.atendido_at = antes.atendido_at ?? ahora;
    if (ticket.estado === 'resuelto') {
      ticket.atendido_at = ticket.atendido_at ?? ahora;
      ticket.resuelto_at = ahora;
    }
  }

  if (ticket.tecnico_id !== antes.tecnico_id) {
    evento(ticket, actor, 'asignacion', antes.estado, ticket.estado, textoAsignacion(antes.tecnico_id, ticket.tecnico_id));
  } else if (ticket.estado !== antes.estado) {
    evento(ticket, actor, 'cambio_estado', antes.estado, ticket.estado, ticket.estado === 'resuelto' ? ticket.solucion : null);
  }

  persistir();
  return ticket;
}

// ---------------------------------------------------------------------------
//  Datos de ejemplo
// ---------------------------------------------------------------------------
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
  reportante_id,
  horasAtras = 0,
}) {
  const catTexto =
    categoria || (typeof categoria_id === 'string' && !categoria_id.startsWith('c') ? categoria_id : null);
  const ambTexto =
    ambiente || (typeof ambiente_id === 'string' && !ambiente_id.startsWith('a') ? ambiente_id : null);

  const catEncontrada = CATEGORIAS.find(
    (x) => x.id === categoria_id || (catTexto && x.nombre.toLowerCase() === catTexto.toLowerCase())
  );
  const ambEncontrado = AMBIENTES.find(
    (x) =>
      x.id === ambiente_id ||
      (ambTexto &&
        (x.codigo.toLowerCase() === ambTexto.toLowerCase() ||
          x.nombre.toLowerCase() === ambTexto.toLowerCase()))
  );

  const finalCatId = catEncontrada?.id ?? (catTexto ? 'c1' : categoria_id ?? 'c1');
  const finalAmbId = ambEncontrado?.id ?? (ambTexto ? 'a1' : ambiente_id ?? 'a1');
  const finalCatNombre = catTexto || catEncontrada?.nombre || 'General';
  const finalAmbCodigo = ambTexto || ambEncontrado?.codigo || 'Ambiente';

  const creado_at = hace(horasAtras);
  const autor = persona(reportante_id) ?? obtenerPerfilDemo();

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
    reportante_id: autor.id,
    tecnico_id: null,
    solucion: null,
    creado_at,
    atendido_at: null,
    resuelto_at: null,
    vence_at: vencimiento(creado_at, finalCatId),
    actualizado_at: creado_at,
  };
  tickets.push(ticket);
  evento(ticket, autor, 'creacion', null, 'pendiente', 'Falla reportada');
  eventos[eventos.length - 1].creado_at = creado_at;
  persistir();
  return ticket;
}

function agregarEvidencia(ticket, actor, { imagen, nombre, descripcion }) {
  const evidencia = {
    id: `adj-${adjuntos.length + 1}-${Date.now()}`,
    ticket_id: ticket.id,
    ruta: imagen,
    nombre: nombre || 'Evidencia',
    descripcion: descripcion || null,
    subido_por: actor.id,
    creado_at: new Date().toISOString(),
  };
  adjuntos.push(evidencia);
  evento(ticket, actor, 'evidencia', null, null, [evidencia.nombre, evidencia.descripcion].filter(Boolean).join(' — '));
  return evidencia;
}

// Pone fechas del pasado a un ticket de ejemplo y a sus eventos (salvo el de
// creación), para que el histórico no se amontone en el instante de arranque.
function fechar(ticket, marcas, fechasEventos = Object.values(marcas).sort()) {
  Object.assign(ticket, marcas);
  const propios = eventos.filter((e) => e.ticket_id === ticket.id && e.tipo !== 'creacion');
  propios.forEach((e, i) => {
    e.creado_at = fechasEventos[Math.min(i, fechasEventos.length - 1)];
  });
}

// Estado inicial: un ticket por cada situación que la interfaz debe mostrar.
function reiniciar() {
  tickets = [];
  eventos = [];
  adjuntos = [];
  usuarios = PERSONAS.map((p) => ({ ...p }));
  consecutivo = 0;
  rolActivo = 'admin';

  const admin = persona('demo-admin');
  const carlos = persona('demo-tecnico-1');
  const aprendiz = 'demo-usuario-1';

  // 1. Pendiente y vencido (sin asignar)
  crear({
    titulo: 'El videobeam no proyecta',
    descripcion: 'Enciende pero la imagen se ve azul. Probamos con otro cable HDMI y sigue igual.',
    categoria_id: 'c3',
    ambiente_id: 'a1',
    prioridad: 'alta',
    reportante_id: aprendiz,
    horasAtras: 9,
  });

  // 2. Pendiente y dentro del plazo (sin asignar)
  crear({
    titulo: 'Sin internet en el laboratorio de redes',
    descripcion: 'Ningún equipo del ambiente tiene conexión. El switch tiene las luces apagadas.',
    categoria_id: 'c1',
    ambiente_id: 'a4',
    prioridad: 'alta',
    reportante_id: aprendiz,
    horasAtras: 0.4,
  });

  // 3. En proceso, asignado a Carlos Ríos
  const enProceso = crear({
    titulo: 'El equipo 12 no enciende',
    descripcion: 'Al presionar el botón no da señal de vida. Ya se revisó que el cable de poder esté bien.',
    categoria_id: 'c2',
    ambiente_id: 'a2',
    prioridad: 'media',
    reportante_id: aprendiz,
    horasAtras: 6,
  });
  avanzar(enProceso, { tecnico_id: carlos.id }, admin);
  fechar(enProceso, { atendido_at: hace(4) });

  // 4. Resuelto por Carlos, con su evidencia
  const resuelto = crear({
    titulo: 'Dos sillas del ambiente están rotas',
    descripcion: 'Las sillas de los puestos 8 y 9 tienen el espaldar suelto y no se pueden usar.',
    categoria_id: 'c6',
    ambiente_id: 'a6',
    prioridad: 'baja',
    reportante_id: aprendiz,
    horasAtras: 72,
  });
  avanzar(resuelto, { tecnico_id: carlos.id }, admin);
  const silla = FOTOS_EJEMPLO[2];
  const evidencia = agregarEvidencia(resuelto, carlos, {
    imagen: silla.imagen,
    nombre: silla.nombre,
    descripcion: 'Se reemplazaron los pernos y se reforzó la sujeción de ambos espaldares.',
  });
  evidencia.creado_at = hace(68);
  avanzar(resuelto, { estado: 'resuelto', solucion: 'Se reemplazaron los tornillos del espaldar y se ajustaron ambas sillas.' }, carlos);
  fechar(resuelto, { atendido_at: hace(70), resuelto_at: hace(67) }, [hace(70), hace(68), hace(67)]);

  // 5. En proceso, asignado a Laura Gómez
  const clima = crear({
    titulo: 'El aire acondicionado no enfría',
    descripcion: 'Prende y suena normal pero el aire sale caliente. Lleva así toda la semana.',
    categoria_id: 'c7',
    ambiente_id: 'a7',
    prioridad: 'media',
    reportante_id: aprendiz,
    horasAtras: 20,
  });
  avanzar(clima, { tecnico_id: 'demo-tecnico-2' }, admin);
  fechar(clima, { atendido_at: hace(18) });

  // 6. Pendiente, prioridad baja (sin asignar)
  crear({
    titulo: 'Licencia del software de diseño vencida',
    descripcion: 'Al abrir el programa aparece un aviso de licencia expirada y se cierra solo.',
    categoria_id: 'c4',
    ambiente_id: 'a6',
    prioridad: 'baja',
    reportante_id: aprendiz,
    horasAtras: 6,
  });
}

// ---------------------------------------------------------------------------
//  Lo que consume la capa de datos
// ---------------------------------------------------------------------------
function detalle(t) {
  const horasEntre = (a, b) =>
    a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 3600000 : null;

  return {
    ...t,
    categoria_nombre:
      t.categoria_nombre || CATEGORIAS.find((x) => x.id === t.categoria_id)?.nombre || 'General',
    ambiente_codigo:
      t.ambiente_codigo || AMBIENTES.find((x) => x.id === t.ambiente_id)?.codigo || 'Ambiente',
    ambiente_nombre:
      t.ambiente_nombre ||
      AMBIENTES.find((x) => x.id === t.ambiente_id)?.nombre ||
      t.ambiente_codigo ||
      'Ambiente',
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

export const obtenerPorCodigo = (codigo) => {
  const buscado = String(codigo ?? '').trim().toUpperCase();
  const t = tickets.find((x) => x.codigo === buscado);
  return t ? detalle(t) : null;
};

export const eventosDe = (id) =>
  eventos
    .filter((e) => e.ticket_id === id)
    .sort((a, b) => new Date(a.creado_at) - new Date(b.creado_at));

export const insertar = (datos) => crear({ ...datos, horasAtras: 0 });

// Cambio directo, sin revisar permisos (lo usan las pruebas).
export const modificar = async (id, cambios) => {
  const t = tickets.find((x) => x.id === id);
  if (t) {
    avanzar(t, cambios);
    await persistir();
  }
  return t;
};

// Técnicos y administradores, para el panel de asignación.
export const listarTecnicos = () =>
  usuarios
    .filter((u) => esSoporte(u))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

// El administrador asigna o reasigna; un técnico solo puede tomar para sí una
// solicitud sin asignar.
export const asignarTecnico = async (ticketId, tecnicoId) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'No se encontró la solicitud.' };

  const actor = obtenerPerfilDemo();
  const destino = persona(tecnicoId);
  const tomaParaSi = actor.rol === 'tecnico' && tecnicoId === actor.id && !t.tecnico_id;

  if (!esAdmin(actor) && !tomaParaSi) {
    return { error: 'No tienes permiso para asignar esta solicitud.' };
  }
  if (!ACTIVOS.includes(t.estado)) return { error: 'La solicitud ya está cerrada.' };
  if (!destino || !esSoporte(destino)) return { error: 'La persona elegida no es técnico ni administrador.' };
  if (t.tecnico_id === tecnicoId) return { ticket: detalle(t), error: null };

  avanzar(t, { tecnico_id: tecnicoId }, actor);
  await persistir();
  return { ticket: detalle(t), error: null };
};

export const subirEvidencia = async (ticketId, { imagen, descripcion, nombre }) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'No se encontró la solicitud.' };

  const actor = obtenerPerfilDemo();
  if (!puedeTrabajar(t, actor)) {
    return { error: 'Solo el técnico asignado o el administrador pueden subir evidencias.' };
  }
  if (!imagen) return { error: 'Elige la foto de la evidencia.' };

  const evidencia = agregarEvidencia(t, actor, { imagen, nombre, descripcion });
  await persistir();
  return { evidencia, error: null };
};

export const obtenerEvidencias = (ticketId) =>
  adjuntos
    .filter((a) => a.ticket_id === ticketId)
    .map((a) => ({ ...a, subido_por_nombre: nombreDe(a.subido_por) }))
    .sort((a, b) => new Date(b.creado_at) - new Date(a.creado_at));

export const cerrarTicket = async (ticketId, { solucion }) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'No se encontró la solicitud.' };

  const actor = obtenerPerfilDemo();
  if (t.estado !== 'en_proceso' || !puedeTrabajar(t, actor)) {
    return { error: 'Solo el técnico asignado o el administrador pueden cerrar una solicitud en proceso.' };
  }
  if ((solucion ?? '').trim().length < 10) {
    return { error: 'Describe la solución aplicada (mínimo 10 caracteres).' };
  }
  if (!adjuntos.some((a) => a.ticket_id === ticketId)) {
    return { error: 'Adjunta al menos una evidencia antes de cerrar la solicitud.' };
  }

  avanzar(t, { estado: 'resuelto', solucion: solucion.trim() }, actor);
  await persistir();
  return { ticket: detalle(t), error: null };
};

export const cancelarTicket = async (ticketId) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'No se encontró la solicitud.' };

  const actor = obtenerPerfilDemo();
  if (!esAdmin(actor)) return { error: 'Solo el administrador puede cancelar una solicitud.' };
  if (!ACTIVOS.includes(t.estado)) return { error: 'La solicitud ya está cerrada.' };

  avanzar(t, { estado: 'cancelado' }, actor);
  await persistir();
  return { error: null };
};

// ---------------------------------------------------------------------------
//  Usuarios y roles
// ---------------------------------------------------------------------------
export const listarUsuarios = () =>
  usuarios
    .map((u) => ({ ...u, perfilDemo: Object.values(IDENTIDADES).includes(u.id) }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

export const cambiarRol = async (usuarioId, rol) => {
  const actor = obtenerPerfilDemo();
  const u = persona(usuarioId);

  if (!esAdmin(actor)) return { error: 'Solo el administrador puede cambiar el rol de una cuenta.' };
  if (!u) return { error: 'No se encontró la cuenta.' };
  if (u.id === actor.id) return { error: 'No puedes cambiar tu propio rol.' };
  if (Object.values(IDENTIDADES).includes(u.id)) {
    return { error: 'Es un perfil de la demostración: su rol se cambia con el selector de rol.' };
  }
  if (!ROLES_DEMO.includes(rol)) return { error: 'Rol no válido.' };

  u.rol = rol;
  await persistir();
  return { error: null };
};

// ---------------------------------------------------------------------------
//  Tablero
// ---------------------------------------------------------------------------
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
