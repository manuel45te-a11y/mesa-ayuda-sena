import {
  activarDemo,
  asignarTecnico,
  cambiarRol,
  cambiarRolDemo,
  cancelarTicket,
  cerrarTicket,
  desactivarDemo,
  eventosDe,
  listar,
  listarTecnicos,
  listarUsuarios,
  obtener,
  obtenerEvidencias,
  obtenerPerfilDemo,
  subirEvidencia,
} from '../demo';
import { FOTOS_EJEMPLO } from '../fotosEjemplo';

// Estas pruebas recorren en el modo demostración las mismas reglas que
// supabase/roles-y-asignacion.sql impone en la base de datos.

const FOTO = { imagen: FOTOS_EJEMPLO[0].imagen, nombre: 'cable.png', descripcion: 'Cable nuevo en el puerto 4' };
const SOLUCION = 'Se cambió el cable de red dañado.';

beforeEach(() => {
  activarDemo(); // reinicia los datos y entra como administrador
});

afterEach(() => {
  desactivarDemo();
});

const sinAsignar = () => listar().find((t) => t.estado === 'pendiente' && !t.tecnico_id);
const como = (rol) => cambiarRolDemo(rol);

describe('perfiles de la demostración', () => {
  it('arranca como administrador', () => {
    expect(obtenerPerfilDemo().rol).toBe('admin');
  });

  it('cambia entre usuario, técnico y administrador', () => {
    expect(como('aprendiz').rol).toBe('aprendiz');
    expect(como('tecnico').rol).toBe('tecnico');
    expect(como('admin').rol).toBe('admin');
  });

  it('ignora un rol que no existe', () => {
    como('tecnico');
    expect(como('superusuario').rol).toBe('tecnico');
  });

  it('la lista de técnicos trae técnicos y administradores, no usuarios', () => {
    const roles = listarTecnicos().map((u) => u.rol);
    expect(roles).toContain('tecnico');
    expect(roles).toContain('admin');
    expect(roles).not.toContain('aprendiz');
  });
});

describe('asignación', () => {
  it('el administrador asigna: pasa a en proceso con fecha de atención y queda en la bitácora', async () => {
    const t = sinAsignar();
    const { error } = await asignarTecnico(t.id, 'demo-tecnico-1');

    expect(error).toBeNull();
    const despues = obtener(t.id);
    expect(despues.estado).toBe('en_proceso');
    expect(despues.atendido_at).not.toBeNull();

    const ultimo = eventosDe(t.id).at(-1);
    expect(ultimo.tipo).toBe('asignacion');
    expect(ultimo.comentario).toBe('Asignada a Carlos Ríos');
    expect(ultimo.actor_id).toBe('demo-admin');
  });

  it('reasignar no reescribe la primera atención', async () => {
    const t = sinAsignar();
    await asignarTecnico(t.id, 'demo-tecnico-1');
    const primeraAtencion = obtener(t.id).atendido_at;

    await asignarTecnico(t.id, 'demo-tecnico-2');

    expect(obtener(t.id).atendido_at).toBe(primeraAtencion);
    expect(eventosDe(t.id).at(-1).comentario).toBe('Reasignada de Carlos Ríos a Laura Gómez');
  });

  it('un técnico toma para sí una solicitud sin asignar', async () => {
    const t = sinAsignar();
    como('tecnico');
    const { error } = await asignarTecnico(t.id, 'demo-tecnico-1');

    expect(error).toBeNull();
    expect(obtener(t.id).tecnico_id).toBe('demo-tecnico-1');
  });

  it('un técnico no le asigna solicitudes a otro técnico', async () => {
    const t = sinAsignar();
    como('tecnico');
    const { error } = await asignarTecnico(t.id, 'demo-tecnico-2');

    expect(error).toMatch(/permiso/);
    expect(obtener(t.id).tecnico_id).toBeNull();
  });

  it('un usuario no asigna', async () => {
    const t = sinAsignar();
    como('aprendiz');
    const { error } = await asignarTecnico(t.id, 'demo-tecnico-1');
    expect(error).toMatch(/permiso/);
  });

  it('no se asigna a alguien que no es técnico ni administrador', async () => {
    const t = sinAsignar();
    const { error } = await asignarTecnico(t.id, 'demo-usuario-1');
    expect(error).toMatch(/no es técnico/);
  });
});

