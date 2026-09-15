import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Rect } from 'react-native-svg';
import { c, r, s, t } from '../theme';

// Anillo de proporciones minimalista. `datos` = [{ etiqueta, valor, color }]
export function Anillo({ datos, tamano = 140, grosor = 10, centroValor, centroTexto }) {
  const total = datos.reduce((suma, d) => suma + Number(d.valor || 0), 0);
  const radio = (tamano - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;

  let acumulado = 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={tamano} height={tamano}>
        <G rotation="-90" origin={`${tamano / 2}, ${tamano / 2}`}>
          <Circle
            cx={tamano / 2}
            cy={tamano / 2}
            r={radio}
            stroke={c.panelAlto}
            strokeWidth={grosor}
            fill="none"
          />
          {total > 0 &&
            datos
              .filter((d) => Number(d.valor) > 0)
              .map((d) => {
                const fraccion = Number(d.valor) / total;
                const trazo = fraccion * circunferencia;
                const desfase = -acumulado * circunferencia;
                acumulado += fraccion;
                return (
                  <Circle
                    key={d.etiqueta}
                    cx={tamano / 2}
                    cy={tamano / 2}
                    r={radio}
                    stroke={d.color}
                    strokeWidth={grosor}
                    strokeDasharray={`${trazo} ${circunferencia - trazo}`}
                    strokeDashoffset={desfase}
                    strokeLinecap="round"
                    fill="none"
                  />
                );
              })}
        </G>
      </Svg>

      <View style={g.centro}>
        <Text style={[t.cifra, { color: c.texto, fontSize: 24 }]}>{centroValor}</Text>
        {!!centroTexto && (
          <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 10.5, marginTop: 1 }]}>{centroTexto}</Text>
        )}
      </View>
    </View>
  );
}

export function Leyenda({ datos }) {
  const total = datos.reduce((suma, d) => suma + Number(d.valor || 0), 0);

  return (
    <View style={{ gap: 6, flex: 1, minWidth: 160 }}>
      {datos.map((d) => (
        <View key={d.etiqueta} style={g.filaLeyenda}>
          <View style={[g.puntoLeyenda, { backgroundColor: d.color }]} />
          <Text style={[t.pequeno, { color: c.textoSuave, flex: 1, fontSize: 12 }]}>{d.etiqueta}</Text>
          <Text style={[t.pequeno, { color: c.texto, fontWeight: '600', fontSize: 12 }]}>{d.valor}</Text>
          <Text style={[t.pequeno, { color: c.textoTenue, width: 38, textAlign: 'right', fontSize: 11 }]}>
            {total ? Math.round((Number(d.valor) / total) * 100) : 0}%
          </Text>
        </View>
      ))}
    </View>
  );
}

// Barras horizontales comparativas minimalistas.
export function Barras({ datos, alto = 8 }) {
  const maximo = Math.max(1, ...datos.map((d) => Number(d.valor)));

  return (
    <View style={{ gap: s.md }}>
      {datos.map((d) => (
        <View key={d.etiqueta} style={g.filaBarra}>
          <Text style={[t.pequeno, { color: c.textoSuave, width: 62, fontSize: 12 }]} numberOfLines={1}>
            {d.etiqueta}
          </Text>
          <View style={[g.pista, { height: alto }]}>
            <Svg width="100%" height={alto}>
              <Rect
                x="0"
                y="0"
                width={`${(Number(d.valor) / maximo) * 100}%`}
                height={alto}
                rx={alto / 2}
                fill={d.color ?? c.marca}
              />
            </Svg>
          </View>
          <Text style={[t.pequeno, { color: c.texto, fontWeight: '600', width: 24, textAlign: 'right', fontSize: 12 }]}>
            {d.valor}
          </Text>
        </View>
      ))}
    </View>
  );
}

const g = StyleSheet.create({
  centro: { position: 'absolute', alignItems: 'center' },
  filaLeyenda: { flexDirection: 'row', alignItems: 'center', gap: s.sm, paddingVertical: 2 },
  puntoLeyenda: { width: 6, height: 6, borderRadius: 3 },
  filaBarra: { flexDirection: 'row', alignItems: 'center', gap: s.md },
  pista: { flex: 1, borderRadius: r.full, backgroundColor: c.panelAlto, overflow: 'hidden' },
});
