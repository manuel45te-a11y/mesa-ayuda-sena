import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// ============================================================================
//  FOTOS DE EVIDENCIA
//  La evidencia se guarda como data URL en ticket_adjuntos.ruta, así que antes
//  se reduce: una foto de celular (4000 px, varios MB) queda en unos cientos de KB.
// ============================================================================

export const LADO_MAXIMO = 1280;
export const CALIDAD_JPEG = 0.7;
// Tope del texto que se envía a la base de datos.
export const LARGO_MAXIMO = 2 * 1024 * 1024;

// Medidas finales conservando la proporción, o null si ya es pequeña.
export function reduccion(ancho, alto, maximo = LADO_MAXIMO) {
  if (!ancho || !alto) return null;
  const mayor = Math.max(ancho, alto);
  if (mayor <= maximo) return null;
  const factor = maximo / mayor;
  return { width: Math.round(ancho * factor), height: Math.round(alto * factor) };
}

export function nombreDeFoto(nombreOriginal, ahora = Date.now()) {
  const base = String(nombreOriginal || `evidencia-${ahora}`).replace(/\.[^.]+$/, '');
  return `${base}.jpg`;
}

// En la web se reduce con un canvas: expo-image-manipulator guarda PNG sin
// comprimir en el navegador y la foto quedaría pesada.
function reducirEnWeb(uri, ancho, alto) {
  return new Promise((resolve, reject) => {
    const imagen = new window.Image();
    imagen.onload = () => {
      const medidas = reduccion(imagen.naturalWidth || ancho, imagen.naturalHeight || alto) ?? {
        width: imagen.naturalWidth || ancho,
        height: imagen.naturalHeight || alto,
      };
      const canvas = document.createElement('canvas');
      canvas.width = medidas.width;
      canvas.height = medidas.height;
      canvas.getContext('2d').drawImage(imagen, 0, 0, medidas.width, medidas.height);
      resolve(canvas.toDataURL('image/jpeg', CALIDAD_JPEG));
    };
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen'));
    imagen.src = uri;
  });
}

async function reducirEnCelular(uri, ancho, alto) {
  const medidas = reduccion(ancho, alto);
  const resultado = await manipulateAsync(uri, medidas ? [{ resize: medidas }] : [], {
    compress: CALIDAD_JPEG,
    format: SaveFormat.JPEG,
    base64: true,
  });
  return `data:image/jpeg;base64,${resultado.base64}`;
}

// Abre la galería (en la web, el selector de archivos) o la cámara y devuelve
// { foto: { imagen, nombre }, error }. Si la persona cancela, foto es null.
export async function elegirFoto({ camara = false } = {}) {
  try {
    if (camara) {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();
      if (!permiso.granted) {
        return { foto: null, error: 'Da permiso de cámara para tomar la foto de la evidencia.' };
      }
    }

    const opciones = { mediaTypes: ['images'], quality: 1 };
    const resultado = camara
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);

    if (resultado.canceled || !resultado.assets?.length) return { foto: null, error: null };

    const original = resultado.assets[0];
    const imagen =
      Platform.OS === 'web'
        ? await reducirEnWeb(original.uri, original.width, original.height)
        : await reducirEnCelular(original.uri, original.width, original.height);

    if (imagen.length > LARGO_MAXIMO) {
      return { foto: null, error: 'La foto sigue siendo muy pesada. Prueba con otra.' };
    }

    return { foto: { imagen, nombre: nombreDeFoto(original.fileName) }, error: null };
  } catch {
    return { foto: null, error: 'No se pudo cargar la foto. Intenta de nuevo.' };
  }
}
