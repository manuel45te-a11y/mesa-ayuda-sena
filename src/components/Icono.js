import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline, Defs, Stop, Text as SvgText } from 'react-native-svg';
import { c, mono } from '../theme';

// Trazos dibujados a mano sobre una retícula de 24, grosor uniforme de 1.6
// y remates redondeados. No dependen de ninguna fuente de iconos.
const T = {
  panel: (x) => (
    <>
      <Rect x="3.2" y="3.2" width="7.6" height="8.8" rx="2" {...x} />
      <Rect x="13.2" y="3.2" width="7.6" height="5.6" rx="2" {...x} />
      <Rect x="3.2" y="14.8" width="7.6" height="6" rx="2" {...x} />
      <Rect x="13.2" y="11.6" width="7.6" height="9.2" rx="2" {...x} />
    </>
  ),
  bandeja: (x) => (
    <>
      <Path d="M3.2 13.4 5.6 4.6a2 2 0 0 1 1.9-1.4h9a2 2 0 0 1 1.9 1.4l2.4 8.8" {...x} />
      <Path d="M3.2 13.4h4.4l1.2 2.6h6.4l1.2-2.6h4.4v5a2.4 2.4 0 0 1-2.4 2.4H5.6a2.4 2.4 0 0 1-2.4-2.4Z" {...x} />
    </>
  ),
  pulso: (x) => (
    <>
      <Polyline points="2.8 14.6 7 14.6 9.4 8.4 13 18.6 15.4 14.6 21.2 14.6" {...x} />
    </>
  ),
  persona: (x) => (
    <>
      <Circle cx="12" cy="8.2" r="3.6" {...x} />
      <Path d="M4.6 20.4a7.4 7.4 0 0 1 14.8 0" {...x} />
    </>
  ),
  salir: (x) => (
    <>
      <Path d="M14.4 4.2H6.8a2 2 0 0 0-2 2v11.6a2 2 0 0 0 2 2h7.6" {...x} />
      <Polyline points="17.6 8.4 21.2 12 17.6 15.6" {...x} />
      <Line x1="21.2" y1="12" x2="10.4" y2="12" {...x} />
    </>
  ),
  atras: (x) => <Polyline points="14.6 5.4 8 12 14.6 18.6" {...x} />,
  derecha: (x) => <Polyline points="9.4 5.4 16 12 9.4 18.6" {...x} />,
  mas: (x) => (
    <>
      <Line x1="12" y1="5.2" x2="12" y2="18.8" {...x} />
      <Line x1="5.2" y1="12" x2="18.8" y2="12" {...x} />
    </>
  ),
  reloj: (x) => (
    <>
      <Circle cx="12" cy="12" r="8.6" {...x} />
      <Polyline points="12 6.8 12 12 15.6 13.8" {...x} />
    </>
  ),
  alerta: (x) => (
    <>
      <Path d="M12 3.6 2.9 19.8a1 1 0 0 0 .9 1.5h16.4a1 1 0 0 0 .9-1.5Z" {...x} />
      <Line x1="12" y1="9.6" x2="12" y2="14" {...x} />
      <Line x1="12" y1="17.2" x2="12" y2="17.3" {...x} />
    </>
  ),
  check: (x) => <Polyline points="4.6 12.6 9.6 17.6 19.4 6.8" {...x} />,
  lugar: (x) => (
    <>
      <Path d="M12 21.2s7.2-6.3 7.2-11.2a7.2 7.2 0 1 0-14.4 0c0 4.9 7.2 11.2 7.2 11.2Z" {...x} />
      <Circle cx="12" cy="9.8" r="2.6" {...x} />
    </>
  ),
  buscar: (x) => (
    <>
      <Circle cx="10.8" cy="10.8" r="6.6" {...x} />
      <Line x1="15.8" y1="15.8" x2="20.4" y2="20.4" {...x} />
    </>
  ),
  llave: (x) => (
    <Path d="M14.6 6.4a4.1 4.1 0 0 0 5.3 5.3l-8.5 8.5a2.5 2.5 0 0 1-3.5-3.5l8.5-8.5a4.1 4.1 0 0 0-5.3-5.3l3 3-2.1 2.1-3-3" {...x} />
  ),
  estrella: (x, lleno) => (
    <Path
      d="m12 3.4 2.7 5.5 6 .9-4.4 4.2 1.1 6-5.4-2.8-5.4 2.8 1.1-6L3.3 9.8l6-.9Z"
      {...x}
      fill={lleno ? x.stroke : 'none'}
    />
  ),
  refrescar: (x) => (
    <>
      <Path d="M20.4 12a8.4 8.4 0 1 1-2.7-6.2" {...x} />
      <Polyline points="20.6 3.6 20.6 8.4 15.8 8.4" {...x} />
    </>
  ),
  filtro: (x) => <Path d="M3.6 5.2h16.8l-6.5 7.6v6.2l-3.8 1.8v-8Z" {...x} />,
  cerrar: (x) => (
    <>
      <Line x1="6.2" y1="6.2" x2="17.8" y2="17.8" {...x} />
      <Line x1="17.8" y1="6.2" x2="6.2" y2="17.8" {...x} />
    </>
  ),
  camara: (x) => (
    <>
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...x} />
      <Circle cx="12" cy="13" r="4" {...x} />
    </>
  ),
  imagen: (x) => (
    <>
      <Rect x="3" y="3" width="18" height="18" rx="2" ry="2" {...x} />
      <Circle cx="8.5" cy="8.5" r="1.5" {...x} />
      <Polyline points="21 15 16 10 5 21" {...x} />
    </>
  ),
  adjunto: (x) => (
    <Path
      d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      {...x}
    />
  ),
  asignar: (x) => (
    <>
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...x} />
      <Circle cx="8.5" cy="7" r="4" {...x} />
      <Line x1="20" y1="8" x2="20" y2="14" {...x} />
      <Line x1="23" y1="11" x2="17" y2="11" {...x} />
    </>
  ),
  escudo: (x) => (
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...x} />
  ),
};

export default function Icono({ nombre, tamano = 20, color = c.textoSuave, grosor = 1.6, lleno }) {
  const dibujo = T[nombre];
  if (!dibujo) return null;

  const props = {
    stroke: color,
    strokeWidth: grosor,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24">
      {dibujo(props, lleno)}
    </Svg>
  );
}

// Isotipo oficial/institucional de la aplicación: badge verde SENA con silueta estilizada
export function Logotipo({ tamano = 40 }) {
  const radio = Math.round(tamano * 0.26);
  return (
    <View
      style={[
        l.marca,
        {
          width: tamano,
          height: tamano,
          borderRadius: radio,
        },
      ]}
    >
      <Svg width={tamano * 0.62} height={tamano * 0.62} viewBox="0 0 24 24">
        <Circle cx="12" cy="4.2" r="2.2" fill="#FFFFFF" />
        <Path
          d="M12 8.5v11.5M5.5 13l6.5-4.5 6.5 4.5M7 19.5l5-5.5 5 5.5"
          stroke="#FFFFFF"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const l = StyleSheet.create({
  marca: {
    backgroundColor: c.marca,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.marca,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
});
