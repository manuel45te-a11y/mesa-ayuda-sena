import { activarDemo, desactivarDemo } from '../demo';
import {
  actualizarTicket,
  catalogos,
  crearTicket,
  listarTickets,
  obtenerTicket,
  resumenInicio,
  tablero,
} from '../datos';

// En modo demostración la capa de datos no debe llamar a la red ni una vez.
const red = jest.spyOn(global, 'fetch');

beforeEach(() => {
  red.mockClear();
  activarDemo();
});

afterEach(() => {
  desactivarDemo();
});

afterAll(() => {
  red.mockRestore();
});

describe('capa de datos en modo demostración', () => {
  it('devuelve los catalogos sin salir a la red', async () => {
    const { categorias, ambientes, error } = await catalogos();

    expect(error).toBeNull();
    expect(categorias.length).toBeGreaterThan(0);
    expect(ambientes.length).toBeGreaterThan(0);
    expect(red).not.toHaveBeenCalled();
  });

  it('lista los tickets de ejemplo', async () => {
    const { tickets, error } = await listarTickets();

    expect(error).toBeNull();
    expect(tickets).toHaveLength(6);
    expect(red).not.toHaveBeenCalled();
  });

  it('trae un ticket con su bitacora', async () => {
    const { tickets } = await listarTickets();
    const { ticket, eventos, error } = await obtenerTicket(tickets[0].id);

    expect(error).toBeNull();
    expect(ticket.id).toBe(tickets[0].id);
    expect(eventos.length).toBeGreaterThan(0);
  });

  it('crea un ticket y lo devuelve con su codigo', async () => {
    const { ticket, error } = await crearTicket(
      {
        titulo: 'La puerta no cierra',
        descripcion: 'La chapa quedo suelta y no asegura el ambiente.',
        categoria_id: 'c6',
        ambiente_id: 'a3',
        prioridad: 'media',
      },
      'demo-usuario'
    );

    expect(error).toBeNull();
    expect(ticket.codigo).toMatch(/^MA-\d{4}-\d{4}$/);

    const { tickets } = await listarTickets();
    expect(tickets).toHaveLength(7);
  });

  it('actualiza el estado de un ticket', async () => {
    const { tickets } = await listarTickets();
    const pendiente = tickets.find((t) => t.estado === 'pendiente');

    const { error } = await actualizarTicket(pendiente.id, {
      tecnico_id: 'demo-usuario',
      estado: 'en_proceso',
    });

    expect(error).toBeNull();
    const { ticket } = await obtenerTicket(pendiente.id);
    expect(ticket.estado).toBe('en_proceso');
  });

  it('marca un ticket como resuelto y guarda la solucion', async () => {
    const { tickets } = await listarTickets();
    const enProceso = tickets.find((t) => t.estado === 'en_proceso');

    const { error } = await actualizarTicket(enProceso.id, {
      estado: 'resuelto',
      solucion: 'Se reemplazó la pieza dañada y se probó el funcionamiento.',
      tecnico_id: 'demo-usuario',
    });

    expect(error).toBeNull();
    const { ticket, eventos } = await obtenerTicket(enProceso.id);
    expect(ticket.estado).toBe('resuelto');
    expect(ticket.solucion).toBe('Se reemplazó la pieza dañada y se probó el funcionamiento.');
    expect(ticket.resuelto_at).not.toBeNull();
    expect(eventos.some((e) => e.estado_nuevo === 'resuelto')).toBe(true);
  });

  it('arma el resumen de inicio para el equipo de soporte', async () => {
    const resumen = await resumenInicio('demo-usuario', true);

    expect(resumen.pendientes).toBeGreaterThan(0);
    expect(resumen.recientes.length).toBeLessThanOrEqual(4);
    expect(resumen.sinAsignar).toBeGreaterThanOrEqual(0);
  });

  it('para un aprendiz solo cuenta los tickets que el reporto', async () => {
    const resumen = await resumenInicio('otro-usuario', false);

    expect(resumen.pendientes).toBe(0);
    expect(resumen.recientes).toHaveLength(0);
  });

  it('entrega los indicadores del tablero', async () => {
    const { indicadores, ambientes, error } = await tablero();

    expect(error).toBeNull();
    expect(indicadores.total).toBe(6);
    expect(ambientes.length).toBeGreaterThan(0);
    expect(red).not.toHaveBeenCalled();
  });
});
