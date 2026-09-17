import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import {
  activarDemo,
  cambiarRolDemo as cambiarRolDemoFn,
  desactivarDemo,
  esDemo,
  obtenerPerfilDemo,
  restaurarDemo,
} from '../lib/demo';
import { DIAS_SESION, limpiarInicio, marcarInicioSiFalta, sesionVencida } from '../lib/sesion';

const CLAVE_MODO_DEMO = '@mesa_ayuda_modo_demo';
const AuthContext = createContext(null);

// Cada cuánto se revisa el plazo mientras la aplicación está abierta.
const REVISION_MS = 60 * 60 * 1000; // 1 hora

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [demo, setDemo] = useState(false);
  const [demoTick, setDemoTick] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [caducada, setCaducada] = useState(false);
  const [recuperandoClave, setRecuperandoClave] = useState(false);

  // Trae el perfil (rol, nombre, ficha) del usuario autenticado.
  async function cargarPerfil(userId) {
    if (!userId) {
      setPerfil(null);
      return;
    }
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) console.warn('No se pudo cargar el perfil:', error.message);
    setPerfil(data ?? null);
  }

  // Cierra la sesión si ya pasó el plazo. Devuelve true si la cerró.
  async function cerrarSiVencio() {
    if (!(await sesionVencida())) return false;

    await supabase.auth.signOut();
    await limpiarInicio();
    setSesion(null);
    setPerfil(null);
    setCaducada(true);
    return true;
  }

  useEffect(() => {
    let activo = true;

    (async () => {
      // Revisar si la URL trae indicación de recuperación de contraseña
      if (typeof window !== 'undefined' && window.location) {
        const hash = window.location.hash || '';
        const search = window.location.search || '';
        if (hash.includes('type=recovery') || search.includes('type=recovery')) {
          setRecuperandoClave(true);
        }
      }

      // 1. Revisar si hay sesión de Supabase
      const { data } = await supabase.auth.getSession();
      if (!activo) return;

      if (data?.session) {
        if (await cerrarSiVencio()) {
          setCargando(false);
          return;
        }
        await marcarInicioSiFalta();
        setSesion(data.session);
        await cargarPerfil(data.session?.user?.id);
        setCargando(false);
        return;
      }

      // 2. Si no hay sesión de Supabase, revisar si estaba en modo demo
      try {
        let modoDemoGuardado = null;
        if (typeof window !== 'undefined' && window?.localStorage) {
          modoDemoGuardado = window.localStorage.getItem(CLAVE_MODO_DEMO);
        }
        if (!modoDemoGuardado) {
          modoDemoGuardado = await AsyncStorage.getItem(CLAVE_MODO_DEMO);
        }
        if (modoDemoGuardado === 'true') {
          await restaurarDemo();
          if (activo) setDemo(true);
        }
      } catch {}

      setCargando(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (evento, nuevaSesion) => {
      if (evento === 'PASSWORD_RECOVERY') {
        setRecuperandoClave(true);
      }
      if (nuevaSesion && evento === 'SIGNED_IN') {
        await marcarInicioSiFalta();
        setCaducada(false);
      }
      if (evento === 'SIGNED_OUT') {
        await limpiarInicio();
        setRecuperandoClave(false);
      }

      setSesion(nuevaSesion);
      await cargarPerfil(nuevaSesion?.user?.id);
      setCargando(false);
    });

    // Por si alguien deja la aplicación abierta más allá del plazo.
    const reloj = setInterval(() => {
      cerrarSiVencio();
    }, REVISION_MS);

    return () => {
      activo = false;
      clearInterval(reloj);
      sub.subscription.unsubscribe();
    };
  }, []);

  // El rol sale del perfil guardado en la base de datos. Nada de correos fijos
  // en el código: los administradores se nombran en roles-y-asignacion.sql y
  // los demás roles los asigna el administrador desde la pantalla Usuarios.
  const perfilActivo = demo ? obtenerPerfilDemo() : perfil;
  const rol = perfilActivo?.rol ?? null;

  const valor = useMemo(
    () => ({
      sesion,
      perfil: perfilActivo,
      cargando,
      demo,
      caducada,
      recuperandoClave,
      cancelarRecuperacion: () => setRecuperandoClave(false),
      diasSesion: DIAS_SESION,
      autenticado: (!!sesion || demo) && !recuperandoClave,
      usuarioId: demo ? perfilActivo?.id : (sesion?.user?.id ?? null),
      rol,
      esSoporte: rol === 'tecnico' || rol === 'admin',
      esAdmin: rol === 'admin',
      esTecnico: rol === 'tecnico',
      esUsuario: rol === 'aprendiz',

      // En modo demostración cambia de perfil al instante para probar los tres roles.
      cambiarRolDemo(nuevoRol) {
        const p = cambiarRolDemoFn(nuevoRol);
        setDemoTick((t) => t + 1);
        return p;
      },

      // Devuelve { error, requiereConfirmacion }. Cuando el proyecto exige
      // verificar el correo, Supabase no abre sesión: manda un enlace y deja
      // la cuenta esperando.
      // No se envía rol: toda cuenta nace como Usuario / Aprendiz (lo asegura la
      // base de datos) y el administrador asigna los demás roles.
      async registrar({ correo, clave, nombre, ficha, programa, telefono }) {
        const { data, error } = await supabase.auth.signUp({
          email: correo.trim(),
          password: clave,
          options: { data: { nombre, ficha, programa, telefono } },
        });

        if (error) return { error: error.message, requiereConfirmacion: false };
        return { error: null, requiereConfirmacion: !data.session };
      },

      // Vuelve a mandar el correo de verificación.
      async reenviarVerificacion(correo) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: correo.trim(),
        });
        return error?.message ?? null;
      },

      // Envía el enlace para cambiar la contraseña por correo.
      async recuperarClave(correo) {
        if (demo) return null;
        const urlActual = typeof window !== 'undefined' && window.location ? window.location.origin : undefined;
        const { error } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
          redirectTo: urlActual,
        });
        return error?.message ?? null;
      },

      // Asigna la nueva contraseña al usuario autenticado tras abrir el enlace.
      async actualizarClave(nuevaClave) {
        if (demo) return null;
        const { error } = await supabase.auth.updateUser({
          password: nuevaClave,
        });
        if (!error) {
          setRecuperandoClave(false);
        }
        return error?.message ?? null;
      },

      async entrar({ correo, clave }) {
        const { error } = await supabase.auth.signInWithPassword({
          email: correo.trim(),
          password: clave,
        });
        return error?.message ?? null;
      },

      // Recorre la aplicación con datos de ejemplo, sin tocar la base de datos.
      async entrarDemo() {
        try {
          if (typeof window !== 'undefined' && window?.localStorage) {
            window.localStorage.setItem(CLAVE_MODO_DEMO, 'true');
          }
          await AsyncStorage.setItem(CLAVE_MODO_DEMO, 'true');
        } catch {}
        activarDemo();
        setDemo(true);
      },

      async salir() {
        try {
          if (typeof window !== 'undefined' && window?.localStorage) {
            window.localStorage.removeItem(CLAVE_MODO_DEMO);
          }
          await AsyncStorage.removeItem(CLAVE_MODO_DEMO);
        } catch {}
        if (esDemo()) {
          desactivarDemo();
          setDemo(false);
          return;
        }
        await supabase.auth.signOut();
        await limpiarInicio();
        setPerfil(null);
      },

      async refrescarPerfil() {
        await cargarPerfil(sesion?.user?.id);
      },
    }),
    [sesion, perfilActivo, cargando, demo, caducada, recuperandoClave, demoTick]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
