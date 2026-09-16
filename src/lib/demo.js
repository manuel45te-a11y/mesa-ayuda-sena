import AsyncStorage from '@react-native-async-storage/async-storage';

const CLAVE_TICKETS = '@mesa_ayuda_demo_tickets';
const CLAVE_EVENTOS = '@mesa_ayuda_demo_eventos';
const CLAVE_ADJUNTOS = '@mesa_ayuda_demo_adjuntos';
const CLAVE_CONSECUTIVO = '@mesa_ayuda_demo_consecutivo';
const CLAVE_ROL_ACTIVO = '@mesa_ayuda_demo_rol_activo';

let activo = false;
export const esDemo = () => activo;

export const USUARIOS_DEMO = {
  admin: {
    id: 'demo-admin',
    nombre: 'Admin Coordinador',
    correo: 'larioscarvajal2007@gmail.com',
    rol: 'admin',
    ficha: '0000000',
    programa: 'Coordinación de TIC y Ambientes',
    telefono: '310 555 0101',
    creado_at: new Date().toISOString(),
  },
  tecnico: {
    id: 'demo-tecnico-1',
    nombre: 'Carlos Ríos',
    correo: 'carlos.tecnico@sena.edu.co',
    rol: 'tecnico',
    ficha: '0000000',
    programa: 'Soporte e Infraestructura TI',
    telefono: '310 555 0102',
    creado_at: new Date().toISOString(),
  },
  aprendiz: {
    id: 'demo-usuario-1',
    nombre: 'María Gómez',
    correo: 'maria.aprendiz@sena.edu.co',
    rol: 'aprendiz',
    ficha: '2758412',
    programa: 'Análisis y Desarrollo de Software',
    telefono: '310 555 0103',
    creado_at: new Date().toISOString(),
  },
  usuario: {
    id: 'demo-usuario-1',
    nombre: 'María Gómez',
    correo: 'maria.aprendiz@sena.edu.co',
    rol: 'aprendiz',
    ficha: '2758412',
    programa: 'Análisis y Desarrollo de Software',
    telefono: '310 555 0103',
    creado_at: new Date().toISOString(),
  },
};

export const TECNICOS = [
  {
    id: 'demo-tecnico-1',
    nombre: 'Carlos Ríos',
    correo: 'carlos.tecnico@sena.edu.co',
    rol: 'tecnico',
    especialidad: 'Redes y Equipos',
  },
  {
    id: 'demo-tecnico-2',
    nombre: 'Laura Gómez',
    correo: 'laura.tecnico@sena.edu.co',
    rol: 'tecnico',
    especialidad: 'Audiovisuales y Conectividad',
  },
  {
    id: 'demo-tecnico-3',
    nombre: 'David Torres',
    correo: 'david.tecnico@sena.edu.co',
    rol: 'tecnico',
    especialidad: 'Sistemas y Climatización',
  },
];

let rolActivo = 'admin';

export const obtenerPerfilDemo = () => USUARIOS_DEMO[rolActivo] || USUARIOS_DEMO.admin;

export const PERFIL_DEMO = new Proxy(USUARIOS_DEMO.admin, {
  get(target, prop) {
    const actual = obtenerPerfilDemo();
    return actual[prop] !== undefined ? actual[prop] : target[prop];
  },
});

export const cambiarRolDemo = (nuevoRol) => {
  const clave = nuevoRol === 'usuario' ? 'aprendiz' : nuevoRol;
  if (USUARIOS_DEMO[clave]) {
    rolActivo = clave;
    try {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.setItem(CLAVE_ROL_ACTIVO, clave);
      }
    } catch {}
    persistir();
    return USUARIOS_DEMO[clave];
  }
  return obtenerPerfilDemo();
};

export const listarTecnicos = () => TECNICOS;

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
let consecutivo = 0;

const hace = (horas) => new Date(Date.now() - horas * 3600 * 1000).toISOString();

function nuevoCodigo() {
  consecutivo += 1;
  return `MA-${new Date().getFullYear()}-${String(consecutivo).padStart(4, '0')}`;
}

