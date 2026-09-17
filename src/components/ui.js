import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Icono from './Icono';
import { c, CORTE_ESCRITORIO, r, s, t } from '../theme';

// ¿Estamos en una pantalla ancha? Decide barra lateral vs pestañas.
export function useEscritorio() {
  const { width } = useWindowDimensions();
  return width >= CORTE_ESCRITORIO;
}

// ---------------------------------------------------------------------------
//  Texto
// ---------------------------------------------------------------------------
export function Titulo({ children, estilo }) {
  return <Text style={[t.titulo, { color: c.texto }, estilo]}>{children}</Text>;
}

export function Rotulo({ children, color = c.textoTenue, estilo }) {
  return (
    <Text style={[t.micro, { color, textTransform: 'uppercase' }, estilo]}>{children}</Text>
  );
}

export function Parrafo({ children, estilo }) {
  return <Text style={[t.cuerpo, { color: c.textoSuave }, estilo]}>{children}</Text>;
}

// ---------------------------------------------------------------------------
//  Encabezado de pantalla
// ---------------------------------------------------------------------------
export function Encabezado({ rotulo, titulo, descripcion, accion, volver }) {
  return (
    <View style={e.encabezado}>
      {!!volver && (
        <Pressable onPress={volver} style={e.volver} hitSlop={8}>
          <Icono nombre="atras" tamano={18} color={c.textoSuave} />
          <Text style={[t.pequeno, { color: c.textoSuave }]}>Volver</Text>
        </Pressable>
      )}

      <View style={e.encabezadoFila}>
        <View style={{ flex: 1, minWidth: 200 }}>
          {!!rotulo && <Rotulo estilo={{ marginBottom: 6 }}>{rotulo}</Rotulo>}
          <Titulo>{titulo}</Titulo>
          {!!descripcion && (
            <Parrafo estilo={{ marginTop: 6, maxWidth: 560 }}>{descripcion}</Parrafo>
          )}
        </View>
        {accion}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Botones
// ---------------------------------------------------------------------------
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  icono,
  cargando,
  deshabilitado,
  ancho,
  pequeno,
}) {
  const [encima, setEncima] = useState(false);
  const inactivo = deshabilitado || cargando;

  const paleta = {
    primario: { fondo: c.marca, borde: c.marca, texto: '#FFFFFF' },
    secundario: { fondo: c.panelAlto, borde: c.lineaFuerte, texto: c.texto },
    fantasma: { fondo: 'transparent', borde: 'transparent', texto: c.textoSuave },
    peligro: { fondo: c.rojoBajo, borde: c.rojo, texto: c.rojo },
  }[variante];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      onHoverIn={() => setEncima(true)}
      onHoverOut={() => setEncima(false)}
      style={[
        e.boton,
        pequeno && e.botonPequeno,
        {
          backgroundColor: paleta.fondo,
          borderColor: paleta.borde,
          opacity: inactivo ? 0.45 : encima ? 0.88 : 1,
        },
        ancho && { alignSelf: 'stretch' },
      ]}
    >
      {cargando ? (
        <ActivityIndicator size="small" color={paleta.texto} />
      ) : (
        <>
          {!!icono && <Icono nombre={icono} tamano={pequeno ? 15 : 17} color={paleta.texto} grosor={1.9} />}
          <Text
            style={[
              pequeno ? t.pequeno : t.cuerpo,
              { color: paleta.texto, fontWeight: '600' },
            ]}
          >
            {titulo}
          </Text>
        </>
      )}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
//  Entradas de texto
// ---------------------------------------------------------------------------
export function Campo({
  etiqueta,
  valor,
  onChangeText,
  placeholder,
  secure,
  multilinea,
  teclado,
  autoCapitalize,
  ayuda,
  contador,
}) {
  const [foco, setFoco] = useState(false);

  return (
    <View style={{ marginBottom: s.lg }}>
      {!!etiqueta && (
        <View style={e.campoCabeza}>
          <Rotulo color={c.textoSuave}>{etiqueta}</Rotulo>
          {!!contador && (
            <Text style={[t.pequeno, { color: c.textoTenue }]}>
              {(valor ?? '').length}/{contador}
            </Text>
          )}
        </View>
      )}
      <TextInput
        style={[
          e.entrada,
          multilinea && e.entradaMulti,
          foco && { borderColor: c.marca, backgroundColor: c.panelAlto },
        ]}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textoTenue}
        secureTextEntry={secure}
        multiline={multilinea}
        keyboardType={teclado}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        maxLength={contador}
      />
      {!!ayuda && (
        <Text style={[t.pequeno, { color: c.textoTenue, marginTop: 6 }]}>{ayuda}</Text>
      )}
    </View>
  );
}

