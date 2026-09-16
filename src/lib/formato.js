// Utilidades de presentación: fechas, tiempos y textos cortos.

export function fechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fechaHora(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · ${d.toLocaleTimeString(
    'es-CO',
    { hour: '2-digit', minute: '2-digit' }
  )}`;
}

// "hace 3 h", "hace 2 d"
export function desde(iso) {
  if (!iso) return '—';
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} d`;
}

function duracion(minutos) {
  const abs = Math.abs(minutos);
  if (abs < 60) return `${abs} min`;
  const horas = Math.floor(abs / 60);
  if (horas < 24) return `${horas} h`;
  return `${Math.floor(horas / 24)} d`;
}

// Estado del acuerdo de nivel de servicio de un ticket.
export function sla(creadoAt, venceAt, estado) {
  const cerrado = ['resuelto', 'cancelado'].includes(estado);

  if (!venceAt) return { texto: 'Sin SLA', vencido: false, cerrado, progreso: 0 };
  if (cerrado) return { texto: 'Fuera de reloj', vencido: false, cerrado, progreso: 1 };

  const inicio = new Date(creadoAt).getTime();
  const fin = new Date(venceAt).getTime();
  const ahora = Date.now();

  const minutos = Math.floor((fin - ahora) / 60000);
  const vencido = minutos < 0;
  const total = Math.max(1, fin - inicio);
  const progreso = Math.min(1, Math.max(0, (ahora - inicio) / total));

  return {
    texto: vencido ? `Vencido hace ${duracion(minutos)}` : `${duracion(minutos)} restantes`,
    vencido,
    cerrado,
    progreso,
  };
}

export function horas(valor) {
  if (valor === null || valor === undefined) return '—';
  const n = Number(valor);
  if (Number.isNaN(n)) return '—';
  return n < 1 ? `${Math.round(n * 60)} min` : `${n.toFixed(1)} h`;
}

export function iniciales(nombre) {
  if (!nombre) return '?';
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}
