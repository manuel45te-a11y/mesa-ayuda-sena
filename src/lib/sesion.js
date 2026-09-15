import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
//  CADUCIDAD DE LA SESIÓN
//  Supabase renueva el token indefinidamente mientras el usuario siga
//  entrando, así que la sesión nunca expiraría por su cuenta. Aquí se guarda
//  cuándo empezó y se cierra al superar el plazo.
// ============================================================================

export const DIAS_SESION = 30;

const CLAVE = 'mesa_ayuda.inicio_sesion';
const MS_PLAZO = DIAS_SESION * 24 * 60 * 60 * 1000;

// Marca el inicio solo si aún no había uno: así el plazo cuenta desde el
// primer ingreso y no se reinicia cada vez que se abre la aplicación.
export async function marcarInicioSiFalta() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    if (!guardado) {
      await AsyncStorage.setItem(CLAVE, String(Date.now()));
    }
  } catch (e) {
    console.warn('No se pudo guardar el inicio de sesión:', e?.message);
  }
}

export async function limpiarInicio() {
  try {
    await AsyncStorage.removeItem(CLAVE);
  } catch (e) {
    console.warn('No se pudo limpiar el inicio de sesión:', e?.message);
  }
}

// ¿Ya pasaron los días del plazo?
export async function sesionVencida() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    if (!guardado) return false;
    return Date.now() - Number(guardado) > MS_PLAZO;
  } catch {
    return false;
  }
}

// Días que le quedan a la sesión actual, para mostrarlos en el perfil.
export async function diasRestantes() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    if (!guardado) return null;
    const restante = MS_PLAZO - (Date.now() - Number(guardado));
    return Math.max(0, Math.ceil(restante / (24 * 60 * 60 * 1000)));
  } catch {
    return null;
  }
}
