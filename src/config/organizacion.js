// ============================================================================
//  ORGANIZACIÓN
//
//  Esta mesa de ayuda sirve para cualquier lugar: una empresa, un colegio, una
//  clínica, un hotel. Lo que cambia de una a otra está acá y se configura con
//  variables de entorno (ver .env.example), sin tocar el resto del código:
//
//    EXPO_PUBLIC_ORGANIZACION        nombre que se muestra en la app
//    EXPO_PUBLIC_TIPO_ORGANIZACION   empresa | educacion | salud | hotel
//    EXPO_PUBLIC_COLOR               indigo | azul | violeta | turquesa
//    EXPO_PUBLIC_LOGO_URL            dirección de una imagen (opcional)
//
//  El tipo define cómo se llaman los lugares donde ocurren las fallas y qué
//  datos se le piden a cada persona al registrarse. Si no se configura nada,
//  la app arranca como "empresa u oficina", con nombres neutros.
//
//  En el modo demostración el tipo se cambia desde Perfil, para ver cómo se
//  adapta la app sin configurar nada.
// ============================================================================

export const NOMBRE_PRODUCTO = 'Mesa de Ayuda';
export const LEMA = 'Soporte y mantenimiento';

export const TIPOS = {
  empresa: {
    etiqueta: 'Empresa u oficina',
    corto: 'Empresa',
    ejemplo: 'Empresa de ejemplo',
    lugar: { singular: 'Ubicación', plural: 'Ubicaciones' },
    campos: [
      { campo: 'programa', etiqueta: 'Área o dependencia', ejemplo: 'Contabilidad' },
      { campo: 'ficha', etiqueta: 'Cargo', ejemplo: 'Auxiliar contable' },
    ],
    lugares: [
      { codigo: 'SJ-1', nombre: 'Sala de juntas' },
      { codigo: 'OF-201', nombre: 'Oficina 201' },
      { codigo: 'CAF', nombre: 'Cafetería' },
      { codigo: 'CONT', nombre: 'Contabilidad' },
      { codigo: 'BOD', nombre: 'Bodega' },
      { codigo: 'DIS', nombre: 'Diseño y publicidad' },
      { codigo: 'AUD', nombre: 'Auditorio' },
      { codigo: 'REC', nombre: 'Recepción' },
    ],
  },

  educacion: {
    etiqueta: 'Colegio, instituto o universidad',
    corto: 'Educación',
    ejemplo: 'Institución de ejemplo',
    lugar: { singular: 'Espacio', plural: 'Espacios' },
    campos: [
      { campo: 'programa', etiqueta: 'Programa o curso', ejemplo: 'Técnico en sistemas' },
      { campo: 'ficha', etiqueta: 'Grupo', ejemplo: '2B' },
    ],
    lugares: [
      { codigo: 'A-101', nombre: 'Aula 101' },
      { codigo: 'SIS-1', nombre: 'Sala de sistemas' },
      { codigo: 'BIB', nombre: 'Biblioteca' },
      { codigo: 'LAB-1', nombre: 'Laboratorio' },
      { codigo: 'ALM', nombre: 'Almacén' },
      { codigo: 'A-203', nombre: 'Aula 203' },
      { codigo: 'AUD', nombre: 'Auditorio' },
      { codigo: 'SEC', nombre: 'Secretaría' },
    ],
  },

  salud: {
    etiqueta: 'Clínica u hospital',
    corto: 'Salud',
    ejemplo: 'Clínica de ejemplo',
    lugar: { singular: 'Área', plural: 'Áreas' },
    campos: [
      { campo: 'programa', etiqueta: 'Servicio', ejemplo: 'Facturación' },
      { campo: 'ficha', etiqueta: 'Cargo', ejemplo: 'Auxiliar de facturación' },
    ],
    lugares: [
      { codigo: 'CAP', nombre: 'Sala de capacitación' },
      { codigo: 'ADM', nombre: 'Admisiones' },
      { codigo: 'ESP', nombre: 'Sala de espera' },
      { codigo: 'FAC', nombre: 'Facturación' },
      { codigo: 'ALM', nombre: 'Almacén' },
      { codigo: 'C-03', nombre: 'Consultorio 3' },
      { codigo: 'HOS-2', nombre: 'Hospitalización piso 2' },
      { codigo: 'URG', nombre: 'Urgencias' },
    ],
  },

  hotel: {
    etiqueta: 'Hotel u hospedaje',
    corto: 'Hotel',
    ejemplo: 'Hotel de ejemplo',
    lugar: { singular: 'Ubicación', plural: 'Ubicaciones' },
    campos: [
      { campo: 'programa', etiqueta: 'Departamento', ejemplo: 'Recepción' },
      { campo: 'ficha', etiqueta: 'Cargo', ejemplo: 'Recepcionista' },
    ],
    lugares: [
      { codigo: 'EVE', nombre: 'Salón de eventos' },
      { codigo: 'REC', nombre: 'Recepción' },
      { codigo: 'RES', nombre: 'Restaurante' },
      { codigo: 'ADM', nombre: 'Oficina administrativa' },
      { codigo: 'LAV', nombre: 'Lavandería' },
      { codigo: 'H-204', nombre: 'Habitación 204' },
      { codigo: 'H-305', nombre: 'Habitación 305' },
      { codigo: 'GYM', nombre: 'Gimnasio' },
    ],
  },
};

