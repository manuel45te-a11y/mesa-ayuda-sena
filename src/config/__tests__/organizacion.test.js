import { CONFIG, datosOrganizacion, LEMA, TIPOS } from '../organizacion';

describe('tipos de organización', () => {
  it('cada tipo dice cómo se llama, cómo llama a sus lugares y qué datos pide', () => {
    Object.values(TIPOS).forEach((tipo) => {
      expect(tipo.etiqueta.length).toBeGreaterThan(3);
      expect(tipo.corto.length).toBeGreaterThan(2);
      expect(tipo.ejemplo.length).toBeGreaterThan(3);
      expect(tipo.lugar.singular).toBeTruthy();
      expect(tipo.lugar.plural).toBeTruthy();
    });
  });

  it('los datos del perfil siguen guardándose en las columnas de la base', () => {
    Object.values(TIPOS).forEach((tipo) => {
      expect(tipo.campos.map((campo) => campo.campo).sort()).toEqual(['ficha', 'programa']);
      tipo.campos.forEach((campo) => {
        expect(campo.etiqueta).toBeTruthy();
        expect(campo.ejemplo).toBeTruthy();
      });
    });
  });

  it('cada tipo trae ocho lugares de ejemplo, con códigos cortos y sin repetir', () => {
    Object.values(TIPOS).forEach((tipo) => {
      expect(tipo.lugares).toHaveLength(8);
      const codigos = tipo.lugares.map((lugar) => lugar.codigo);
      expect(new Set(codigos).size).toBe(codigos.length);
      codigos.forEach((codigo) => expect(codigo.length).toBeLessThanOrEqual(6));
      tipo.lugares.forEach((lugar) => expect(lugar.nombre).toBeTruthy());
    });
  });
});

describe('datos que usan las pantallas', () => {
  it('lo configurado es un tipo que existe', () => {
    expect(TIPOS[CONFIG.tipo]).toBeDefined();
  });

  it('cada tipo nombra sus lugares a su manera', () => {
    expect(datosOrganizacion({ tipo: 'empresa' }).lugar.singular).toBe('Ubicación');
    expect(datosOrganizacion({ tipo: 'educacion' }).lugar.singular).toBe('Espacio');
    expect(datosOrganizacion({ tipo: 'salud' }).lugar.plural).toBe('Áreas');
  });

  it('un tipo que no existe cae en el configurado, sin romper nada', () => {
    expect(datosOrganizacion({ tipo: 'nave-espacial' }).tipo).toBe(CONFIG.tipo);
    expect(datosOrganizacion().tipo).toBe(CONFIG.tipo);
  });

  it('en la demostración se muestra el nombre de ejemplo del tipo elegido', () => {
    const hotel = datosOrganizacion({ tipo: 'hotel', demo: true });
    expect(hotel.nombre).toBe(TIPOS.hotel.ejemplo);
    expect(hotel.pie).toBe(TIPOS.hotel.ejemplo);
  });

  it('sin nombre de organización, la segunda línea es el lema', () => {
    const sinNombre = { ...datosOrganizacion(), nombre: '' };
    expect(sinNombre.nombre || LEMA).toBe(LEMA);
    expect(datosOrganizacion().pie).toBeTruthy();
  });
});