function vencimiento(creadoAt, categoriaId) {
  const sla = CATEGORIAS.find((x) => x.id === categoriaId)?.sla_horas ?? 24;
  return new Date(new Date(creadoAt).getTime() + sla * 3600 * 1000).toISOString();
}

async function persistir() {
  const datos = [
    [CLAVE_TICKETS, JSON.stringify(tickets)],
    [CLAVE_EVENTOS, JSON.stringify(eventos)],
    [CLAVE_ADJUNTOS, JSON.stringify(adjuntos)],
    [CLAVE_CONSECUTIVO, String(consecutivo)],
    [CLAVE_ROL_ACTIVO, rolActivo],
  ];
  try {
    if (typeof window !== 'undefined' && window?.localStorage) {
      window.localStorage.setItem(CLAVE_TICKETS, JSON.stringify(tickets));
      window.localStorage.setItem(CLAVE_EVENTOS, JSON.stringify(eventos));
      window.localStorage.setItem(CLAVE_ADJUNTOS, JSON.stringify(adjuntos));
      window.localStorage.setItem(CLAVE_CONSECUTIVO, String(consecutivo));
      window.localStorage.setItem(CLAVE_ROL_ACTIVO, rolActivo);
    }
  } catch {}
  try {
    await AsyncStorage.multiSet(datos);
  } catch {}
}

export async function restaurarDemo() {
  try {
    let t, e, a, c, r;
    if (typeof window !== 'undefined' && window?.localStorage) {
      t = window.localStorage.getItem(CLAVE_TICKETS);
      e = window.localStorage.getItem(CLAVE_EVENTOS);
      a = window.localStorage.getItem(CLAVE_ADJUNTOS);
      c = window.localStorage.getItem(CLAVE_CONSECUTIVO);
      r = window.localStorage.getItem(CLAVE_ROL_ACTIVO);
    }
    if (!t) {
      const pares = await AsyncStorage.multiGet([
        CLAVE_TICKETS,
        CLAVE_EVENTOS,
        CLAVE_ADJUNTOS,
        CLAVE_CONSECUTIVO,
        CLAVE_ROL_ACTIVO,
      ]);
      t = pares[0]?.[1];
      e = pares[1]?.[1];
      a = pares[2]?.[1];
      c = pares[3]?.[1];
      r = pares[4]?.[1];
    }

    if (t) {
      tickets = JSON.parse(t);
      if (e) eventos = JSON.parse(e);
      if (a) adjuntos = JSON.parse(a);
      if (c) consecutivo = Number(c);
      if (r && USUARIOS_DEMO[r]) rolActivo = r;
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
      window.localStorage.removeItem(CLAVE_ADJUNTOS);
      window.localStorage.removeItem(CLAVE_CONSECUTIVO);
      window.localStorage.removeItem(CLAVE_ROL_ACTIVO);
    }
  } catch {}
  try {
    await AsyncStorage.multiRemove([
      CLAVE_TICKETS,
      CLAVE_EVENTOS,
      CLAVE_ADJUNTOS,
      CLAVE_CONSECUTIVO,
      CLAVE_ROL_ACTIVO,
    ]);
  } catch {}
};

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
  const autorId = reportante_id || obtenerPerfilDemo().id;
  const autorNombre = nombreDe(autorId);

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
    reportante_id: autorId,
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
    actor_id: autorId,
    tipo: 'creacion',
    estado_anterior: null,
    estado_nuevo: 'pendiente',
    comentario: 'Falla reportada',
    creado_at,
    perfiles: { nombre: autorNombre },
  });
  persistir();
  return ticket;
}

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

    const actor = obtenerPerfilDemo();
    eventos.push({
      id: `ev-${eventos.length + 1}`,
      ticket_id: ticket.id,
      actor_id: actor.id,
      tipo: 'cambio_estado',
      estado_anterior: anterior,
      estado_nuevo: cambios.estado,
      comentario: cambios.solucion ?? (cambios.comentario || null),
      creado_at: new Date().toISOString(),
      perfiles: { nombre: actor.nombre },
    });
  }
  persistir();
  return ticket;
}

