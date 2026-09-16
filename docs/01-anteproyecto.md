# 1. Anteproyecto

> Borrador de trabajo. Ajusta los datos entre `[corchetes]` con la información real de tu
> centro de formación y verifica el formato exacto que exige tu instructor.

---

## 1.1 Título

**Sistema web y móvil para la gestión de incidencias técnicas en los ambientes de formación
del [Centro de Formación], mediante el registro, asignación y seguimiento de tickets con
control de tiempos de atención.**

## 1.2 Planteamiento del problema

En el [Centro de Formación] las fallas técnicas de los ambientes —proyectores que no
encienden, equipos sin red, tomas eléctricas dañadas, software desactualizado— se reportan
hoy por canales informales: se le avisa de palabra al instructor, se escribe por WhatsApp o
se busca directamente al técnico disponible.

Ese mecanismo genera cuatro problemas concretos:

1. **No queda registro.** Si nadie anota el reporte, no existe. Cuando el técnico está
   ocupado, la falla se olvida.
2. **No hay responsable definido.** Varias personas pueden reportar lo mismo, o nadie asumir
   la solución, porque no existe un momento explícito de asignación.
3. **No se puede medir.** El coordinador no sabe cuántas fallas hubo en el trimestre, cuáles
   ambientes fallan más, ni cuánto se demora el equipo en responder.
4. **Se pierde tiempo de formación.** Una sesión que empieza 20 minutos tarde porque el
   videobeam no sirve es tiempo de aprendizaje perdido, y se repite porque la causa nunca se
   documentó.

**Pregunta problema:** ¿cómo garantizar que toda falla técnica reportada en un ambiente de
formación quede registrada, asignada a un responsable y atendida dentro de un tiempo
establecido, con información que permita medir el servicio?

## 1.3 Justificación

Un sistema de mesa de ayuda convierte un reporte verbal en un registro con estado,
responsable y tiempo límite. El beneficio no es solo ordenar el trabajo del técnico:

- **Para el aprendiz e instructor:** sabe que su reporte existe y en qué va, sin tener que
  perseguir a nadie.
- **Para el técnico:** recibe una cola de trabajo priorizada en lugar de interrupciones
  sueltas, y su trabajo queda documentado.
- **Para el coordinador:** obtiene indicadores reales para sustentar decisiones —qué ambiente
  necesita renovación de equipos, si el personal de soporte alcanza, dónde se incumplen los
  tiempos.
- **Para el centro:** los datos históricos permiten pasar de un mantenimiento reactivo a uno
  preventivo.

Además es un desarrollo viable con herramientas gratuitas (Expo y Supabase en su plan libre)
y se puede poner en producción en un ambiente real sin costo de licencias.

## 1.4 Objetivos

### Objetivo general

Desarrollar una aplicación web y móvil que permita registrar, asignar y hacer seguimiento a
las incidencias técnicas de los ambientes de formación del [Centro de Formación],
controlando los tiempos de atención mediante acuerdos de nivel de servicio.

### Objetivos específicos

1. **Analizar** el procedimiento actual de reporte y atención de fallas técnicas del centro,
   identificando actores, tiempos y puntos de falla del proceso.
2. **Diseñar** el modelo de datos y la arquitectura de la solución, definiendo entidades,
   relaciones, roles de usuario y reglas de seguridad a nivel de fila.
3. **Desarrollar** los módulos de autenticación con roles, registro de fallas, atención y
   resolución, y tablero de indicadores.
4. **Implementar** el cálculo automático del tiempo de atención comprometido según la
   categoría de la falla, y la alerta de incumplimiento.
5. **Validar** el funcionamiento de la aplicación mediante casos de prueba sobre el flujo
   completo del ticket y las reglas de acceso de cada rol.

> Los verbos están en infinitivo y cada uno es verificable con una evidencia concreta.
> Si tu instructor exige la taxonomía de Bloom, revisa que el verbo del objetivo general sea
> de mayor nivel que el de los específicos.

## 1.5 Alcance

**Incluye:**

- Registro e inicio de sesión con tres roles: aprendiz/instructor, técnico y coordinador.
- Creación de tickets con categoría, ambiente, prioridad y descripción.
- Atención de la falla por un técnico, que queda como responsable, y resolución con la
  solución documentada.
- Bitácora automática e inalterable de todo lo que le ocurre al ticket.
- Cálculo de la fecha de vencimiento según la categoría y alerta visual de incumplimiento.
- Tablero con indicadores: tickets por estado, tiempos promedio, cumplimiento de SLA y
  ambientes con más reportes.
- Funcionamiento en navegador web y en dispositivos Android.

**No incluye (queda como trabajo futuro):**

- Notificaciones por correo o push.
- Inventario detallado de equipos con hoja de vida por activo.
- Reportes exportables a PDF o Excel.
- Integración con el sistema de información institucional (SofíaPlus).
- Aplicación nativa publicada en tiendas.

## 1.6 Metodología

Se aplica un enfoque incremental basado en las fases del proyecto formativo:

| Fase | Actividades | Evidencia |
|---|---|---|
| Análisis | Observación del proceso actual, entrevista al personal de soporte, definición de requisitos | Documento de requisitos, historias de usuario |
| Planeación | Modelo entidad-relación, diseño de interfaces, cronograma | Diagrama ER, mockups, cronograma |
| Ejecución | Desarrollo por módulos: autenticación → tickets → atención → indicadores | Código fuente, aplicación desplegada |
| Evaluación | Ejecución de casos de prueba, ajustes y sustentación | Matriz de pruebas, acta de sustentación |

## 1.7 Recursos

| Tipo | Detalle | Costo |
|---|---|---|
| Humano | 1 aprendiz desarrollador · 1 instructor asesor | — |
| Software | Expo, React Native, Supabase (plan gratuito), Visual Studio Code, Git | $0 |
| Hardware | Computador de desarrollo, teléfono Android para pruebas | Propio |
| Despliegue | Netlify o Vercel (plan gratuito) | $0 |
