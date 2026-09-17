import { getPathFromState } from '@react-navigation/native';
import {
  configuracionRutas,
  destino,
  estadoDesdeRuta,
  manejarClicEnlace,
  normalizarCodigo,
  PANTALLAS,
  puedeEntrar,
  tituloDocumento,
  volver,
} from '../rutas';

// Pantalla enfocada (la más profunda) de un estado de navegación.
function enfocada(estado) {
  let ruta = estado.routes[estado.index ?? estado.routes.length - 1];
  while (ruta.state) {
    ruta = ruta.state.routes[ruta.state.index ?? ruta.state.routes.length - 1];
  }
  return ruta;
}

const abrir = (direccion) => estadoDesdeRuta(direccion, configuracionRutas);
const direccionDe = (estado) => getPathFromState(estado, configuracionRutas);

describe('cada dirección abre su pantalla', () => {
  it.each([
    ['/', 'Inicio'],
    ['/solicitudes', 'Tickets'],
    ['/solicitudes/nueva', 'NuevoTicket'],
    ['/solicitudes/MA-2026-0004', 'TicketDetalle'],
    ['/tablero', 'Tablero'],
    ['/usuarios', 'Usuarios'],
    ['/perfil', 'Perfil'],
    ['/ingresar', 'Login'],
    ['/registro', 'Registro'],
    ['/recuperar-clave', 'RecuperarClave'],
  ])('%s → %s', (direccion, pantalla) => {
    expect(enfocada(abrir(direccion)).name).toBe(pantalla);
  });

  it('una dirección desconocida abre la página no encontrada', () => {
    expect(enfocada(abrir('/esto/no/existe')).name).toBe('NoEncontrada');
  });

  it('"nueva" no se confunde con el código de una solicitud', () => {
    const ruta = enfocada(abrir('/solicitudes/nueva'));
    expect(ruta.name).toBe('NuevoTicket');
    expect(ruta.params?.codigo).toBeUndefined();
  });
});

describe('solicitud abierta por enlace', () => {
  it('toma el código de la dirección y lo pasa a mayúscula', () => {
    expect(enfocada(abrir('/solicitudes/ma-2026-0004')).params).toEqual({ codigo: 'MA-2026-0004' });
  });

  it('deja la lista de solicitudes debajo, para que "Volver" lleve ahí', () => {
    const estado = abrir('/solicitudes/MA-2026-0004');

    expect(estado.routes.map((r) => r.name)).toEqual(['Tabs', 'TicketDetalle']);
    expect(estado.routes[0].state.routes[0].name).toBe('Tickets');
  });

  it('lo mismo al abrir el formulario de nueva solicitud', () => {
    const estado = abrir('/solicitudes/nueva');
    expect(estado.routes[0].state.routes[0].name).toBe('Tickets');
  });

  it('las pestañas quedan con su propia dirección, sin ajustes', () => {
    const estado = abrir('/perfil');
    expect(estado.routes).toHaveLength(1);
    expect(enfocada(estado).name).toBe('Perfil');
  });
});

describe('filtros de la lista en la dirección', () => {
  it('lee el filtro y la búsqueda de la dirección', () => {
    expect(enfocada(abrir('/solicitudes?filtro=vencidos&buscar=videobeam')).params).toEqual({
      filtro: 'vencidos',
      buscar: 'videobeam',
    });
  });

  it('escribe el filtro como parámetro de la dirección', () => {
    const estado = {
      routes: [{ name: 'Tabs', state: { routes: [{ name: 'Tickets', params: { filtro: 'vencidos' } }] } }],
    };
    expect(direccionDe(estado)).toBe('/solicitudes?filtro=vencidos');
  });
});

describe('de la pantalla a la dirección', () => {
  it('arma la dirección de una solicitud con su código', () => {
    const estado = { routes: [{ name: 'TicketDetalle', params: { codigo: 'ma-2026-0012' } }] };
    expect(direccionDe(estado)).toBe('/solicitudes/MA-2026-0012');
  });

  it('una dirección escrita en minúscula se reescribe con el código en mayúscula', () => {
    expect(direccionDe(abrir('/solicitudes/ma-2026-0004'))).toBe('/solicitudes/MA-2026-0004');
  });

  it('ida y vuelta: abrir la dirección y volver a escribirla da lo mismo', () => {
    ['/solicitudes', '/solicitudes/MA-2026-0004', '/tablero', '/perfil', '/ingresar'].forEach((d) => {
      expect(direccionDe(abrir(d))).toBe(d);
    });
  });
});