function fechar(ticket, marcas) {
  Object.assign(ticket, marcas);
  const fechas = Object.values(marcas).sort();
  const propios = eventos.filter((e) => e.ticket_id === ticket.id && e.tipo !== 'creacion');
  propios.forEach((e, i) => {
    e.creado_at = fechas[Math.min(i, fechas.length - 1)];
  });
}

function reiniciar() {
  tickets = [];
  eventos = [];
  adjuntos = [];
  consecutivo = 0;
  rolActivo = 'admin';

  // 1. Pendiente y vencido (Sin asignar)
  crear({
    titulo: 'El videobeam no proyecta',
    descripcion:
      'Enciende pero la imagen se ve azul. Probamos con otro cable HDMI y sigue igual.',
    categoria_id: 'c3',
    ambiente_id: 'a1',
    prioridad: 'alta',
    reportante_id: USUARIOS_DEMO.aprendiz.id,
    horasAtras: 9,
  });

  // 2. Pendiente y dentro del plazo (Sin asignar)
  crear({
    titulo: 'Sin internet en el laboratorio de redes',
    descripcion:
      'Ningún equipo del ambiente tiene conexión. El switch tiene las luces apagadas.',
    categoria_id: 'c1',
    ambiente_id: 'a4',
    prioridad: 'alta',
    reportante_id: USUARIOS_DEMO.aprendiz.id,
    horasAtras: 0.4,
  });

  // 3. En proceso (Asignado a Carlos Ríos)
  const enProceso = crear({
    titulo: 'El equipo 12 no enciende',
    descripcion:
      'Al presionar el botón no da señal de vida. Ya se revisó que el cable de poder esté bien.',
    categoria_id: 'c2',
    ambiente_id: 'a2',
    prioridad: 'media',
    reportante_id: USUARIOS_DEMO.aprendiz.id,
    horasAtras: 6,
  });
  avanzar(enProceso, { tecnico_id: 'demo-tecnico-1', estado: 'en_proceso' });
  fechar(enProceso, { atendido_at: hace(4) });

  // 4. Resuelto con evidencia montada
  const resuelto = crear({
    titulo: 'Dos sillas del ambiente están rotas',
    descripcion:
      'Las sillas de los puestos 8 y 9 tienen el espaldar suelto y no se pueden usar.',
    categoria_id: 'c6',
    ambiente_id: 'a6',
    prioridad: 'baja',
    reportante_id: USUARIOS_DEMO.aprendiz.id,
    horasAtras: 72,
  });
  avanzar(resuelto, { tecnico_id: 'demo-tecnico-1', estado: 'en_proceso' });

  // Evidencia técnica montada previa a la resolución
  adjuntos.push({
    id: 'adj-demo-1',
    ticket_id: resuelto.id,
    ruta: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    nombre: 'Ajuste_y_reparacion_sillas.jpg',
    descripcion: 'Se realizó el reemplazo de pernos y refuerzo de sujeción en ambos espaldares.',
    subido_por: 'demo-tecnico-1',
    subido_por_nombre: 'Carlos Ríos',
    creado_at: hace(68),
  });

  avanzar(resuelto, {
    estado: 'resuelto',
    solucion: 'Se reemplazaron los tornillos del espaldar, se ajustaron ambas sillas y se verificó firmeza.',
  });
  fechar(resuelto, { atendido_at: hace(70), resuelto_at: hace(67) });

  // 5. En proceso asignado a Laura Gómez
  const clima = crear({
    titulo: 'El aire acondicionado no enfría',
    descripcion: 'Prende y suena normal pero el aire sale caliente. Lleva así toda la semana.',
    categoria_id: 'c7',
    ambiente_id: 'a7',
    prioridad: 'media',
    reportante_id: USUARIOS_DEMO.aprendiz.id,
    horasAtras: 20,
  });
  avanzar(clima, { tecnico_id: 'demo-tecnico-2', estado: 'en_proceso' });
  fechar(clima, { atendido_at: hace(18) });

  // 6. Pendiente, prioridad baja (Sin asignar)
  crear({
    titulo: 'Licencia del software de diseño vencida',
    descripcion: 'Al abrir el programa aparece un aviso de licencia expirada y se cierra solo.',
    categoria_id: 'c4',
    ambiente_id: 'a6',
    prioridad: 'baja',
    reportante_id: USUARIOS_DEMO.aprendiz.id,
    horasAtras: 6,
  });
}

