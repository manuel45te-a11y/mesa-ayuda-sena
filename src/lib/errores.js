// Traduce los mensajes que devuelve Supabase a algo que un usuario entienda.
const TRADUCCIONES = [
  [
    'Invalid login credentials',
    'Correo o contraseña incorrectos. Si acabas de crear la cuenta, revisa que el correo esté confirmado.',
  ],
  [
    'Email not confirmed',
    'Tu correo todavía no está confirmado. Ábrelo desde el enlace que te llegó, o confirma el usuario desde Supabase.',
  ],
  ['Email logins are disabled', 'El acceso con correo está desactivado en el proyecto de Supabase.'],
  ['Email signups are disabled', 'El registro de cuentas nuevas está desactivado en Supabase.'],
  ['User already registered', 'Ya existe una cuenta con ese correo.'],
  ['Password should be at least', 'La contraseña es demasiado corta: usa al menos 6 caracteres.'],
  ['Unable to validate email address', 'El correo no tiene un formato válido.'],
  ['User not found', 'No encontramos ninguna cuenta con ese correo.'],
  ['New password should be different', 'La nueva contraseña debe ser diferente a la anterior.'],
  ['Auth session missing', 'El enlace de recuperación ha expirado o ya fue utilizado. Solicita uno nuevo.'],
  ['For security purposes', 'Espera unos segundos antes de volver a intentarlo.'],
  ['Failed to fetch', 'No hay conexión con el servidor. Revisa tu internet.'],
];

export function traducirError(mensaje) {
  if (!mensaje) return '';
  const encontrada = TRADUCCIONES.find(([clave]) => mensaje.includes(clave));
  return encontrada ? encontrada[1] : mensaje;
}
