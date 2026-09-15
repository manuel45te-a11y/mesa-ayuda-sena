import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listarTickets } from '../lib/datos';
import { useAuth } from '../context/AuthContext';
import Pantalla from '../components/Pantalla';
import TarjetaTicket from '../components/TarjetaTicket';
import { Aviso, Boton, Buscador, Cargando, Encabezado, Segmentado, Vacio } from '../components/ui';
import { s } from '../theme';

const ACTIVOS = ['pendiente', 'en_proceso'];

export default function TicketsScreen({ navigation }) {
  const { usuarioId, esSoporte } = useAuth();
  const [filtro, setFiltro] = useState(esSoporte ? 'pendientes' : 'mios');
  const [busqueda, setBusqueda] = useState('');
  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

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
    const mios = tickets.filter((t) =>
      esSoporte ? t.tecnico_id === usuarioId : t.reportante_id === usuarioId
    );
    return {
      pendientes: tickets.filter((t) => ACTIVOS.includes(t.estado)),
      sin_asignar: tickets.filter((t) => !t.tecnico_id && ACTIVOS.includes(t.estado)),
      mios,
      vencidos: tickets.filter(
        (t) => ACTIVOS.includes(t.estado) && new Date(t.vence_at) < new Date()
      ),
      resuelto: tickets.filter((t) => ['resuelto'].includes(t.estado)),
      todos: tickets,
    };
  }, [tickets, usuarioId, esSoporte]);

  const filtros = [
    { valor: 'pendientes', etiqueta: 'Pendientes', conteo: grupos.pendientes.length },
    ...(esSoporte
      ? [{ valor: 'sin_asignar', etiqueta: 'Sin atender', conteo: grupos.sin_asignar.length }]
      : []),
    { valor: 'mios', etiqueta: esSoporte ? 'Atiendo yo' : 'Míos', conteo: grupos.mios.length },
    { valor: 'vencidos', etiqueta: 'Vencidos', conteo: grupos.vencidos.length },
    { valor: 'resuelto', etiqueta: 'Resueltos', conteo: grupos.resuelto.length },
    { valor: 'todos', etiqueta: 'Todos', conteo: grupos.todos.length },
  ];

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
        <Segmentado opciones={filtros} valor={filtro} onChange={setFiltro} />
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
        visibles.map((ticket) => (
          <TarjetaTicket
            key={ticket.id}
            ticket={ticket}
            onPress={() =>
              navigation.navigate('TicketDetalle', { id: ticket.id, codigo: ticket.codigo })
            }
          />
        ))
      )}
    </Pantalla>
  );
}

const a = StyleSheet.create({
  controles: { gap: s.md, marginBottom: s.lg },
});
