import { desde, fechaCorta, fechaHora, horas, iniciales, sla } from '../formato';

const HORA = 60 * 60 * 1000;
const haceHoras = (h) => new Date(Date.now() - h * HORA).toISOString();
const enHoras = (h) => new Date(Date.now() + h * HORA).toISOString();

describe('fechas', () => {
  it('muestra un guion cuando no hay fecha', () => {
    expect(fechaCorta(null)).toBe('—');
    expect(fechaHora(undefined)).toBe('—');
  });

  it('da formato legible a una fecha real', () => {
    const texto = fechaCorta('2026-03-15T10:00:00.000Z');
    expect(texto).toMatch(/2026/);
    expect(texto).not.toBe('—');
  });
});

describe('desde', () => {
  it('dice "ahora" para menos de un minuto', () => {
    expect(desde(new Date().toISOString())).toBe('ahora');
  });

  it('cuenta en minutos por debajo de una hora', () => {
    expect(desde(haceHoras(0.5))).toBe('hace 30 min');
  });

  it('cuenta en horas por debajo de un dia', () => {
    expect(desde(haceHoras(5))).toBe('hace 5 h');
  });

  it('cuenta en dias a partir de 24 horas', () => {
    expect(desde(haceHoras(50))).toBe('hace 2 d');
  });
});

describe('horas', () => {
  it('convierte fracciones de hora a minutos', () => {
    expect(horas(0.5)).toBe('30 min');
  });

  it('muestra una decimal a partir de una hora', () => {
    expect(horas(3.25)).toBe('3.3 h');
  });

  it('tolera valores vacios', () => {
    expect(horas(null)).toBe('—');
    expect(horas('abc')).toBe('—');
  });
});

describe('iniciales', () => {
  it('toma la primera letra de los dos primeros nombres', () => {
    expect(iniciales('Manuel Fernandez Rojas')).toBe('MF');
  });

  it('funciona con un solo nombre', () => {
    expect(iniciales('Invitado')).toBe('I');
  });

  it('devuelve interrogacion si no hay nombre', () => {
    expect(iniciales('')).toBe('?');
    expect(iniciales(null)).toBe('?');
  });
});

describe('sla', () => {
  it('marca como fuera de reloj los tickets terminados', () => {
    const r = sla(haceHoras(10), haceHoras(5), 'resuelto');
    expect(r.cerrado).toBe(true);
    expect(r.vencido).toBe(false);
    expect(r.progreso).toBe(1);
  });

  it('detecta un ticket vencido', () => {
    const r = sla(haceHoras(9), haceHoras(3), 'pendiente');
    expect(r.vencido).toBe(true);
    expect(r.texto).toMatch(/^Vencido hace/);
  });

  it('calcula el tiempo restante de un ticket en plazo', () => {
    const r = sla(haceHoras(1), enHoras(3), 'pendiente');
    expect(r.vencido).toBe(false);
    expect(r.texto).toMatch(/restantes$/);
  });

  it('mantiene el progreso entre 0 y 1', () => {
    const r = sla(haceHoras(2), enHoras(2), 'en_proceso');
    expect(r.progreso).toBeGreaterThan(0);
    expect(r.progreso).toBeLessThanOrEqual(1);
  });

  it('avisa cuando el ticket no tiene vencimiento', () => {
    const r = sla(haceHoras(1), null, 'pendiente');
    expect(r.texto).toBe('Sin SLA');
    expect(r.progreso).toBe(0);
  });
});
