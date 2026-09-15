import { ESTADOS, PRIORIDADES, ROLES, TRANSICIONES } from '../theme';

describe('estados del ticket', () => {
  it('define exactamente los cuatro estados del flujo simplificado', () => {
    expect(Object.keys(ESTADOS).sort()).toEqual(
      ['cancelado', 'en_proceso', 'pendiente', 'resuelto'].sort()
    );
  });

  it('cada estado tiene etiqueta y colores para pintarlo', () => {
    Object.values(ESTADOS).forEach((e) => {
      expect(e.etiqueta).toBeTruthy();
      expect(e.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(e.fondo).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});

describe('transiciones', () => {
  it('todo estado del flujo tiene sus transiciones declaradas', () => {
    expect(Object.keys(TRANSICIONES).sort()).toEqual(Object.keys(ESTADOS).sort());
  });

  it('ninguna transicion apunta a un estado inexistente', () => {
    Object.values(TRANSICIONES).forEach((destinos) => {
      destinos.forEach((destino) => {
        expect(Object.keys(ESTADOS)).toContain(destino);
      });
    });
  });

  it('resuelto y cancelado son estados finales', () => {
    expect(TRANSICIONES.resuelto).toEqual([]);
    expect(TRANSICIONES.cancelado).toEqual([]);
  });

  it('el camino feliz es pendiente, en proceso y resuelto', () => {
    expect(TRANSICIONES.pendiente).toContain('en_proceso');
    expect(TRANSICIONES.en_proceso).toContain('resuelto');
  });

  it('se puede cancelar mientras el ticket siga abierto', () => {
    expect(TRANSICIONES.pendiente).toContain('cancelado');
    expect(TRANSICIONES.en_proceso).toContain('cancelado');
  });

  it('no se puede saltar de pendiente a resuelto sin atender', () => {
    expect(TRANSICIONES.pendiente).not.toContain('resuelto');
  });
});

describe('prioridades y roles', () => {
  it('hay tres prioridades', () => {
    expect(Object.keys(PRIORIDADES)).toEqual(['baja', 'media', 'alta']);
  });

  it('cada prioridad trae el color de su franja', () => {
    Object.values(PRIORIDADES).forEach((p) => {
      expect(p.barra).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('hay tres roles con nombre legible', () => {
    expect(Object.keys(ROLES).sort()).toEqual(['admin', 'aprendiz', 'tecnico']);
    Object.values(ROLES).forEach((nombre) => expect(nombre.length).toBeGreaterThan(3));
  });
});
