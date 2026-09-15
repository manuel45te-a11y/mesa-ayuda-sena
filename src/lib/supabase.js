import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Si faltan las credenciales dejamos que la app arranque igual (para poder ver la
// interfaz) pero avisamos en pantalla en vez de reventar en el arranque.
export const configurado = Boolean(url && anonKey);

if (!configurado) {
  console.warn(
    'Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia .env.example como .env, pega tus credenciales de Supabase y reinicia el servidor.'
  );
}

export const supabase = createClient(
  url || 'https://sin-configurar.supabase.co',
  anonKey || 'sin-configurar',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: configurado,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
