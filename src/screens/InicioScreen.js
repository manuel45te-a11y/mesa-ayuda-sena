import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLinkProps } from '@react-navigation/native';
import { resumenInicio } from '../lib/datos';
import { useAuth } from '../context/AuthContext';
import { destino } from '../navigation/rutas';
import Pantalla from '../components/Pantalla';
import TarjetaTicket from '../components/TarjetaTicket';
import Icono from '../components/Icono';
import { Boton, Cargando, Encabezado, Metrica, Panel, Rotulo, Vacio } from '../components/ui';
import { c, r, s, t } from '../theme';

export default function InicioScreen({ navigation }) {
  const { perfil, usuarioId, esSoporte } = useAuth();
  const [datos, setDatos] = useState({ pendientes: 0, vencidos: 0, resueltos: 0, sinAsignar: 0 });
  const [recientes, setRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Enlaces a la lista: el aviso de vencidas abre la lista ya filtrada.
  const enlaceVencidas = useLinkProps(destino('Tickets', { filtro: 'vencidos' }));
  const enlaceTodas = useLinkProps(destino('Tickets'));

  const cargar = useCallback(async () => {
    const resumen = await resumenInicio(usuarioId, esSoporte);
    setDatos({
      pendientes: resumen.pendientes,
      vencidos: resumen.vencidos,
      resueltos: resumen.resueltos,
      sinAsignar: resumen.sinAsignar,
    });
    setRecientes(resumen.recientes);
    setCargando(false);
    setRefrescando(false);
  }, [usuarioId, esSoporte]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (cargando) {
    return (
      <Pantalla lateral sinScroll>
        <Cargando />
      </Pantalla>
    );
  }

  const nombre = perfil?.nombre?.split(' ')[0] ?? '';

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
        rotulo="Panel"
        titulo={`Hola, ${nombre}`}
        descripcion={
          esSoporte
            ? 'Este es el estado del servicio de soporte en este momento.'
            : 'Aquí está el estado de las fallas que has reportado.'
        }
        accion={
          <Boton
            titulo="Reportar falla"
            icono="mas"
            onPress={() => navigation.navigate('NuevoTicket')}
          />
        }
      />

      <View style={a.metricas}>
        <Metrica
          etiqueta={esSoporte ? 'Por atender' : 'Mis solicitudes'}
          valor={datos.pendientes}
          color={c.texto}
          icono="bandeja"
        />
        {esSoporte && (
          <Metrica etiqueta="Sin atender" valor={datos.sinAsignar} color={c.cian} icono="filtro" />
        )}
        <Metrica etiqueta="Fuera de SLA" valor={datos.vencidos} color={c.rojo} icono="alerta" />
        <Metrica etiqueta="Resueltos" valor={datos.resueltos} color={c.verde} icono="check" />
      </View>

      {datos.vencidos > 0 && (
        <Pressable {...enlaceVencidas}>
          <Panel estilo={a.alerta} acento={c.rojo}>
            <View style={a.alertaIcono}>
              <Icono nombre="alerta" tamano={17} color={c.rojo} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={a.alertaTitulo}>
                {datos.vencidos} {datos.vencidos === 1 ? 'solicitud superó' : 'solicitudes superaron'} el
                tiempo de atención
              </Text>
              <Text style={a.alertaTexto}>
                {datos.vencidos === 1 ? 'Revísala primero: es la que afecta' : 'Revísalas primero: son las que afectan'}{' '}
                el indicador de cumplimiento.
              </Text>
            </View>
            <Icono nombre="derecha" tamano={16} color={c.textoTenue} />
          </Panel>
        </Pressable>
      )}

      <View style={a.seccion}>
        <Rotulo>Actividad reciente</Rotulo>
        <Pressable {...enlaceTodas} hitSlop={6}>
          <Text style={a.verTodo}>Ver todas</Text>
        </Pressable>
      </View>

      {recientes.length === 0 ? (
        <Vacio
          titulo="Todavía no hay solicitudes"
          detalle="Cuando se registre una solicitud en un ambiente, aparecerá en esta lista."
          accion={
            <Boton
              titulo="Registrar la primera"
              icono="mas"
              variante="secundario"
              onPress={() => navigation.navigate('NuevoTicket')}
            />
          }
        />
      ) : (
        recientes.map((ticket) => <TarjetaTicket key={ticket.id} ticket={ticket} />)
      )}
    </Pantalla>
  );
}

const a = StyleSheet.create({
  metricas: { flexDirection: 'row', flexWrap: 'wrap', gap: s.md },

  alerta: { flexDirection: 'row', alignItems: 'center', gap: s.md, marginTop: s.md, paddingLeft: s.lg + 3 },
  alertaIcono: {
    width: 34,
    height: 34,
    borderRadius: r.sm,
    backgroundColor: c.rojoBajo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertaTitulo: { ...t.cuerpo, color: c.texto, fontWeight: '600' },
  alertaTexto: { ...t.pequeno, color: c.textoTenue, marginTop: 2 },

  seccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s.xxl,
    marginBottom: s.md,
  },
  verTodo: { ...t.pequeno, color: c.marcaAlta, fontWeight: '600' },
});
