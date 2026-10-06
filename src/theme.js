import { Appearance, Platform } from 'react-native';
import { CONFIG } from './config/organizacion';

// ===========================================================================
//  COLORES, TIPOGRAFÍA Y MEDIDAS
//
//  Hay dos paletas, clara y oscura, y la app usa la que tenga puesta el
//  dispositivo. Las dos están pensadas para mirarlas mucho rato: fondos sin
//  negros ni blancos puros, grises que no deslumbran y colores de aviso
//  suaves. El contraste de cada combinación de texto está comprobado en
//  src/__tests__/theme.test.js (mínimo 4.5:1, el valor accesible).
//
//  El color de marca lo elige cada organización con EXPO_PUBLIC_COLOR
//  (ver .env.example); los demás colores no cambian.
// ===========================================================================

// Fuente (Inter): en la web se usa la del sistema como respaldo.
export const fontFamily = Platform.select({
  web: 'Inter, system-ui, sans-serif',
  default: 'Inter',
});

export const PALETAS = {
  oscuro: {
    // Superficies: de la más honda (fondo) a la más cercana (panelSuave).
    fondo: '#161920',
    panel: '#1D2129',
    panelAlto: '#242933',
    panelSuave: '#2E3440',

    // Líneas
    linea: '#2B313C',
    lineaFuerte: '#3D4452',

    // Texto
    texto: '#E3E6EC',
    textoSuave: '#AAB1BE',
    textoTenue: '#8C95A3',

    // Colores con significado: el fuerte para texto e iconos, el "Bajo" para
    // el fondo de la etiqueta que lo acompaña.
    azul: '#7DB3EE',
    azulBajo: '#1B2A3C',
    cian: '#6CC7D2',
    cianBajo: '#172F37',
    ambar: '#E0B062',
    ambarBajo: '#332A1B',
    verde: '#7CC49A',
    verdeBajo: '#1B3026',
    rojo: '#EC8A8A',
    rojoBajo: '#3A2226',
    gris: '#A3AAB6',
    grisBajo: '#272C36',
  },

  claro: {
    fondo: '#F3F4F7',
    panel: '#FFFFFF',
    panelAlto: '#F1F3F7',
    panelSuave: '#E6E9EF',

    linea: '#E1E4EA',
    lineaFuerte: '#C8CDD7',

    texto: '#1C2130',
    textoSuave: '#4A5162',
    textoTenue: '#616B7A',

    azul: '#2267B3',
    azulBajo: '#E7F0FA',
    cian: '#0D7683',
    cianBajo: '#E2F3F5',
    ambar: '#986000',
    ambarBajo: '#FAF0DD',
    verde: '#257A4C',
    verdeBajo: '#E4F3E9',
    rojo: '#BD3B3B',
    rojoBajo: '#FBE9E9',
    gris: '#5E6676',
    grisBajo: '#ECEEF2',
  },
};

// Color de la organización. marca = botones y elementos activos;
// marcaAlta = texto y enlaces; marcaBaja = fondos suaves; marcaTexto = lo que
// va encima de marca.
export const ACENTOS = {
  indigo: {
    etiqueta: 'Índigo',
    oscuro: { marca: '#6068E0', marcaAlta: '#A9AEF7', marcaBaja: '#262A4A', marcaTexto: '#FFFFFF' },
    claro: { marca: '#4E56C7', marcaAlta: '#434BB6', marcaBaja: '#ECEDFB', marcaTexto: '#FFFFFF' },
  },
  azul: {
    etiqueta: 'Azul',
    oscuro: { marca: '#2D75CF', marcaAlta: '#93C2F5', marcaBaja: '#1C2C43', marcaTexto: '#FFFFFF' },
    claro: { marca: '#1F66B8', marcaAlta: '#1B5CA6', marcaBaja: '#E6F0FB', marcaTexto: '#FFFFFF' },
  },
  violeta: {
    etiqueta: 'Violeta',
    oscuro: { marca: '#885CD5', marcaAlta: '#C7ADF6', marcaBaja: '#2E2548', marcaTexto: '#FFFFFF' },
    claro: { marca: '#6E47BC', marcaAlta: '#6340AA', marcaBaja: '#F1EBFB', marcaTexto: '#FFFFFF' },
  },
  turquesa: {
    etiqueta: 'Turquesa',
    oscuro: { marca: '#14808A', marcaAlta: '#78D2D8', marcaBaja: '#16343A', marcaTexto: '#FFFFFF' },
    claro: { marca: '#0E7480', marcaAlta: '#0C6872', marcaBaja: '#E0F3F4', marcaTexto: '#FFFFFF' },
  },
};

export const MODO_POR_DEFECTO = 'oscuro';
export const ACENTO_POR_DEFECTO = 'indigo';

export function crearPaleta(modo, acento) {
  const base = PALETAS[modo] ?? PALETAS[MODO_POR_DEFECTO];
  const elegido = ACENTOS[acento] ?? ACENTOS[ACENTO_POR_DEFECTO];
  return { ...base, ...(elegido[modo] ?? elegido[MODO_POR_DEFECTO]) };
}

// El modo se lee una vez al abrir la app: los estilos se arman al inicio, así
// que un cambio en el dispositivo se nota al volver a abrirla.
function modoDelDispositivo() {
  try {
    return Appearance.getColorScheme() === 'light' ? 'claro' : 'oscuro';
  } catch {
    return MODO_POR_DEFECTO;
  }
}

export const MODO = modoDelDispositivo();
export const ACENTO = ACENTOS[CONFIG.color] ? CONFIG.color : ACENTO_POR_DEFECTO;
export const c = crearPaleta(MODO, ACENTO);

export const s = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const r = { sm: 6, md: 10, lg: 14, xl: 20, full: 999 };

// Monoespaciada para los códigos de las solicitudes y las cifras.
export const mono = Platform.select({
  web: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

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

// Ancho a partir del cual se usa barra lateral en vez de pestañas.
export const CORTE_ESCRITORIO = 900;
export const ANCHO_LATERAL = 248;

// ---------------------------------------------------------------------------
// Estados de la solicitud
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

// En la base de datos el rol de quien reporta se llama 'aprendiz' (nombre
// heredado de la primera versión); en pantalla siempre se muestra Usuario.
export const ROLES = {
  aprendiz: 'Usuario',
  tecnico: 'Técnico de soporte',
  admin: 'Administrador',
};

export const COLOR_ROLES = {
  aprendiz: { etiqueta: 'Usuario', color: c.azul, fondo: c.azulBajo },
  tecnico: { etiqueta: 'Técnico', color: c.cian, fondo: c.cianBajo },
  admin: { etiqueta: 'Admin', color: c.marcaAlta, fondo: c.marcaBaja },
};

// Cambios de estado permitidos.
export const TRANSICIONES = {
  pendiente: ['en_proceso', 'cancelado'],
  en_proceso: ['resuelto', 'cancelado'],
  resuelto: [],
  cancelado: [],
};
