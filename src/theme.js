import { Platform } from 'react-native';

// ===========================================================================
// DESIGN SYSTEM – premium dark theme with Inter font and HSL‑based colors
// ===========================================================================

// Font family (Inter) – web uses system UI fallback, native uses bundled font.
export const fontFamily = Platform.select({
  web: 'Inter, system-ui, sans-serif',
  default: 'Inter',
});

// Color palette (hex values with HSL comments for reference).
export const c = {
  // Surfaces – elegante slate balanceado, natural y descansado a la vista
  fondo: '#0F172A', // Slate 900
  panel: '#1E293B', // Slate 800
  panelAlto: '#273549', // Slate 750
  panelSuave: '#334155', // Slate 700

  // Lines
  linea: '#2A3A4E',
  lineaFuerte: '#43556E',

  // Text
  texto: '#F8FAFC',
  textoSuave: '#94A3B8',
  textoTenue: '#64748B',

  // Brand (Verde Institucional SENA / Esmeralda contemporáneo)
  marca: '#00A34D',
  marcaAlta: '#22C55E',
  marcaBaja: '#0F3A22',

  // Semantic colors
  azul: '#38BDF8',
  azulBajo: '#0C2D48',
  cian: '#06B6D4',
  cianBajo: '#083344',
  ambar: '#F59E0B',
  ambarBajo: '#382305',
  verde: '#10B981',
  verdeBajo: '#093322',
  rojo: '#F43F5E',
  rojoBajo: '#3D1018',
  gris: '#94A3B8',
  grisBajo: '#1E293B',
};

export const s = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const r = { sm: 6, md: 10, lg: 14, xl: 20, full: 999 };

// Monospace for ticket codes and numbers.
export const mono = Platform.select({
  web: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

// Typography – all use the Inter font family where appropriate.
export const t = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6, fontFamily },
  titulo: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3, fontFamily },
  seccion: { fontSize: 15, lineHeight: 20, fontWeight: '700', letterSpacing: -0.1, fontFamily },
  cuerpo: { fontSize: 14, lineHeight: 21, fontFamily },
  pequeno: { fontSize: 12.5, lineHeight: 18, fontFamily },
  micro: { fontSize: 10.5, lineHeight: 14, fontWeight: '700', letterSpacing: 1, fontFamily },
  cifra: { fontFamily: mono, fontSize: 28, lineHeight: 32, fontWeight: '700' },
  codigo: { fontFamily: mono, fontSize: 11.5, letterSpacing: 0.6 },
};

// Responsive breakpoints
export const CORTE_ESCRITORIO = 900;
export const ANCHO_LATERAL = 248;

// ---------------------------------------------------------------------------
// Ticket states – visual cue colors
// ---------------------------------------------------------------------------
export const ESTADOS = {
  pendiente: { etiqueta: 'Pendiente', color: c.azul, fondo: c.azulBajo },
  en_proceso: { etiqueta: 'En proceso', color: c.ambar, fondo: c.ambarBajo },
  resuelto: { etiqueta: 'Resuelto', color: c.verde, fondo: c.verdeBajo },
  cancelado: { etiqueta: 'Cancelado', color: c.textoTenue, fondo: c.grisBajo },
};

export const PRIORIDADES = {
  baja: { etiqueta: 'Baja', color: c.gris, fondo: c.grisBajo, barra: c.lineaFuerte },
  media: { etiqueta: 'Media', color: c.azul, fondo: c.azulBajo, barra: c.azul },
  alta: { etiqueta: 'Alta', color: c.rojo, fondo: c.rojoBajo, barra: c.rojo },
};

export const ROLES = {
  aprendiz: 'Usuario / Aprendiz',
  usuario: 'Usuario / Aprendiz',
  tecnico: 'Técnico de soporte',
  admin: 'Administrador',
};

export const COLOR_ROLES = {
  aprendiz: { etiqueta: 'Usuario', color: c.azul, fondo: c.azulBajo },
  usuario: { etiqueta: 'Usuario', color: c.azul, fondo: c.azulBajo },
  tecnico: { etiqueta: 'Técnico', color: c.cian, fondo: c.cianBajo },
  admin: { etiqueta: 'Admin', color: c.marcaAlta, fondo: c.marcaBaja },
};

// Allowed state transitions.
export const TRANSICIONES = {
  pendiente: ['en_proceso', 'cancelado'],
  en_proceso: ['resuelto', 'cancelado'],
  resuelto: [],
  cancelado: [],
};
