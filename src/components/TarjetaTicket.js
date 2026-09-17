import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLinkProps } from '@react-navigation/native';
import { Chip, Panel } from './ui';
import Icono from './Icono';
import { c, ESTADOS, PRIORIDADES, r, s, t } from '../theme';
import { desde, sla } from '../lib/formato';

// La tarjeta es un enlace a /solicitudes/<código>. Si quien la usa pasa su
// propio `onPress`, ese manda.
export default function TarjetaTicket({ ticket, onPress }) {
  const estado = ESTADOS[ticket.estado] ?? ESTADOS.pendiente;
  const prioridad = PRIORIDADES[ticket.prioridad] ?? PRIORIDADES.media;
  const reloj = sla(ticket.creado_at, ticket.vence_at, ticket.estado);
  const enlace = useLinkProps({ screen: 'TicketDetalle', params: { codigo: ticket.codigo } });

  return (
    <Panel {...enlace} onPress={onPress ?? enlace.onPress} estilo={x.panel}>
      {/* Cabecera: Código, Prioridad y Estado */}
      <View style={x.cabeza}>
        <View style={x.cabezaIzq}>
          <View style={x.badgeCodigo}>
            <Text style={x.codigoTexto}>{ticket.codigo}</Text>
          </View>
          <View style={[x.badgePrioridad, { backgroundColor: prioridad.fondo, borderColor: prioridad.color + '40' }]}>
            <View style={[x.puntoPrioridad, { backgroundColor: prioridad.color }]} />
            <Text style={[x.prioridadTexto, { color: prioridad.color }]}>{prioridad.etiqueta}</Text>
          </View>
        </View>
        <Chip texto={estado.etiqueta} color={estado.color} fondo={estado.fondo} />
      </View>

      {/* Título de la solicitud */}
      <Text style={x.titulo} numberOfLines={2}>
        {ticket.titulo}
      </Text>

      {/* Metadatos en píldoras legibles */}
      <View style={x.metaFila}>
        {!!ticket.ambiente_codigo && (
          <View style={x.pildora}>
            <Icono nombre="lugar" tamano={12} color={c.textoSuave} />
            <Text style={x.pildoraTexto}>{ticket.ambiente_codigo}</Text>
          </View>
        )}
        {!!ticket.categoria_nombre && (
          <View style={x.pildora}>
            <Text style={x.pildoraTexto}>{ticket.categoria_nombre}</Text>
          </View>
        )}
        <View style={x.pildora}>
          <Icono nombre="reloj" tamano={12} color={c.textoTenue} />
          <Text style={[x.pildoraTexto, { color: c.textoTenue }]}>{desde(ticket.creado_at)}</Text>
        </View>
      </View>

      {/* Línea divisoria sutil */}
      <View style={x.separador} />

      {/* Pie de tarjeta: Tiempo de atención (SLA) y Técnico */}
      <View style={x.pie}>
        <View style={x.slaContenedor}>
          <View style={x.pista}>
            <View
              style={[
                x.avance,
                {
                  width: `${Math.round(reloj.progreso * 100)}%`,
                  backgroundColor: reloj.vencido
                    ? c.rojo
                    : reloj.progreso > 0.75
                      ? c.ambar
                      : reloj.cerrado
                        ? c.gris
                        : c.marcaAlta,
                },
              ]}
            />
          </View>
          <Text
            style={[
              x.slaTexto,
              {
                color: reloj.vencido ? c.rojo : c.textoSuave,
                fontWeight: reloj.vencido ? '700' : '500',
              },
            ]}
          >
            {reloj.texto}
          </Text>
        </View>

        {!!ticket.tecnico_nombre && (
          <View style={x.tecnicoBadge}>
            <Icono nombre="persona" tamano={12} color={c.textoSuave} />
            <Text style={x.tecnicoTexto} numberOfLines={1}>
              {ticket.tecnico_nombre}
            </Text>
          </View>
        )}
      </View>
    </Panel>
  );
}

const x = StyleSheet.create({
  panel: {
    marginBottom: s.md,
    padding: s.lg,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.linea,
    backgroundColor: c.panel,
  },
  cabeza: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s.sm,
    marginBottom: s.sm,
  },
  cabezaIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    flexWrap: 'wrap',
  },
  badgeCodigo: {
    backgroundColor: c.panelAlto,
    borderWidth: 1,
    borderColor: c.lineaFuerte,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: r.sm,
  },
  codigoTexto: {
    ...t.codigo,
    color: c.textoSuave,
    fontWeight: '600',
    fontSize: 11,
  },
  badgePrioridad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: r.sm,
    borderWidth: 1,
  },
  puntoPrioridad: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  prioridadTexto: {
    ...t.pequeno,
    fontSize: 11,
    fontWeight: '600',
  },
  titulo: {
    ...t.cuerpo,
    fontSize: 15,
    lineHeight: 22,
    color: c.texto,
    fontWeight: '600',
    marginBottom: s.sm + 2,
  },
  metaFila: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pildora: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.panelAlto,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: r.sm,
    borderWidth: 1,
    borderColor: c.linea,
  },
  pildoraTexto: {
    ...t.pequeno,
    color: c.textoSuave,
    fontSize: 11.5,
    fontWeight: '500',
  },
  separador: {
    height: 1,
    backgroundColor: c.linea,
    marginVertical: s.md,
    opacity: 0.8,
  },
  pie: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: s.sm,
  },
  slaContenedor: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  pista: {
    flex: 1,
    height: 6,
    borderRadius: r.full,
    backgroundColor: c.panelAlto,
    borderWidth: 1,
    borderColor: c.linea,
    overflow: 'hidden',
  },
  avance: {
    height: 6,
    borderRadius: r.full,
  },
  slaTexto: {
    ...t.pequeno,
    fontSize: 11.5,
  },
  tecnicoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.panelAlto,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: r.sm,
  },
  tecnicoTexto: {
    ...t.pequeno,
    color: c.textoSuave,
    fontSize: 11.5,
    maxWidth: 160,
  },
});
