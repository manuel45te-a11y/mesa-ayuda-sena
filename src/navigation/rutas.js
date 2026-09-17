import { getStateFromPath } from '@react-navigation/native';

// ============================================================================
//  RUTAS DE LA APLICACIÓN
//  Un solo lugar para tres cosas de cada pantalla: su dirección web, el
//  título que se ve en la pestaña del navegador y qué roles pueden entrar.
//  Si agregas una pantalla, regístrala aquí además de en RootNavigator.
// ============================================================================

export const NOMBRE_APP = 'Mesa de Ayuda';

// Para abrir la app instalada desde un enlace: mesaayuda://solicitudes/MA-2026-0004
// (debe coincidir con "scheme" en app.json).
export const PREFIJO_MOVIL = 'mesaayuda://';

// ruta:   dirección web, sin la barra inicial ('' es la raíz del sitio)
// titulo: texto de la pestaña del navegador
// roles:  solo para pantallas restringidas; sin roles, entra cualquiera con sesión
export const PANTALLAS = {
  // Sin sesión
  Login: { ruta: 'ingresar', titulo: 'Iniciar sesión' },
  Registro: { ruta: 'registro', titulo: 'Crear cuenta' },
  RecuperarClave: { ruta: 'recuperar-clave', titulo: 'Recuperar contraseña' },

  // Con sesión, en las pestañas (la página principal se titula solo con el
  // nombre de la app)
  Inicio: { ruta: '' },
  Tickets: { ruta: 'solicitudes', titulo: 'Solicitudes' },
  Tablero: { ruta: 'tablero', titulo: 'Tablero', roles: ['admin'] },
  Usuarios: { ruta: 'usuarios', titulo: 'Usuarios', roles: ['admin'] },
  Perfil: { ruta: 'perfil', titulo: 'Mi perfil' },

  // Con sesión, por encima de las pestañas
  NuevoTicket: { ruta: 'solicitudes/nueva', titulo: 'Nueva solicitud' },
  TicketDetalle: { ruta: 'solicitudes/:codigo', titulo: 'Solicitud' },

  // Cualquier dirección que no coincida con las anteriores
  NoEncontrada: { ruta: '*', titulo: 'Página no encontrada' },
};

// Los códigos se guardan en mayúscula (MA-2026-0004), pero el enlace debe
// funcionar aunque alguien lo escriba en minúscula.
export function normalizarCodigo(valor) {
  return String(valor ?? '').trim().toUpperCase();
}

export const configuracionRutas = {
  // Toda pantalla abierta por enlace queda con las pestañas debajo, para
  // que "Volver" tenga a dónde ir.
  initialRouteName: 'Tabs',
  screens: {
    Login: PANTALLAS.Login.ruta,
    Registro: PANTALLAS.Registro.ruta,
    RecuperarClave: PANTALLAS.RecuperarClave.ruta,
    Tabs: {
      screens: {
        Inicio: PANTALLAS.Inicio.ruta,
        Tickets: PANTALLAS.Tickets.ruta,
        Tablero: PANTALLAS.Tablero.ruta,
        Usuarios: PANTALLAS.Usuarios.ruta,
        Perfil: PANTALLAS.Perfil.ruta,
      },
    },
    NuevoTicket: PANTALLAS.NuevoTicket.ruta,
    TicketDetalle: {
      path: PANTALLAS.TicketDetalle.ruta,
      parse: { codigo: normalizarCodigo },
      stringify: { codigo: normalizarCodigo },
    },
    NoEncontrada: PANTALLAS.NoEncontrada.ruta,
  },
};

const PESTANAS = Object.keys(configuracionRutas.screens.Tabs.screens);
const ENCIMA_DE_SOLICITUDES = ['TicketDetalle', 'NuevoTicket'];

// Destino para useLinkProps. Las pestañas viven dentro de 'Tabs', así que el
// enlace tiene que decir ese camino completo; si no, la dirección sale mal
// armada (/Tickets en vez de /solicitudes).
export function destino(pantalla, params) {
  return PESTANAS.includes(pantalla)
    ? { screen: 'Tabs', params: { screen: pantalla, params } }
    : { screen: pantalla, params };
}

// Igual que el de React Navigation, con dos ajustes para las solicitudes
// abiertas directo desde un enlace:
//  · debajo queda la lista de solicitudes y no el inicio, que es a donde uno
//    espera volver;
//  · la dirección se reescribe con el código en mayúscula, aunque se haya
//    escrito en minúscula (React Navigation conserva lo escrito si no se le
//    quita la ruta original).
export function estadoDesdeRuta(ruta, opciones) {
  const estado = getStateFromPath(ruta, opciones);
  const rutas = estado?.routes ?? [];

  if (
    rutas.length === 2 &&
    rutas[0].name === 'Tabs' &&
    !rutas[0].state &&
    ENCIMA_DE_SOLICITUDES.includes(rutas[1].name)
  ) {
    const { path: _escrita, ...encima } = rutas[1];
    return {
      ...estado,
      routes: [{ ...rutas[0], state: { routes: [{ name: 'Tickets' }] } }, encima],
    };
  }
  return estado;
}

export const linking = {
  prefixes: [PREFIJO_MOVIL],
  config: configuracionRutas,
  getStateFromPath: estadoDesdeRuta,
};

// ¿Este rol puede ver la pantalla?
export function puedeEntrar(pantalla, rol) {
  const roles = PANTALLAS[pantalla]?.roles;
  return !roles || roles.includes(rol);
}

// Texto de la pestaña del navegador para la pantalla enfocada.
export function tituloDocumento(ruta) {
  const titulo =
    ruta?.name === 'TicketDetalle' && ruta.params?.codigo
      ? `Solicitud ${ruta.params.codigo}`
      : PANTALLAS[ruta?.name]?.titulo;

  return titulo ? `${titulo} · ${NOMBRE_APP}` : NOMBRE_APP;
}

// "Volver" que funciona aunque la pantalla se haya abierto desde un enlace o
// recargando la página, cuando no hay nada detrás en el historial.
export function volver(navigation, destino = 'Tabs', params) {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.navigate(destino, params);
  }
}

// Clic sobre un enlace de la app. En la web, Ctrl/Cmd/Shift + clic debe
// abrir la dirección en otra pestaña del navegador: en ese caso no se toca
// el evento y el navegador hace lo suyo. En el clic normal se navega dentro
// de la app sin recargar la página.
export function manejarClicEnlace(evento, navegar) {
  const conModificador = !!(evento?.metaKey || evento?.ctrlKey || evento?.shiftKey || evento?.altKey);
  const botonPrincipal = evento?.button == null || evento.button === 0;
  if (conModificador || !botonPrincipal) return false;

  evento?.preventDefault?.();
  navegar();
  return true;
}
