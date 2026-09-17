jest.mock('expo-image-picker', () => ({}));
jest.mock('expo-image-manipulator', () => ({ SaveFormat: { JPEG: 'jpeg' } }));

import { LADO_MAXIMO, nombreDeFoto, reduccion } from '../fotos';
import { FOTOS_EJEMPLO } from '../fotosEjemplo';

describe('reducción de la foto', () => {
  it('una foto de celular horizontal queda con 1280 px de ancho y la misma proporción', () => {
    expect(reduccion(4000, 3000)).toEqual({ width: LADO_MAXIMO, height: 960 });
  });

  it('una foto vertical queda con 1280 px de alto', () => {
    expect(reduccion(3000, 4000)).toEqual({ width: 960, height: LADO_MAXIMO });
  });

  it('una foto pequeña no se toca', () => {
    expect(reduccion(800, 600)).toBeNull();
    expect(reduccion(LADO_MAXIMO, 720)).toBeNull();
  });

  it('sin medidas no intenta reducir', () => {
    expect(reduccion(0, 0)).toBeNull();
    expect(reduccion(undefined, 500)).toBeNull();
  });
});

describe('nombre de la foto', () => {
  it('conserva el nombre y lo deja en .jpg, que es como se guarda', () => {
    expect(nombreDeFoto('IMG_2031.HEIC')).toBe('IMG_2031.jpg');
    expect(nombreDeFoto('cable roto.png')).toBe('cable roto.jpg');
  });

  it('sin nombre arma uno con la fecha', () => {
    expect(nombreDeFoto(null, 1700000000000)).toBe('evidencia-1700000000000.jpg');
  });
});

describe('fotos de ejemplo del modo demostración', () => {
  it('son imágenes embebidas, para que la demostración funcione sin internet', () => {
    expect(FOTOS_EJEMPLO.length).toBeGreaterThan(0);
    FOTOS_EJEMPLO.forEach((foto) => {
      expect(foto.imagen).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
      expect(foto.nombre).toBeTruthy();
      expect(foto.descripcion).toBeTruthy();
    });
  });
});
