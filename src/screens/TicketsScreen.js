import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarTickets } from '../lib/datos';
import { useAuth } from '../context/AuthContext';
import Pantalla from '../components/Pantalla';
import TarjetaTicket from '../components/TarjetaTicket';
import { Aviso, Boton, Buscador, Cargando, Encabezado, Segmentado, Vacio } from '../components/ui';
import { s } from '../theme';

const ACTIVOS = ['pendiente', 'en_proceso'];

// Espera antes de pasar la búsqueda a la dirección, para no reescribirla en
// cada tecla.
const PAUSA_BUSQUEDA_MS = 350;

export default function TicketsScreen({ navigation, route }) {
  const { usuarioId, esAdmin, esTecnico, esUsuario } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  // El filtro y la búsqueda viven en la dirección (/solicitudes?filtro=vencidos&buscar=aire):
  // así recargar la página no los borra y el enlace se puede compartir.
  const buscarEnRuta = route.params?.buscar ?? '';
  const [busqueda, setBusqueda] = useState(buscarEnRuta);

  // Se traen todos los visibles y el filtrado fino se hace en memoria: así los
  // contadores de cada pestaña son reales y no cuesta una consulta por filtro.
  const cargar = useCallback(async () => {
    const { tickets: filas, error: err } = await listarTickets();
    setError(err ?? '');
    setTickets(filas);
    setCargando(false);
    setRefrescando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const grupos = useMemo(() => {
    const lista = esUsuario ? tickets.filter((t) => t.reportante_id === usuarioId) : tickets;

    return {
      todos: lista,
      sin_asignar: lista.filter((t) => !t.tecnico_id && ACTIVOS.includes(t.estado)),
      pendientes: lista.filter((t) => ACTIVOS.includes(t.estado)),
      mios: esTecnico
        ? tickets.filter((t) => t.tecnico_id === usuarioId)
        : tickets.filter((t) => t.reportante_id === usuarioId),
      vencidos: lista.filter((t) => ACTIVOS.includes(t.estado) && new Date(t.vence_at) < new Date()),
      resueltos: lista.filter((t) => t.estado === 'resuelto'),
    };
  }, [tickets, usuarioId, esTecnico, esUsuario]);

  // Cada rol ve los filtros que le sirven; el primero es el de entrada.
  const filtros = useMemo(() => {
    if (esAdmin) {
      return [
        { valor: 'sin_asignar', etiqueta: 'Por asignar', conteo: grupos.sin_asignar.length },
        { valor: 'pendientes', etiqueta: 'Activas', conteo: grupos.pendientes.length },
        { valor: 'vencidos', etiqueta: 'Vencidas', conteo: grupos.vencidos.length },
        { valor: 'resueltos', etiqueta: 'Resueltas', conteo: grupos.resueltos.length },
        { valor: 'todos', etiqueta: 'Todas', conteo: grupos.todos.length },
      ];
    }
    if (esTecnico) {
      return [
        { valor: 'mios', etiqueta: 'Asignadas a mí', conteo: grupos.mios.length },
        { valor: 'sin_asignar', etiqueta: 'Sin asignar', conteo: grupos.sin_asignar.length },
        { valor: 'vencidos', etiqueta: 'Vencidas', conteo: grupos.vencidos.length },
        { valor: 'resueltos', etiqueta: 'Resueltas', conteo: grupos.resueltos.length },
        { valor: 'todos', etiqueta: 'Todas', conteo: grupos.todos.length },
      ];
    }
    return [
      { valor: 'mios', etiqueta: 'Mis solicitudes', conteo: grupos.mios.length },
      { valor: 'pendientes', etiqueta: 'En atención', conteo: grupos.pendientes.length },
      { valor: 'resueltos', etiqueta: 'Resueltas', conteo: grupos.resueltos.length },
    ];
  }, [esAdmin, esTecnico, grupos]);

  // Un filtro que no existe para este rol (por ejemplo, un usuario que abre
  // ?filtro=sin_asignar) cae en el filtro de entrada.
  const filtroPorDefecto = filtros[0].valor;
  const filtro = filtros.some((f) => f.valor === route.params?.filtro)
    ? route.params.filtro
    : filtroPorDefecto;

  const cambiarFiltro = (valor) =>
    navigation.setParams({ filtro: valor === filtroPorDefecto ? undefined : valor });

  // La búsqueda se escribe en la dirección un momento después de dejar de teclear.
  // `escritaAqui` recuerda lo último que esta pantalla puso en la dirección, para
  // no confundir ese cambio con uno que llega desde afuera.
  const escritaAqui = useRef(buscarEnRuta);

  useEffect(() => {
    const q = busqueda.trim();
    if (q === escritaAqui.current) return undefined;

    const espera = setTimeout(() => {
      escritaAqui.current = q;
      navigation.setParams({ buscar: q || undefined });
    }, PAUSA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [busqueda, navigation]);

  // Si la dirección cambia desde afuera (un enlace, el botón atrás), el campo la sigue.
  useEffect(() => {
    if (buscarEnRuta !== escritaAqui.current) {
      escritaAqui.current = buscarEnRuta;
      setBusqueda(buscarEnRuta);
    }
  }, [buscarEnRuta]);

  const visibles = useMemo(() => {
    const base = grupos[filtro] ?? [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return base;
    return base.filter((t) =>
      [t.codigo, t.titulo, t.ambiente_codigo, t.ambiente_nombre, t.categoria_nombre]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(q))
    );
  }, [grupos, filtro, busqueda]);

  if (cargando) {
    return (
      <Pantalla lateral sinScroll>
        <Cargando texto="Cargando solicitudes" />
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
        rotulo="Mesa de ayuda"
        titulo="Solicitudes"
        descripcion="Seguimiento y atención a las fallas reportadas según tu rol."
        accion={
          <Boton
            titulo="Reportar falla"
            icono="mas"
            onPress={() => navigation.navigate('NuevoTicket')}
          />
        }
      />

      <View style={a.controles}>
        <Buscador
          valor={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por código, título o ambiente…"
        />
        <Segmentado opciones={filtros} valor={filtro} onChange={cambiarFiltro} />
      </View>

      <Aviso texto={error} />

      {visibles.length === 0 ? (
        <Vacio
          titulo={busqueda ? 'Ninguna solicitud coincide con la búsqueda' : 'No hay solicitudes en este filtro'}
          detalle={
            busqueda
              ? 'Prueba con el código de la solicitud o el nombre del ambiente.'
              : 'Cuando se registre una solicitud que puedas ver, aparecerá aquí.'
          }
          icono={busqueda ? 'buscar' : 'bandeja'}
        />
      ) : (
        visibles.map((ticket) => <TarjetaTicket key={ticket.id} ticket={ticket} />)
      )}
    </Pantalla>
  );
}

const a = StyleSheet.create({
  controles: { gap: s.md, marginBottom: s.lg },
});
