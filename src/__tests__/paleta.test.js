import { ACENTOS, crearPaleta, PALETAS } from '../theme';

// Contraste entre dos colores según WCAG: 4.5 es el mínimo para que un texto
// se lea con comodidad y 3 para bordes y elementos que no son texto.
const aRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function luminancia(hex) {
  const [r, g, b] = aRgb(hex).map((v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [alta, baja] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (alta + 0.05) / (baja + 0.05);
}

const MODOS = ['oscuro', 'claro'];
const SUPERFICIES = ['fondo', 'panel', 'panelAlto'];
const SEMANTICOS = ['azul', 'cian', 'ambar', 'verde', 'rojo', 'gris'];

describe('paletas', () => {
  it('la clara y la oscura definen los mismos colores', () => {
    expect(Object.keys(PALETAS.claro).sort()).toEqual(Object.keys(PALETAS.oscuro).sort());
  });

  it('todo color es un hexadecimal de seis dígitos (se le puede añadir opacidad)', () => {
    MODOS.forEach((modo) => {
      Object.values(crearPaleta(modo, 'indigo')).forEach((valor) => {
        expect(valor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  it('un modo o un color desconocidos no rompen la app', () => {
    expect(crearPaleta('neon', 'dorado').fondo).toBe(PALETAS.oscuro.fondo);
  });
});

describe.each(MODOS)('tema %s', (modo) => {
  const p = crearPaleta(modo, 'indigo');

  it('el texto principal se lee sobre cualquier superficie', () => {
    SUPERFICIES.forEach((superficie) => {
      expect(contraste(p.texto, p[superficie])).toBeGreaterThanOrEqual(7);
    });
  });

  it('los textos secundarios llegan al mínimo accesible', () => {
    SUPERFICIES.forEach((superficie) => {
      expect(contraste(p.textoSuave, p[superficie])).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p.textoTenue, p[superficie])).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('ninguna superficie es blanco ni negro puros, que cansan la vista', () => {
    expect(contraste(p.texto, p.fondo)).toBeLessThan(17);
    expect(p.texto).not.toBe('#FFFFFF');
    expect(p.texto).not.toBe('#000000');
  });

  it('cada color con significado se lee sobre su etiqueta y sobre el panel', () => {
    SEMANTICOS.forEach((nombre) => {
      expect(contraste(p[nombre], p[`${nombre}Bajo`])).toBeGreaterThanOrEqual(4.5);
      expect(contraste(p[nombre], p.panel)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('las líneas se notan sin convertirse en bordes duros', () => {
    expect(contraste(p.linea, p.panel)).toBeGreaterThan(1.05);
    expect(contraste(p.linea, p.panel)).toBeLessThan(3);
  });
});

describe.each(Object.keys(ACENTOS))('color de la organización: %s', (acento) => {
  it.each(MODOS)('en el tema %s se lee el botón y el texto de acento', (modo) => {
    const p = crearPaleta(modo, acento);

    expect(contraste(p.marcaTexto, p.marca)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.marcaAlta, p.panel)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.marcaAlta, p.marcaBaja)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(p.marca, p.panel)).toBeGreaterThanOrEqual(3);
  });
});
