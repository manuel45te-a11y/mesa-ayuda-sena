import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  diasRestantes,
  DIAS_SESION,
  limpiarInicio,
  marcarInicioSiFalta,
  sesionVencida,
} from '../sesion';

const DIA = 24 * 60 * 60 * 1000;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('marca de inicio', () => {
  it('no hay sesion vencida si nunca se marco el inicio', async () => {
    await expect(sesionVencida()).resolves.toBe(false);
    await expect(diasRestantes()).resolves.toBeNull();
  });

  it('guarda la marca la primera vez', async () => {
    await marcarInicioSiFalta();
    await expect(diasRestantes()).resolves.toBe(DIAS_SESION);
  });

  it('no reinicia el plazo al volver a abrir la aplicacion', async () => {
    const inicio = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(inicio);
    await marcarInicioSiFalta();

    // Diez dias despues se vuelve a abrir la aplicacion
    jest.spyOn(Date, 'now').mockReturnValue(inicio + 10 * DIA);
    await marcarInicioSiFalta();

    await expect(diasRestantes()).resolves.toBe(DIAS_SESION - 10);
  });
});

describe('caducidad a los 30 dias', () => {
  it('sigue vigente antes del plazo', async () => {
    const inicio = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(inicio);
    await marcarInicioSiFalta();

    jest.spyOn(Date, 'now').mockReturnValue(inicio + 29 * DIA);
    await expect(sesionVencida()).resolves.toBe(false);
  });

  it('vence al superar el plazo', async () => {
    const inicio = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(inicio);
    await marcarInicioSiFalta();

    jest.spyOn(Date, 'now').mockReturnValue(inicio + DIAS_SESION * DIA + 1000);
    await expect(sesionVencida()).resolves.toBe(true);
  });

  it('el ultimo dia todavia no ha vencido', async () => {
    const inicio = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(inicio);
    await marcarInicioSiFalta();

    jest.spyOn(Date, 'now').mockReturnValue(inicio + DIAS_SESION * DIA - 1000);
    await expect(sesionVencida()).resolves.toBe(false);
    await expect(diasRestantes()).resolves.toBe(1);
  });

  it('los dias restantes nunca son negativos', async () => {
    const inicio = Date.now();
    jest.spyOn(Date, 'now').mockReturnValue(inicio);
    await marcarInicioSiFalta();

    jest.spyOn(Date, 'now').mockReturnValue(inicio + 100 * DIA);
    await expect(diasRestantes()).resolves.toBe(0);
  });
});

describe('cierre de sesion', () => {
  it('al limpiar se olvida la marca y el plazo empieza de cero', async () => {
    await marcarInicioSiFalta();
    await limpiarInicio();

    await expect(diasRestantes()).resolves.toBeNull();
    await expect(sesionVencida()).resolves.toBe(false);
  });
});