export const TIPO_POR_DEFECTO = 'empresa';
export const COLOR_POR_DEFECTO = 'indigo';

const limpiar = (valor) => (typeof valor === 'string' ? valor.trim() : '');

// Sin acentos y en minúscula, para aceptar "Índigo" o "indigo", "Salud" o "salud".
const clave = (valor) =>
  limpiar(valor).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Otras formas de nombrar lo mismo.
const OTROS_NOMBRES = {
  oficina: 'empresa',
  colegio: 'educacion',
  universidad: 'educacion',
  instituto: 'educacion',
  clinica: 'salud',
  hospital: 'salud',
  hospedaje: 'hotel',
  morado: 'violeta',
  purpura: 'violeta',
  lila: 'violeta',
  celeste: 'azul',
  teal: 'turquesa',
};

const normalizar = (valor) => {
  const k = clave(valor);
  return OTROS_NOMBRES[k] ?? k;
};

const tipoPedido = normalizar(process.env.EXPO_PUBLIC_TIPO_ORGANIZACION);
const colorPedido = normalizar(process.env.EXPO_PUBLIC_COLOR);

export const CONFIG = {
  nombre: limpiar(process.env.EXPO_PUBLIC_ORGANIZACION),
  tipo: TIPOS[tipoPedido] ? tipoPedido : TIPO_POR_DEFECTO,
  // El nombre del color lo valida theme.js, que es quien tiene las paletas.
  color: colorPedido || COLOR_POR_DEFECTO,
  logo: limpiar(process.env.EXPO_PUBLIC_LOGO_URL) || null,
};

// Lo que necesitan las pantallas para nombrar las cosas. En la demostración se
// usa el nombre de ejemplo del tipo elegido, porque los datos también son de
// ejemplo.
export function datosOrganizacion({ tipo, demo = false } = {}) {
  const id = TIPOS[tipo] ? tipo : CONFIG.tipo;
  const base = TIPOS[id];
  const nombre = demo ? base.ejemplo : CONFIG.nombre;

  return {
    tipo: id,
    etiqueta: base.etiqueta,
    corto: base.corto,
    lugar: base.lugar,
    campos: base.campos,
    lugares: base.lugares,
    producto: NOMBRE_PRODUCTO,
    nombre,
    // Segunda línea junto al nombre del producto.
    pie: nombre || LEMA,
    logo: CONFIG.logo,
  };
}