describe('permisos por rol', () => {
  it('el tablero es solo para el coordinador', () => {
    expect(puedeEntrar('Tablero', 'admin')).toBe(true);
    expect(puedeEntrar('Tablero', 'tecnico')).toBe(false);
    expect(puedeEntrar('Tablero', 'aprendiz')).toBe(false);
    expect(puedeEntrar('Tablero', undefined)).toBe(false);
  });

  it('la gestión de usuarios es solo para el administrador', () => {
    expect(puedeEntrar('Usuarios', 'admin')).toBe(true);
    expect(puedeEntrar('Usuarios', 'tecnico')).toBe(false);
    expect(puedeEntrar('Usuarios', 'aprendiz')).toBe(false);
  });

  it('las pantallas sin restricción las ve cualquier rol', () => {
    ['Inicio', 'Tickets', 'Perfil', 'NuevoTicket', 'TicketDetalle'].forEach((pantalla) => {
      expect(puedeEntrar(pantalla, 'aprendiz')).toBe(true);
    });
  });

  it('toda pantalla restringida declara al menos un rol', () => {
    Object.values(PANTALLAS)
      .filter((p) => p.roles)
      .forEach((p) => expect(p.roles.length).toBeGreaterThan(0));
  });
});

describe('título de la pestaña del navegador', () => {
  it('usa el título de la pantalla y el nombre de la app', () => {
    expect(tituloDocumento({ name: 'Tickets' })).toBe('Solicitudes · Mesa de Ayuda');
  });

  it('en una solicitud muestra su código', () => {
    expect(tituloDocumento({ name: 'TicketDetalle', params: { codigo: 'MA-2026-0004' } })).toBe(
      'Solicitud MA-2026-0004 · Mesa de Ayuda'
    );
  });

  it('la página principal y las rutas sin título llevan solo el nombre de la app', () => {
    expect(tituloDocumento({ name: 'Inicio' })).toBe('Mesa de Ayuda');
    expect(tituloDocumento({ name: 'Tabs' })).toBe('Mesa de Ayuda');
    expect(tituloDocumento(undefined)).toBe('Mesa de Ayuda');
  });
});

describe('volver', () => {
  it('regresa en el historial si hay a dónde', () => {
    const navigation = { canGoBack: () => true, goBack: jest.fn(), navigate: jest.fn() };
    volver(navigation, 'Login');

    expect(navigation.goBack).toHaveBeenCalled();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('si se entró por enlace y no hay historial, va al destino', () => {
    const navigation = { canGoBack: () => false, goBack: jest.fn(), navigate: jest.fn() };
    volver(navigation, 'Login');

    expect(navigation.goBack).not.toHaveBeenCalled();
    expect(navigation.navigate).toHaveBeenCalledWith('Login', undefined);
  });
});

describe('clic en un enlace', () => {
  it('con clic normal navega dentro de la app y evita recargar la página', () => {
    const evento = { button: 0, preventDefault: jest.fn() };
    const navegar = jest.fn();

    expect(manejarClicEnlace(evento, navegar)).toBe(true);
    expect(evento.preventDefault).toHaveBeenCalled();
    expect(navegar).toHaveBeenCalled();
  });

  it.each(['ctrlKey', 'metaKey', 'shiftKey'])('con %s deja que el navegador abra otra pestaña', (tecla) => {
    const evento = { button: 0, [tecla]: true, preventDefault: jest.fn() };
    const navegar = jest.fn();

    expect(manejarClicEnlace(evento, navegar)).toBe(false);
    expect(evento.preventDefault).not.toHaveBeenCalled();
    expect(navegar).not.toHaveBeenCalled();
  });

  it('en el celular (sin evento de mouse) navega', () => {
    const navegar = jest.fn();
    manejarClicEnlace(undefined, navegar);
    expect(navegar).toHaveBeenCalled();
  });
});

describe('destino de un enlace', () => {
  const direccionDeDestino = ({ screen, params }) => direccionDe({ routes: [{ name: screen, params }] });

  it('una pestaña se enlaza a través de Tabs, con su dirección bonita', () => {
    expect(destino('Tickets', { filtro: 'vencidos' })).toEqual({
      screen: 'Tabs',
      params: { screen: 'Tickets', params: { filtro: 'vencidos' } },
    });
    expect(direccionDeDestino(destino('Tickets', { filtro: 'vencidos' }))).toBe('/solicitudes?filtro=vencidos');
    expect(direccionDeDestino(destino('Perfil'))).toBe('/perfil');
  });

  it('una pantalla fuera de las pestañas se enlaza directo', () => {
    expect(destino('TicketDetalle', { codigo: 'MA-2026-0004' })).toEqual({
      screen: 'TicketDetalle',
      params: { codigo: 'MA-2026-0004' },
    });
    expect(direccionDeDestino(destino('TicketDetalle', { codigo: 'MA-2026-0004' }))).toBe(
      '/solicitudes/MA-2026-0004'
    );
  });
});

describe('parámetros vacíos', () => {
  it('un filtro sin valor no ensucia la dirección', () => {
    const estado = {
      routes: [{ name: 'Tabs', state: { routes: [{ name: 'Tickets', params: { filtro: undefined } }] } }],
    };
    expect(direccionDe(estado)).toBe('/solicitudes');
  });
});

it('normaliza códigos escritos a mano', () => {
  expect(normalizarCodigo('  ma-2026-0004 ')).toBe('MA-2026-0004');
  expect(normalizarCodigo(undefined)).toBe('');
});