describe('evidencias y cierre', () => {
  async function asignadaACarlos() {
    const t = sinAsignar();
    await asignarTecnico(t.id, 'demo-tecnico-1');
    return t;
  }

  it('el técnico asignado sube la evidencia y queda con su nota en la bitácora', async () => {
    const t = await asignadaACarlos();
    como('tecnico');
    const { error } = await subirEvidencia(t.id, FOTO);

    expect(error).toBeNull();
    const [evidencia] = obtenerEvidencias(t.id);
    expect(evidencia.descripcion).toBe('Cable nuevo en el puerto 4');
    expect(evidencia.subido_por_nombre).toBe('Carlos Ríos');
    expect(eventosDe(t.id).at(-1)).toMatchObject({ tipo: 'evidencia', comentario: 'cable.png — Cable nuevo en el puerto 4' });
  });

  it('un usuario no sube evidencias', async () => {
    const t = await asignadaACarlos();
    como('aprendiz');
    const { error } = await subirEvidencia(t.id, FOTO);
    expect(error).toMatch(/técnico asignado/);
  });

  it('no se cierra sin evidencia', async () => {
    const t = await asignadaACarlos();
    como('tecnico');
    const { error } = await cerrarTicket(t.id, { solucion: SOLUCION });

    expect(error).toMatch(/evidencia/);
    expect(obtener(t.id).estado).toBe('en_proceso');
  });

  it('no se cierra con una solución de menos de 10 caracteres', async () => {
    const t = await asignadaACarlos();
    como('tecnico');
    await subirEvidencia(t.id, FOTO);
    const { error } = await cerrarTicket(t.id, { solucion: 'Listo' });
    expect(error).toMatch(/mínimo 10/);
  });

  it('con evidencia y solución se cierra y la solución queda en la bitácora', async () => {
    const t = await asignadaACarlos();
    como('tecnico');
    await subirEvidencia(t.id, FOTO);
    const { error } = await cerrarTicket(t.id, { solucion: SOLUCION });

    expect(error).toBeNull();
    const despues = obtener(t.id);
    expect(despues.estado).toBe('resuelto');
    expect(despues.resuelto_at).not.toBeNull();
    expect(eventosDe(t.id).at(-1)).toMatchObject({ tipo: 'cambio_estado', estado_nuevo: 'resuelto', comentario: SOLUCION });
  });

  it('otro técnico no puede cerrar una solicitud que no es suya', async () => {
    const t = sinAsignar();
    await asignarTecnico(t.id, 'demo-tecnico-2');
    await subirEvidencia(t.id, FOTO); // la sube el administrador
    como('tecnico'); // Carlos
    const { error } = await cerrarTicket(t.id, { solucion: SOLUCION });
    expect(error).toMatch(/técnico asignado/);
  });
});

describe('cancelación', () => {
  it('solo el administrador cancela', async () => {
    const t = sinAsignar();
    como('tecnico');
    expect((await cancelarTicket(t.id)).error).toMatch(/Solo el administrador/);

    como('admin');
    expect((await cancelarTicket(t.id)).error).toBeNull();
    expect(obtener(t.id).estado).toBe('cancelado');
  });

  it('una solicitud cancelada no se vuelve a asignar', async () => {
    const t = sinAsignar();
    await cancelarTicket(t.id);
    expect((await asignarTecnico(t.id, 'demo-tecnico-1')).error).toMatch(/cerrada/);
  });
});

describe('roles de las cuentas', () => {
  it('el administrador cambia el rol de otra persona', async () => {
    const { error } = await cambiarRol('demo-tecnico-2', 'aprendiz');

    expect(error).toBeNull();
    expect(listarUsuarios().find((u) => u.id === 'demo-tecnico-2').rol).toBe('aprendiz');
    expect(listarTecnicos().some((u) => u.id === 'demo-tecnico-2')).toBe(false);
  });

  it('nadie cambia su propio rol', async () => {
    expect((await cambiarRol('demo-admin', 'aprendiz')).error).toMatch(/propio rol/);
  });

  it('un técnico no cambia roles', async () => {
    como('tecnico');
    expect((await cambiarRol('demo-tecnico-2', 'admin')).error).toMatch(/Solo el administrador/);
  });

  it('los perfiles del selector de rol quedan protegidos', async () => {
    expect((await cambiarRol('demo-tecnico-1', 'aprendiz')).error).toMatch(/selector de rol/);
    expect(listarUsuarios().find((u) => u.id === 'demo-tecnico-1').perfilDemo).toBe(true);
  });

  it('no acepta roles inventados', async () => {
    expect((await cambiarRol('demo-tecnico-3', 'superusuario')).error).toMatch(/no válido/);
  });
});
