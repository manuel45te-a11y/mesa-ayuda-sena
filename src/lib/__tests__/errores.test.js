import { traducirError } from '../errores';

describe('mensajes de error para la persona', () => {
  it('traduce el acceso incorrecto', () => {
    expect(traducirError('Invalid login credentials')).toMatch(/Correo o contraseña incorrectos/);
  });

  it('un bloqueo de RLS se entiende como falta de permiso', () => {
    expect(traducirError('new row violates row-level security policy for table "tickets"')).toBe(
      'No tienes permiso para hacer este cambio.'
    );
  });

  it('si la base no tiene el script de roles, dice qué ejecutar', () => {
    expect(
      traducirError("Could not find the 'descripcion' column of 'ticket_adjuntos' in the schema cache")
    ).toMatch(/roles-y-asignacion\.sql/);
  });

  it('los mensajes que ya vienen en español desde la base se muestran tal cual', () => {
    const mensaje = 'Adjunta al menos una evidencia antes de cerrar la solicitud.';
    expect(traducirError(mensaje)).toBe(mensaje);
  });

  it('sin mensaje devuelve texto vacío', () => {
    expect(traducirError(null)).toBe('');
  });
});
