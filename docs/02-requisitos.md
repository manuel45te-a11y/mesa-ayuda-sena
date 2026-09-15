# 2. Requisitos e historias de usuario

## 2.1 Actores del sistema

| Actor | Descripción | Rol en el sistema |
|---|---|---|
| Aprendiz / Instructor | Usa el ambiente de formación y detecta la falla | `aprendiz` |
| Técnico de soporte | Atiende y resuelve las incidencias | `tecnico` |
| Coordinador | Supervisa el servicio y administra los catálogos | `admin` |

## 2.2 Requisitos funcionales

| ID | Requisito | Prioridad |
|---|---|---|
| RF-01 | El sistema debe permitir el registro de usuarios con correo, contraseña, nombre, ficha y programa | Alta |
| RF-02 | El sistema debe autenticar al usuario y mantener su sesión iniciada | Alta |
| RF-03 | El sistema debe asignar el rol `aprendiz` por defecto a todo usuario nuevo | Alta |
| RF-04 | El sistema debe permitir crear un ticket con título, descripción, categoría, ambiente y prioridad | Alta |
| RF-05 | El sistema debe generar un código único consecutivo por ticket (formato `MA-AAAA-NNNN`) | Media |
| RF-06 | El sistema debe calcular automáticamente la fecha de vencimiento según el tiempo de atención definido para la categoría | Alta |
| RF-07 | El sistema debe listar los tickets con filtros por estado y por propiedad (míos / pendientes / todos) | Alta |
| RF-08 | El técnico debe poder atender una falla pendiente, quedando como responsable y pasándola a *en proceso* | Alta |
| RF-09 | El sistema debe permitir únicamente las transiciones de estado válidas del flujo definido | Alta |
| RF-10 | El técnico debe registrar obligatoriamente la solución aplicada al marcar una falla como resuelta | Alta |
| RF-11 | El sistema debe registrar automáticamente en una bitácora cada cambio de estado, con su autor y fecha | Alta |
| RF-12 | El equipo de soporte debe poder cancelar un ticket que no procede | Media |
| RF-13 | El sistema debe señalar visualmente los tickets que superaron su tiempo de atención | Alta |
| RF-14 | El coordinador debe visualizar indicadores: tickets por estado, tiempos promedio, cumplimiento del tiempo de atención y ambientes con más reportes | Alta |
| RF-15 | El sistema debe restringir la información visible según el rol del usuario | Alta |
| RF-16 | El coordinador debe poder administrar el catálogo de ambientes y categorías | Baja |

## 2.3 Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | La aplicación debe funcionar en navegador web y en dispositivos Android desde un mismo código fuente |
| RNF-02 | Las contraseñas nunca se almacenan en la base de datos del proyecto; las gestiona el servicio de autenticación de Supabase |
| RNF-03 | El acceso a los datos se controla con políticas de seguridad a nivel de fila (RLS), no solo desde la interfaz |
| RNF-04 | La bitácora del ticket es generada por la base de datos y no puede ser modificada desde la aplicación |
| RNF-05 | Las pantallas deben adaptarse a resoluciones desde 360 px de ancho |
| RNF-06 | Los textos de la interfaz están en español y las fechas en formato local (es-CO) |
| RNF-07 | El tiempo de respuesta de las consultas de listado no debe superar 3 segundos con 500 tickets |
| RNF-08 | Los mensajes de error deben ser comprensibles para un usuario sin conocimientos técnicos |

## 2.4 Historias de usuario

### Épica 1 · Acceso al sistema

**HU-01 · Registro**
Como aprendiz, quiero crear una cuenta con mi correo institucional para poder reportar
fallas de los ambientes.
*Criterios de aceptación:*
- El formulario pide nombre, correo y contraseña como obligatorios; ficha, programa y
  teléfono como opcionales.
- La contraseña debe tener mínimo 6 caracteres.
- Al registrarme, el sistema crea mi perfil con rol `aprendiz`.
- Si el correo ya existe, se muestra un mensaje claro y no se crea otra cuenta.