function nombreDe(id) {
  if (!id) return null;
  const u = Object.values(USUARIOS_DEMO).find((x) => x.id === id);
  if (u) return u.nombre;
  const t = TECNICOS.find((x) => x.id === id);
  if (t) return t.nombre;
  return 'Usuario';
}

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
    evidencias_conteo: adjuntos.filter((a) => a.ticket_id === t.id).length,
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

// Asigna un técnico al ticket (exclusivo para Administrador)
export const asignarTecnico = async (ticketId, tecnicoId, comentario) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'Solicitud no encontrada' };

  const tecnico = TECNICOS.find((tec) => tec.id === tecnicoId);
  const nombreTecnico = tecnico ? tecnico.nombre : 'Técnico';
  const actor = obtenerPerfilDemo();

  const anterior = t.estado;
  t.tecnico_id = tecnicoId;
  if (t.estado === 'pendiente') {
    t.estado = 'en_proceso';
    t.atendido_at = t.atendido_at || new Date().toISOString();
  }
  t.actualizado_at = new Date().toISOString();

  eventos.push({
    id: `ev-${eventos.length + 1}`,
    ticket_id: t.id,
    actor_id: actor.id,
    tipo: 'asignacion',
    estado_anterior: anterior,
    estado_nuevo: t.estado,
    comentario:
      comentario || `Técnico asignado: ${nombreTecnico} (por ${actor.nombre})`,
    creado_at: new Date().toISOString(),
    perfiles: { nombre: actor.nombre },
  });

  await persistir();
  return { ticket: detalle(t), error: null };
};

// Sube una evidencia al ticket (para Técnico o Administrador)
export const subirEvidencia = async (ticketId, { imagen, descripcion, nombre }) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'Solicitud no encontrada' };

  const actor = obtenerPerfilDemo();
  const nuevaEvidencia = {
    id: `adj-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticket_id: ticketId,
    ruta: imagen,
    nombre: nombre || 'Evidencia técnica',
    descripcion: descripcion || '',
    subido_por: actor.id,
    subido_por_nombre: actor.nombre,
    creado_at: new Date().toISOString(),
  };

  adjuntos.push(nuevaEvidencia);
  eventos.push({
    id: `ev-${eventos.length + 1}`,
    ticket_id: ticketId,
    actor_id: actor.id,
    tipo: 'evidencia',
    estado_anterior: t.estado,
    estado_nuevo: t.estado,
    comentario: `Evidencia técnica adjuntada: ${nuevaEvidencia.nombre}${
      descripcion ? ` — ${descripcion}` : ''
    }`,
    creado_at: new Date().toISOString(),
    perfiles: { nombre: actor.nombre },
  });

  await persistir();
  return { evidencia: nuevaEvidencia, error: null };
};

export const obtenerEvidencias = (ticketId) => {
  return adjuntos
    .filter((a) => a.ticket_id === ticketId)
    .sort((a, b) => new Date(b.creado_at) - new Date(a.creado_at));
};

// Cierra el ticket verificando que tenga al menos una evidencia montada
export const cerrarTicket = async (ticketId, { solucion, tecnicoId }) => {
  const t = tickets.find((x) => x.id === ticketId);
  if (!t) return { error: 'Solicitud no encontrada' };

  const evidencias = adjuntos.filter((a) => a.ticket_id === ticketId);
  if (evidencias.length === 0) {
    return {
      error:
        'No se puede cerrar el ticket: es obligatorio montar al menos una evidencia técnica antes de marcarlo como resuelto.',
    };
  }

  if (!solucion || !solucion.trim()) {
    return { error: 'Por favor describe la solución aplicada.' };
  }

  const actor = obtenerPerfilDemo();
  avanzar(t, {
    estado: 'resuelto',
    solucion: solucion.trim(),
    tecnico_id: tecnicoId || t.tecnico_id || actor.id,
    comentario: `Solicitud cerrada y evidenciada con ${evidencias.length} prueba(s) técnica(s)`,
  });

  await persistir();
  return { ticket: detalle(t), error: null };
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
