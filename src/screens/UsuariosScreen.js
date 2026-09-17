import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cambiarRol, listarUsuarios } from '../lib/datos';
import { traducirError } from '../lib/errores';
import { iniciales } from '../lib/formato';
import { useAuth } from '../context/AuthContext';
import Pantalla from '../components/Pantalla';
import {
  Aviso,
  Boton,
  Buscador,
  Cargando,
  Chip,
  Encabezado,
  Panel,
  Segmentado,
  Vacio,
} from '../components/ui';
import { c, COLOR_ROLES, r, ROLES, s, t } from '../theme';

const OPCIONES_ROL = [
  { rol: 'aprendiz', texto: 'Usuario' },
  { rol: 'tecnico', texto: 'Técnico' },
  { rol: 'admin', texto: 'Administrador' },
];

// Solo el administrador entra aquí (ver rutas.js). La base de datos también lo
// exige: nadie más puede cambiar un rol, ni siquiera llamando a la API.
export default function UsuariosScreen() {
  const { usuarioId } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [guardandoId, setGuardandoId] = useState(null);
  const [porConfirmar, setPorConfirmar] = useState(null);

  const cargar = useCallback(async () => {
    const { usuarios: filas, error: err } = await listarUsuarios();
    setError(err ? traducirError(err) : '');
    setUsuarios(filas);
    setCargando(false);
    setRefrescando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const filtros = useMemo(() => {
    const cuantos = (rol) => usuarios.filter((u) => u.rol === rol).length;
    return [
      { valor: 'todos', etiqueta: 'Todos', conteo: usuarios.length },
      { valor: 'aprendiz', etiqueta: 'Usuarios', conteo: cuantos('aprendiz') },
      { valor: 'tecnico', etiqueta: 'Técnicos', conteo: cuantos('tecnico') },
      { valor: 'admin', etiqueta: 'Administradores', conteo: cuantos('admin') },
    ];
  }, [usuarios]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return usuarios
      .filter((u) => filtro === 'todos' || u.rol === filtro)
      .filter((u) => !q || [u.nombre, u.correo].filter(Boolean).some((campo) => campo.toLowerCase().includes(q)));
  }, [usuarios, filtro, busqueda]);

  async function aplicarRol(usuario, rol) {
    setPorConfirmar(null);
    setGuardandoId(usuario.id);
    setError('');
    setAviso('');

    const { error: err } = await cambiarRol(usuario.id, rol);
    setGuardandoId(null);

    if (err) {
      setError(traducirError(err));
      return;
    }
    setAviso(`${usuario.nombre} ahora es ${ROLES[rol]}.`);
    await cargar();
  }

  function elegirRol(usuario, rol) {
    if (usuario.rol === rol) return;
    // Hacer a alguien administrador le da acceso a todo: se pide confirmación.
    if (rol === 'admin') {
      setPorConfirmar({ id: usuario.id, rol });
      return;
    }
    aplicarRol(usuario, rol);
  }

  if (cargando) {
    return (
      <Pantalla lateral sinScroll>
        <Cargando texto="Cargando usuarios" />
      </Pantalla>
    );
  }

  return (
    <Pantalla
      lateral
      refrescando={refrescando}
      onRefrescar={() => {
        setRefrescando(true);
        cargar();
      }}
    >
      <Encabezado
        rotulo="Administración"
        titulo="Usuarios"
        descripcion="Asigna el rol de cada persona. Las cuentas nuevas llegan como Usuario / Aprendiz."
      />

      <Aviso texto={error} />
      <Aviso texto={aviso} tipo="ok" />

      <View style={a.controles}>
        <Buscador valor={busqueda} onChangeText={setBusqueda} placeholder="Buscar por nombre o correo…" />
        <Segmentado opciones={filtros} valor={filtro} onChange={setFiltro} />
      </View>

      {visibles.length === 0 ? (
        <Vacio
          icono={busqueda ? 'buscar' : 'usuarios'}
          titulo={busqueda ? 'Nadie coincide con la búsqueda' : 'No hay cuentas en este filtro'}
          detalle="Las personas aparecen aquí cuando crean su cuenta desde la app."
        />
      ) : (
        visibles.map((usuario) => (
          <FilaUsuario
            key={usuario.id}
            usuario={usuario}
            esYo={usuario.id === usuarioId}
            guardando={guardandoId === usuario.id}
            confirmando={porConfirmar?.id === usuario.id}
            onElegir={(rol) => elegirRol(usuario, rol)}
            onConfirmar={() => aplicarRol(usuario, porConfirmar.rol)}
            onCancelar={() => setPorConfirmar(null)}
          />
        ))
      )}
    </Pantalla>
  );
}

function FilaUsuario({ usuario, esYo, guardando, confirmando, onElegir, onConfirmar, onCancelar }) {
  const color = COLOR_ROLES[usuario.rol] ?? COLOR_ROLES.aprendiz;
  const bloqueado = esYo || usuario.perfilDemo;
  const nota = esYo
    ? 'No puedes cambiar tu propio rol.'
    : usuario.perfilDemo
      ? 'Perfil de la demostración: su rol se cambia con el selector de rol.'
      : null;

  return (
    <Panel estilo={{ marginBottom: s.md }}>
      <View style={a.cabeza}>
        <View style={[a.avatar, { backgroundColor: color.fondo }]}>
          <Text style={[a.avatarTexto, { color: color.color }]}>{iniciales(usuario.nombre)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={a.nombre} numberOfLines={1}>
            {usuario.nombre}
            {esYo ? ' (tú)' : ''}
          </Text>
          <Text style={a.correo} numberOfLines={1}>
            {usuario.correo || 'Sin correo'}
          </Text>
        </View>
        <Chip texto={ROLES[usuario.rol] ?? usuario.rol} color={color.color} fondo={color.fondo} />
      </View>

      <View style={a.roles}>
        {OPCIONES_ROL.map((opcion) => {
          const actual = usuario.rol === opcion.rol;
          return (
            <Pressable
              key={opcion.rol}
              onPress={() => onElegir(opcion.rol)}
              disabled={bloqueado || guardando}
              style={[a.opcion, actual && a.opcionActual, bloqueado && !actual && { opacity: 0.45 }]}
            >
              <Text style={[a.opcionTexto, actual && { color: c.marcaAlta, fontWeight: '700' }]}>{opcion.texto}</Text>
            </Pressable>
          );
        })}
        {guardando && <ActivityIndicator color={c.marca} size="small" />}
      </View>

      {!!nota && <Text style={a.nota}>{nota}</Text>}

      {confirmando && (
        <View style={a.confirmar}>
          <Text style={[t.pequeno, { color: c.texto, flex: 1, minWidth: 180 }]}>
            {usuario.nombre} podrá ver todas las solicitudes, asignar técnicos y cambiar roles.
          </Text>
          <View style={{ flexDirection: 'row', gap: s.sm }}>
            <Boton titulo="Cancelar" variante="fantasma" pequeno onPress={onCancelar} />
            <Boton titulo="Sí, hacer administrador" pequeno onPress={onConfirmar} />
          </View>
        </View>
      )}
    </Panel>
  );
}

const a = StyleSheet.create({
  controles: { gap: s.md, marginBottom: s.lg },

  cabeza: { flexDirection: 'row', alignItems: 'center', gap: s.md },
  avatar: { width: 38, height: 38, borderRadius: r.md, alignItems: 'center', justifyContent: 'center' },
  avatarTexto: { ...t.pequeno, fontWeight: '700' },
  nombre: { ...t.cuerpo, color: c.texto, fontWeight: '600' },
  correo: { ...t.pequeno, color: c.textoTenue },

  roles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: s.sm, marginTop: s.md },
  opcion: {
    paddingHorizontal: s.md,
    height: 32,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: c.linea,
    backgroundColor: c.panelAlto,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opcionActual: { borderColor: c.marca, backgroundColor: c.marcaBaja },
  opcionTexto: { ...t.pequeno, color: c.textoSuave, fontWeight: '600' },

  nota: { ...t.pequeno, color: c.textoTenue, fontSize: 11.5, marginTop: s.sm },

  confirmar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: s.md,
    marginTop: s.md,
    padding: s.md,
    borderRadius: r.md,
    backgroundColor: c.ambarBajo,
  },
});