**HU-02 · Inicio de sesión**
Como usuario registrado, quiero iniciar sesión para acceder a mis tickets.
*Criterios de aceptación:*
- Con credenciales correctas entro a la pantalla de inicio.
- Con credenciales incorrectas veo "Correo o contraseña incorrectos".
- Si cierro y abro la aplicación, mi sesión sigue activa.

### Épica 2 · Reporte de fallas

**HU-03 · Crear ticket**
Como instructor, quiero reportar que el videobeam del ambiente no funciona para que soporte
lo repare antes de mi próxima sesión.
*Criterios de aceptación:*
- Selecciono categoría, ambiente y prioridad de listas precargadas.
- El título exige mínimo 5 caracteres y la descripción mínimo 10.
- Al guardar, el ticket recibe un código consecutivo y queda en estado `abierto`.
- El sistema me muestra el tiempo de atención comprometido para esa categoría.

**HU-04 · Consultar mis tickets**
Como aprendiz, quiero ver el estado de los tickets que he reportado para saber si ya los
atendieron.
*Criterios de aceptación:*
- Veo únicamente los tickets que yo reporté.
- Cada tarjeta muestra código, estado, prioridad, ambiente y tiempo restante.
- Puedo filtrar por estado.

### Épica 3 · Atención

**HU-05 · Atender una falla**
Como técnico, quiero tomar una falla pendiente para que quede claro que yo la estoy
atendiendo.
*Criterios de aceptación:*
- Veo las fallas sin atender además de las mías.
- Con una sola acción quedo como responsable y el estado pasa a `en proceso`.
- La bitácora registra el cambio con fecha, hora y autor.
- Otro técnico que abra esa falla ve quién la está atendiendo y ya no puede tomarla.

**HU-06 · Resolver una falla**
Como técnico, quiero registrar qué hice para solucionarla para que quede documentado.
*Criterios de aceptación:*
- Solo puedo marcar como resuelta una falla que esté en proceso y sea mía.
- La descripción de la solución es obligatoria (mínimo 10 caracteres).
- Al resolver, el sistema guarda la fecha de resolución automáticamente.
- El ticket queda cerrado: no admite más cambios de estado.

### Épica 4 · Medición

**HU-07 · Cancelar un ticket**
Como técnico, quiero cancelar un reporte que no procede —está duplicado o no es una falla
real— para que no ensucie los indicadores.
*Criterios de aceptación:*
- Puedo cancelar una falla mientras no esté resuelta.
- El ticket cancelado deja de contar como pendiente.
- La bitácora conserva el registro de la cancelación.

**HU-08 · Tablero de indicadores**
Como coordinador, quiero ver el desempeño del servicio para tomar decisiones sobre el
mantenimiento de los ambientes.
*Criterios de aceptación:*
- Veo el total de tickets, los pendientes y los que están fuera del tiempo acordado.
- Veo el tiempo promedio de primera respuesta y de resolución.
- Veo el porcentaje de cumplimiento del tiempo de atención.
- Veo cuáles ambientes concentran más reportes.

## 2.5 Matriz de trazabilidad

| Historia | Requisitos | Pantalla | Tabla principal |
|---|---|---|---|
| HU-01 | RF-01, RF-03 | RegistroScreen | `perfiles` |
| HU-02 | RF-02 | LoginScreen | `auth.users` |
| HU-03 | RF-04, RF-05, RF-06 | NuevoTicketScreen | `tickets` |
| HU-04 | RF-07, RF-13, RF-15 | TicketsScreen | `v_tickets_detalle` |
| HU-05 | RF-08, RF-09, RF-11 | TicketDetalleScreen | `tickets`, `ticket_eventos` |
| HU-06 | RF-09, RF-10, RF-11 | TicketDetalleScreen | `tickets` |
| HU-07 | RF-12 | TicketDetalleScreen | `tickets` |
| HU-08 | RF-14 | DashboardScreen | `v_indicadores` |
