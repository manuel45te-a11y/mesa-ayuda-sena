import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tablero } from '../lib/datos';
import Pantalla from '../components/Pantalla';
import { Anillo, Barras, Leyenda } from '../components/Graficos';
import { Aviso, Cargando, Encabezado, Metrica, Panel, Rotulo, Vacio, useEscritorio } from '../components/ui';
import { c, r, s, t } from '../theme';
import { horas } from '../lib/formato';

export default function DashboardScreen() {
  const escritorio = useEscritorio();
  const [ind, setInd] = useState(null);
  const [ambientes, setAmbientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    const { indicadores, ambientes: filas, error: err } = await tablero();
    setError(err ?? '');
    setInd(indicadores);
    setAmbientes(filas);
    setCargando(false);
    setRefrescando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  if (cargando) {
    return (
      <Pantalla lateral sinScroll>
        <Cargando texto="Calculando indicadores" />
      </Pantalla>
    );
  }

  const n = (v) => Number(v ?? 0);
  const total = n(ind?.total);
  const vencidos = n(ind?.vencidos);
  const cumplimiento = total > 0 ? Math.round(((total - vencidos) / total) * 100) : 100;

  const porEstado = [
    { etiqueta: 'Pendiente', valor: n(ind?.pendientes), color: c.azul },
    { etiqueta: 'En proceso', valor: n(ind?.en_proceso), color: c.ambar },
    { etiqueta: 'Resuelto', valor: n(ind?.resueltos), color: c.verde },
    { etiqueta: 'Cancelado', valor: n(ind?.cancelados), color: c.gris },
  ];

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
        rotulo="Indicadores"
        titulo="Rendimiento del servicio"
        descripcion="Estadísticas de atención y resolución de solicitudes en los ambientes."
      />

      <Aviso texto={error} />

      <View style={a.metricas}>
        <Metrica etiqueta="Solicitudes totales" valor={total} icono="bandeja" />
        <Metrica
          etiqueta="En atención"
          valor={n(ind?.pendientes) + n(ind?.en_proceso)}
          color={c.azul}
          icono="reloj"
        />
        <Metrica etiqueta="Fuera de SLA" valor={vencidos} color={vencidos ? c.rojo : c.texto} icono="alerta" />
        <Metrica
          etiqueta="Cumplimiento"
          valor={`${cumplimiento}%`}
          color={cumplimiento >= 90 ? c.verde : cumplimiento >= 70 ? c.ambar : c.rojo}
          icono="check"
        />
      </View>

      <View style={[a.rejilla, !escritorio && { flexDirection: 'column' }]}>
        <Panel estilo={a.tarjetaAncha}>
          <Rotulo estilo={{ marginBottom: s.md }}>Distribución por estado</Rotulo>
          {total === 0 ? (
            <Vacio titulo="Sin solicitudes registradas" icono="pulso" />
          ) : (
            <View style={a.anilloFila}>
              <Anillo
                datos={porEstado}
                centroValor={total}
                centroTexto={total === 1 ? 'solicitud' : 'solicitudes'}
              />
              <Leyenda datos={porEstado} />
            </View>
          )}
        </Panel>

        <Panel estilo={a.tarjetaAncha}>
          <Rotulo estilo={{ marginBottom: s.md }}>Tiempos del servicio</Rotulo>

          <Fila
            clave="Primera respuesta"
            valor={horas(ind?.prom_horas_respuesta)}
            detalle="Tiempo promedio hasta la primera atención"
          />
          <Fila
            clave="Resolución completa"
            valor={horas(ind?.prom_horas_resolucion)}
            detalle="Tiempo promedio hasta dar solución definitiva"
            ultimo
          />

          <View style={a.cumplimiento}>
            <View style={a.filaEntre}>
              <Text style={[t.pequeno, { color: c.textoSuave }]}>Cumplimiento del SLA</Text>
              <Text style={[t.pequeno, { color: c.texto, fontWeight: '700' }]}>{cumplimiento}%</Text>
            </View>
            <View style={a.pista}>
              <View
                style={[
                  a.avance,
                  {
                    width: `${cumplimiento}%`,
                    backgroundColor:
                      cumplimiento >= 90 ? c.verde : cumplimiento >= 70 ? c.ambar : c.rojo,
                  },
                ]}
              />
            </View>
          </View>
        </Panel>
      </View>

      <Panel estilo={{ marginTop: s.md }}>
        <Rotulo estilo={{ marginBottom: s.md }}>Ambientes con más solicitudes</Rotulo>
        {ambientes.length === 0 ? (
          <Vacio titulo="Sin datos todavía" icono="lugar" />
        ) : (
          <Barras
            datos={ambientes.map((x) => ({
              etiqueta: x.codigo,
              valor: Number(x.total),
              color: Number(x.pendientes) > 0 ? c.ambar : c.marca,
            }))}
          />
        )}
        <Text style={[t.pequeno, { color: c.textoTenue, marginTop: s.md, fontSize: 11 }]}>
          En ámbar los ambientes que tienen solicitudes pendientes de resolver.
        </Text>
      </Panel>
    </Pantalla>
  );
}

function Fila({ clave, valor, detalle, ultimo }) {
  return (
    <View style={[a.fila, ultimo && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[t.pequeno, { color: c.texto, fontWeight: '500' }]}>{clave}</Text>
        {!!detalle && (
          <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11, marginTop: 1 }]}>
            {detalle}
          </Text>
        )}
      </View>
      <Text style={[t.pequeno, { color: c.texto, fontWeight: '600', fontSize: 13 }]}>
        {valor}
      </Text>
    </View>
  );
}

const a = StyleSheet.create({
  metricas: { flexDirection: 'row', flexWrap: 'wrap', gap: s.md, marginBottom: s.md },
  rejilla: { flexDirection: 'row', gap: s.md, alignItems: 'stretch' },
  tarjetaAncha: { flex: 1, minWidth: 280 },

  anilloFila: { flexDirection: 'row', alignItems: 'center', gap: s.xl, flexWrap: 'wrap' },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    paddingVertical: s.md,
    borderBottomWidth: 1,
    borderBottomColor: c.linea,
  },
  filaEntre: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s.sm },

  cumplimiento: { marginTop: s.lg },
  pista: { height: 8, borderRadius: r.full, backgroundColor: c.panelSuave, overflow: 'hidden' },
  avance: { height: 8, borderRadius: r.full },
});
