import {
  activarDemo,
  desactivarDemo,
  esDemo,
  eventosDe,
  indicadores,
  insertar,
  listar,
  modificar,
  obtener,
  obtenerPorCodigo,
  porAmbiente,
} from '../demo';

beforeEach(() => {
  activarDemo(); // reinicia el juego de datos de ejemplo
});

afterEach(() => {
  desactivarDemo();
});

describe('activacion', () => {
  it('queda activo tras activarlo y deja de estarlo al salir', () => {
    expect(esDemo()).toBe(true);
    desactivarDemo();
    expect(esDemo()).toBe(false);
  });

  it('arranca con seis tickets de ejemplo', () => {
    expect(listar()).toHaveLength(6);
  });

  it('ordena la lista del mas reciente al mas antiguo', () => {
    const fechas = listar().map((t) => new Date(t.creado_at).getTime());
    const ordenadas = [...fechas].sort((a, b) => b - a);
    expect(fechas).toEqual(ordenadas);
  });

  it('incluye al menos un ticket vencido para poder verlo en la interfaz', () => {
    const vencidos = listar().filter(
      (t) => ['pendiente', 'en_proceso'].includes(t.estado) && new Date(t.vence_at) < new Date()
    );
    expect(vencidos.length).toBeGreaterThan(0);
  });
});

describe('crear un ticket', () => {
  it('nace pendiente, sin tecnico y con codigo consecutivo', () => {
    const t = insertar({
      titulo: 'El tablero no borra',
      descripcion: 'El marcador no sale del tablero acrilico.',
      categoria_id: 'c6',
      ambiente_id: 'a1',
      prioridad: 'baja',
    });

    expect(t.estado).toBe('pendiente');
    expect(t.tecnico_id).toBeNull();
    expect(t.codigo).toMatch(/^MA-\d{4}-\d{4}$/);
    expect(listar()).toHaveLength(7);
  });

  it('calcula el vencimiento con las horas de la categoria', () => {
    // c1 = Red e internet, 4 horas
    const t = insertar({
      titulo: 'Cae la conexion',
      descripcion: 'Se cae el wifi cada diez minutos.',
      categoria_id: 'c1',
      ambiente_id: 'a4',
      prioridad: 'media',
    });

    const horas = (new Date(t.vence_at) - new Date(t.creado_at)) / 3600000;
    expect(horas).toBeCloseTo(4, 5);
  });

  it('no cambia el vencimiento segun la prioridad', () => {
    const base = {
      titulo: 'Prueba de prioridad',
      descripcion: 'Comprobando que el reloj no depende de la prioridad.',
      categoria_id: 'c2',
      ambiente_id: 'a1',
    };
    const baja = insertar({ ...base, prioridad: 'baja' });
    const alta = insertar({ ...base, prioridad: 'alta' });

    const plazo = (t) => new Date(t.vence_at) - new Date(t.creado_at);
    expect(plazo(baja)).toBe(plazo(alta));
  });

  it('deja registrado el evento de creacion', () => {
    const t = insertar({
      titulo: 'Falla de prueba',
      descripcion: 'Descripcion suficientemente larga.',
      categoria_id: 'c1',
      ambiente_id: 'a1',
      prioridad: 'media',
    });

    const eventos = eventosDe(t.id);
    expect(eventos).toHaveLength(1);
    expect(eventos[0].tipo).toBe('creacion');
    expect(eventos[0].estado_nuevo).toBe('pendiente');
  });
});

describe('flujo de atencion', () => {
  function ticketPendiente() {
    return listar().find((t) => t.estado === 'pendiente');
  }

  it('al atender queda en proceso, con tecnico y fecha', () => {
    const t = ticketPendiente();
    modificar(t.id, { tecnico_id: 'demo-usuario', estado: 'en_proceso' });

    const despues = obtener(t.id);
    expect(despues.estado).toBe('en_proceso');
    expect(despues.tecnico_id).toBe('demo-usuario');
    expect(despues.atendido_at).not.toBeNull();
  });

  it('al resolver guarda la solucion y la fecha', () => {
    const t = ticketPendiente();
    modificar(t.id, { tecnico_id: 'demo-usuario', estado: 'en_proceso' });
    modificar(t.id, { estado: 'resuelto', solucion: 'Se cambio el cable de red.' });

    const despues = obtener(t.id);
    expect(despues.estado).toBe('resuelto');
    expect(despues.solucion).toBe('Se cambio el cable de red.');
    expect(despues.resuelto_at).not.toBeNull();
  });

  it('deja un evento por la asignacion y otro por el cierre, como la base de datos', () => {
    const t = ticketPendiente();
    modificar(t.id, { tecnico_id: 'demo-usuario', estado: 'en_proceso' });
    modificar(t.id, { estado: 'resuelto', solucion: 'Ya quedo funcionando.' });

    const tipos = eventosDe(t.id).map((e) => e.tipo);
    expect(tipos).toEqual(['creacion', 'asignacion', 'cambio_estado']);

    const ultimo = eventosDe(t.id).at(-1);
    expect(ultimo.estado_anterior).toBe('en_proceso');
    expect(ultimo.estado_nuevo).toBe('resuelto');
  });

  it('la bitacora queda en orden cronologico', () => {
    const t = ticketPendiente();
    modificar(t.id, { tecnico_id: 'demo-usuario', estado: 'en_proceso' });

    const fechas = eventosDe(t.id).map((e) => new Date(e.creado_at).getTime());
    expect(fechas).toEqual([...fechas].sort((a, b) => a - b));
  });

  it('devuelve null al pedir un ticket que no existe', () => {
    expect(obtener('no-existe')).toBeNull();
  });
});

describe('busqueda por codigo (direcciones web)', () => {
  it('encuentra el ticket aunque el codigo venga en minuscula o con espacios', () => {
    const t = listar()[0];
    expect(obtenerPorCodigo(` ${t.codigo.toLowerCase()} `).id).toBe(t.id);
  });

  it('devuelve null si el codigo no existe o no llega', () => {
    expect(obtenerPorCodigo('MA-1999-0001')).toBeNull();
    expect(obtenerPorCodigo(undefined)).toBeNull();
  });
});

describe('indicadores', () => {
  it('el total coincide con la cantidad de tickets', () => {
    const i = indicadores();
    expect(i.total).toBe(listar().length);
  });

  it('los estados suman el total', () => {
    const i = indicadores();
    expect(i.pendientes + i.en_proceso + i.resueltos + i.cancelados).toBe(i.total);
  });

  it('un ticket cancelado deja de contar como pendiente', () => {
    const antes = indicadores();
    const t = listar().find((x) => x.estado === 'pendiente');
    modificar(t.id, { estado: 'cancelado' });
    const despues = indicadores();

    expect(despues.pendientes).toBe(antes.pendientes - 1);
    expect(despues.cancelados).toBe(antes.cancelados + 1);
    expect(despues.total).toBe(antes.total);
  });

  it('promedia solo los tickets que ya fueron atendidos', () => {
    const i = indicadores();
    expect(i.prom_horas_respuesta).toBeGreaterThan(0);
  });
});

describe('reporte por ambiente', () => {
  it('solo lista ambientes con tickets, del que mas tiene al que menos', () => {
    const filas = porAmbiente();
    expect(filas.every((f) => f.total > 0)).toBe(true);

    const totales = filas.map((f) => f.total);
    expect(totales).toEqual([...totales].sort((a, b) => b - a));
  });

  it('los totales por ambiente suman la cantidad de tickets', () => {
    const suma = porAmbiente().reduce((acc, f) => acc + f.total, 0);
    expect(suma).toBe(listar().length);
  });
});