export function Buscador({ valor, onChangeText, placeholder = 'Buscar…' }) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={[e.buscador, foco && { borderColor: c.marca, backgroundColor: c.panelAlto }]}>
      <Icono nombre="buscar" tamano={16} color={foco ? c.marca : c.textoTenue} />
      <TextInput
        style={e.buscadorEntrada}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textoTenue}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
      />
      {!!valor && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8}>
          <Icono nombre="cerrar" tamano={14} color={c.textoTenue} />
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Selección
// ---------------------------------------------------------------------------

// Filtros en línea, con contador opcional por opción.
export function Segmentado({ opciones, valor, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 6, paddingRight: s.lg }}>
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => onChange(o.valor)}
              style={[e.segmento, activo && e.segmentoActivo]}
            >
              <Text
                style={[
                  t.pequeno,
                  { color: activo ? c.marcaAlta : c.textoSuave, fontWeight: activo ? '600' : '500' },
                ]}
              >
                {o.etiqueta}
              </Text>
              {o.conteo !== undefined && (
                <View style={[e.conteo, activo && { backgroundColor: c.marcaBaja }]}>
                  <Text style={[t.pequeno, { color: activo ? c.marcaAlta : c.textoTenue, fontSize: 11 }]}>
                    {o.conteo}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

// Rejilla de opciones para catálogos largos (categorías, ambientes).
export function Opciones({ etiqueta, opciones, valor, onChange, ayuda, columnas = 2 }) {
  return (
    <View style={{ marginBottom: s.lg }}>
      {!!etiqueta && <Rotulo color={c.textoSuave} estilo={{ marginBottom: s.sm }}>{etiqueta}</Rotulo>}
      <View style={e.rejilla}>
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <Pressable
              key={String(o.valor)}
              onPress={() => onChange(o.valor)}
              style={[
                e.opcion,
                { flexBasis: `${100 / columnas}%` },
                activo && { borderColor: c.marca, backgroundColor: c.marcaBaja },
              ]}
            >
              <View style={[e.radio, activo && { borderColor: c.marca }]}>
                {activo && <View style={e.radioPunto} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[t.pequeno, { color: activo ? c.texto : c.textoSuave, fontWeight: '600' }]}
                  numberOfLines={1}
                >
                  {o.etiqueta}
                </Text>
                {!!o.detalle && (
                  <Text style={[t.pequeno, { color: c.textoTenue, fontSize: 11 }]} numberOfLines={1}>
                    {o.detalle}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
      {!!ayuda && <Text style={[t.pequeno, { color: c.textoTenue, marginTop: 6 }]}>{ayuda}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
//  Indicadores
// ---------------------------------------------------------------------------
export function Chip({ texto, color = c.textoSuave, fondo = c.grisBajo, punto = true }) {
  return (
    <View style={[e.chip, { backgroundColor: fondo }]}>
      {punto && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />}
      <Text style={[t.pequeno, { color, fontWeight: '600', fontSize: 11.5 }]}>{texto}</Text>
    </View>
  );
}

// Con `href` (en la web) el panel se vuelve un enlace real: muestra la
// dirección al pasar el mouse y se puede abrir en otra pestaña.
export function Panel({ children, estilo, onPress, acento, href, role }) {
  const [encima, setEncima] = useState(false);
  const Caja = onPress ? Pressable : View;

  return (
    <Caja
      onPress={onPress}
      href={href}
      role={role}
      onHoverIn={onPress ? () => setEncima(true) : undefined}
      onHoverOut={onPress ? () => setEncima(false) : undefined}
      style={[e.panel, encima && { borderColor: c.lineaFuerte, backgroundColor: c.panelAlto }, estilo]}
    >
      {!!acento && <View style={[e.acento, { backgroundColor: acento }]} />}
      {children}
    </Caja>
  );
}

export function Metrica({ valor, etiqueta, color = c.texto, icono }) {
  return (
    <View style={e.metrica}>
      <View style={e.metricaCabeza}>
        <Rotulo>{etiqueta}</Rotulo>
        {!!icono && <Icono nombre={icono} tamano={15} color={c.textoTenue} />}
      </View>
      <Text style={[t.cifra, { color }]}>{valor}</Text>
    </View>
  );
}

export function Aviso({ texto, tipo = 'error' }) {
  if (!texto) return null;
  const paleta = {
    error: { fondo: c.rojoBajo, color: c.rojo, icono: 'alerta' },
    ok: { fondo: c.verdeBajo, color: c.verde, icono: 'check' },
    info: { fondo: c.azulBajo, color: c.azul, icono: 'alerta' },
  }[tipo];

  return (
    <View style={[e.aviso, { backgroundColor: paleta.fondo }]}>
      <Icono nombre={paleta.icono} tamano={16} color={paleta.color} />
      <Text style={[t.pequeno, { color: paleta.color, flex: 1, flexShrink: 1, minWidth: 0 }]}>
        {texto}
      </Text>
    </View>
  );
}

export function Separador({ margen = s.lg }) {
  return <View style={{ height: 1, backgroundColor: c.linea, marginVertical: margen }} />;
}

// ---------------------------------------------------------------------------
//  Estados de la vista
// ---------------------------------------------------------------------------
export function Cargando({ texto = 'Cargando' }) {
  return (
    <View style={e.centro}>
      <ActivityIndicator color={c.marca} />
      <Text style={[t.pequeno, { color: c.textoTenue, marginTop: s.md }]}>{texto}</Text>
    </View>
  );
}

export function Vacio({ titulo, detalle, icono = 'bandeja', accion }) {
  return (
    <View style={e.centro}>
      <View style={e.vacioIcono}>
        <Icono nombre={icono} tamano={22} color={c.textoTenue} />
      </View>
      <Text style={[t.seccion, { color: c.textoSuave, textAlign: 'center' }]}>{titulo}</Text>
      {!!detalle && (
        <Text
          style={[t.pequeno, { color: c.textoTenue, textAlign: 'center', marginTop: 6, maxWidth: 340 }]}
        >
          {detalle}
        </Text>
      )}
      {!!accion && <View style={{ marginTop: s.lg }}>{accion}</View>}
    </View>
  );
}

const e = StyleSheet.create({
  encabezado: { marginBottom: s.xl },
  encabezadoFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: s.md,
  },
  volver: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: s.md, alignSelf: 'flex-start' },

  boton: {
    minHeight: 44,
    paddingHorizontal: s.lg,
    borderRadius: r.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.sm,
  },
  botonPequeno: { minHeight: 34, paddingHorizontal: s.md, borderRadius: r.sm },

  campoCabeza: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.sm,
  },
  entrada: {
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.linea,
    borderRadius: r.md,
    paddingHorizontal: s.md,
    paddingVertical: 11,
    fontSize: 14,
    color: c.texto,
    minHeight: 44,
    outlineStyle: 'none',
  },
  entradaMulti: { minHeight: 118, textAlignVertical: 'top', paddingTop: s.md },

  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.linea,
    borderRadius: r.md,
    paddingHorizontal: s.md,
    height: 40,
  },
  buscadorEntrada: {
    flex: 1,
    fontSize: 13.5,
    color: c.texto,
    outlineStyle: 'none',
    height: 40,
  },

  segmento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.md,
    height: 34,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: c.panel,
  },
  segmentoActivo: { backgroundColor: c.marcaBaja, borderColor: c.marca + '50' },
  conteo: {
    minWidth: 20,
    paddingHorizontal: 5,
    height: 17,
    borderRadius: r.full,
    backgroundColor: c.grisBajo,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejilla: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
  opcion: {
    flexGrow: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    padding: s.md,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.linea,
    backgroundColor: c.panel,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: c.lineaFuerte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioPunto: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.marca },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: s.sm + 2,
    height: 23,
    borderRadius: r.sm,
    alignSelf: 'flex-start',
  },

  panel: {
    backgroundColor: c.panel,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.linea,
    padding: s.lg,
    overflow: 'hidden',
  },
  acento: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },

  metrica: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.linea,
    borderRadius: r.lg,
    padding: s.lg,
    gap: s.sm,
  },
  metricaCabeza: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    borderRadius: r.md,
    paddingHorizontal: s.md,
    paddingVertical: s.md,
    marginBottom: s.lg,
  },

  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: s.xxxl, paddingHorizontal: s.lg },
  vacioIcono: {
    width: 48,
    height: 48,
    borderRadius: r.md,
    backgroundColor: c.panel,
    borderWidth: 1,
    borderColor: c.linea,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.md,
  },
});
