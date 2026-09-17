# 5. Plan de pruebas

## 5.0 Pruebas unitarias automatizadas

Además de las pruebas manuales de las secciones siguientes, el proyecto tiene una batería
de **144 pruebas unitarias** sobre la lógica de negocio, los roles y las rutas, escritas con
**Jest**.
Se ejecutan con:

```bash
npm test
```

Para ver el porcentaje de código cubierto:

```bash
npx jest --coverage
```

### Qué se prueba

| Archivo de pruebas | Qué verifica | Pruebas |
|---|---|---|
| `src/__tests__/theme.test.js` | Que los estados y las transiciones del flujo sean coherentes: que no haya transiciones a estados inexistentes, que *resuelto* y *cancelado* sean finales y que no se pueda saltar de *pendiente* a *resuelto* sin atender | 11 |
| `src/lib/__tests__/formato.test.js` | Cálculo del tiempo de atención (vencido, en plazo, progreso), fechas relativas y formato de horas | 17 |
| `src/lib/__tests__/demo.test.js` | Ciclo de vida completo del ticket: creación con código consecutivo, cálculo del vencimiento por categoría, cambios de estado, bitácora, indicadores y búsqueda por código | 21 |
| `src/lib/__tests__/sesion.test.js` | Caducidad de la sesión a los 30 días: que no se reinicie al reabrir la aplicación, que venza en su momento y que se limpie al cerrar sesión | 8 |
| `src/lib/__tests__/datos.test.js` | Que la capa de acceso a datos enrute bien, que traiga una solicitud por su código, que asigne, suba evidencias, cierre, cancele y cambie roles, y que en modo demostración **no haga ni una llamada de red** | 13 |
| `src/lib/__tests__/roles.test.js` | Las reglas de los roles: quién asigna, que un técnico solo tome para sí, que reasignar no cambie la fecha de atención, que no se cierre sin evidencia ni con una solución corta, que solo el administrador cancele y cambie roles, y que nadie cambie su propio rol | 23 |
| `src/lib/__tests__/fotos.test.js` | Que la foto de la evidencia se reduzca a 1280 px conservando la proporción, su nombre final y que las fotos de ejemplo vayan embebidas | 7 |
| `src/lib/__tests__/errores.test.js` | Que los errores de Supabase lleguen en español: permisos, base sin actualizar y mensajes de las reglas | 5 |
| `src/navigation/__tests__/rutas.test.js` | Que cada dirección abra su pantalla y al revés, que el código de la solicitud se normalice, que los filtros viajen en la dirección, los permisos por rol, el título de la pestaña, el botón *Volver* sin historial y el Ctrl+clic en enlaces | 39 |

### Resultado de la última ejecución

```
Test Suites: 9 passed, 9 total
Tests:       144 passed, 144 total

File              | % Stmts | % Branch | % Funcs | % Lines
------------------|---------|----------|---------|--------
All files         |   74.95 |   51.76  |   85.71 |  76.17
  theme.js        |     100 |     100  |     100 |    100
  errores.js      |     100 |     100  |     100 |    100
  fotosEjemplo.js |     100 |     100  |     100 |    100
  rutas.js        |     100 |   93.93  |     100 |    100
  supabase.js     |     100 |      75  |     100 |    100
  formato.js      |      90 |    87.5  |     100 |  91.89
  demo.js         |   85.94 |   66.03  |   91.01 |  89.23
  sesion.js       |   83.33 |     100  |     100 |  81.81
  datos.js        |    40.7 |   16.21  |      75 |  42.15
  fotos.js        |   28.57 |   26.31  |      25 |  26.31
```

Las líneas sin cubrir de `datos.js` corresponden a las ramas que hablan con Supabase: esas
se validan con las pruebas de integración manuales de las secciones 5.1 y 5.2, porque
dependen de la base de datos real y de sus políticas de seguridad. Las de `fotos.js` abren
la cámara, la galería o el selector de archivos del navegador, así que se prueban a mano
(P-24).

**Tres pruebas que vale la pena mencionar en la sustentación**, porque verifican reglas del
negocio y no solo código:

- *"no se puede saltar de pendiente a resuelto sin atender"* — el flujo no admite atajos.
- *"no cambia el vencimiento según la prioridad"* — deja documentada la decisión de que el
  tiempo lo define la categoría, no la urgencia percibida.
- *"no reinicia el plazo al volver a abrir la aplicación"* — los 30 días se cuentan desde el
  primer ingreso, que es justo el error fácil de cometer en este tipo de control.

---

## Pruebas manuales

Ejecuta estos casos con los tres usuarios de prueba y toma captura de pantalla de cada
resultado: esas capturas son la evidencia de la fase de evaluación.

**Usuarios sugeridos**

| Usuario | Correo | Rol |
|---|---|---|
| Usuario / Aprendiz | aprendiz@prueba.com | `aprendiz` |
| Técnico | tecnico@prueba.com | `tecnico` |
| Administrador | coordinador@prueba.com | `admin` |

Todos se registran desde la app. El administrador se nombra en la sección 10 de
`supabase/roles-y-asignacion.sql` y él asigna el rol de técnico desde la pantalla *Usuarios*.

---

## 5.1 Pruebas funcionales

| # | Caso | Pasos | Resultado esperado | ✔ |
|---|---|---|---|---|
| P-01 | Registro válido | Registrarse con nombre, correo nuevo y contraseña de 8 caracteres | Cuenta creada, perfil con rol `aprendiz` | ☐ |
| P-02 | Registro con contraseña corta | Usar contraseña de 4 caracteres | Mensaje de validación, no se crea la cuenta | ☐ |
| P-03 | Registro con correo repetido | Registrar dos veces el mismo correo | Mensaje de error, no se duplica el usuario | ☐ |
| P-04 | Login correcto | Entrar con credenciales válidas | Acceso a la pantalla de inicio con el nombre del usuario | ☐ |
| P-05 | Login incorrecto | Entrar con contraseña equivocada | "Correo o contraseña incorrectos" | ☐ |
| P-06 | Sesión persistente | Cerrar y volver a abrir la app | La sesión sigue activa | ☐ |
| P-07 | Crear ticket válido | Reportar una falla completa con prioridad media | Ticket creado con código `MA-AAAA-NNNN` en estado abierto | ☐ |
| P-08 | Validación de título | Escribir un título de 3 caracteres | Mensaje de validación, no se guarda | ☐ |
| P-09 | Validación de descripción | Escribir una descripción de 5 caracteres | Mensaje de validación, no se guarda | ☐ |
| P-10 | Cálculo del tiempo de atención | Crear un ticket de categoría "Red e internet" (4 h) | La fecha de vencimiento queda 4 horas después del reporte | ☐ |
| P-11 | La prioridad no altera el reloj | Crear dos tickets de la misma categoría con prioridad baja y alta | Ambos vencen a la misma hora | ☐ |
| P-12 | Asignar un técnico | Como administrador, abrir una solicitud pendiente, elegir un técnico y presionar *Asignar* | Estado `en_proceso`, aparece el técnico responsable, se registra `atendido_at` y la bitácora dice "Asignada a …" | ☐ |
| P-13 | Cerrar sin evidencia | Como técnico asignado, intentar cerrar sin haber subido evidencias | El botón no se habilita y el mensaje pide adjuntar al menos una evidencia | ☐ |
| P-14 | Cerrar con evidencia | Subir una foto con su nota, escribir la solución y presionar *Cerrar como resuelta* | Estado `resuelto`, se guardan la solución y `resuelto_at`; la bitácora muestra la evidencia y el cierre | ☐ |
| P-15 | Ticket terminado | Abrir un ticket resuelto | No se muestran acciones: no admite más cambios | ☐ |
| P-16 | Cancelar un ticket | Como administrador, cancelar una falla pendiente y confirmar | Estado `cancelado`, deja de contar en pendientes y en el cumplimiento | ☐ |
| P-17 | Bitácora completa | Abrir el historial de un ticket resuelto | Aparecen en orden: falla reportada, asignación, evidencia y en proceso → resuelto, con autor y fecha | ☐ |
| P-18 | Indicador de tiempo vencido | Crear un ticket y cambiar `vence_at` a una fecha pasada desde el SQL Editor | La tarjeta muestra "Vencido hace …" en rojo y suma en *Fuera de SLA* | ☐ |
| P-19 | Tablero | Entrar como administrador a *Tablero* | Se muestran totales, promedios, cumplimiento y ambientes | ☐ |
| P-20 | Filtros de la lista | Cambiar entre los filtros de cada rol | La lista se actualiza según el filtro | ☐ |
| P-21 | Tomar una solicitud | Como técnico, abrir una solicitud sin asignar y presionar *Tomar esta solicitud* | Queda como responsable y la solicitud pasa a `en_proceso` | ☐ |
| P-22 | Reasignar | Como administrador, reasignar una solicitud en proceso a otro técnico | Cambia el responsable, `atendido_at` no cambia y la bitácora dice "Reasignada de … a …" | ☐ |
| P-23 | Solución corta | Cerrar con una solución de menos de 10 caracteres | Mensaje de validación, no cambia el estado | ☐ |
| P-24 | Foto real de evidencia | Subir una foto tomada con el celular (o una grande en la web) | Se ve la miniatura, se guarda reducida (máximo 1280 px) y se puede ampliar | ☐ |
| P-25 | Registro sin elegir rol | Crear una cuenta nueva | El formulario no pide rol y la cuenta queda como Usuario / Aprendiz | ☐ |
| P-26 | Asignar roles | Como administrador, en *Usuarios*, cambiar a alguien a técnico y a otro a administrador (con confirmación) | El rol cambia y la persona ve las pantallas de su nuevo rol al volver a entrar | ☐ |

## 5.2 Pruebas de seguridad (RLS)

Estas son las más valiosas para la sustentación, porque demuestran que la seguridad está en
la base de datos y no solo en la interfaz.

| # | Caso | Pasos | Resultado esperado | ✔ |
|---|---|---|---|---|
| S-01 | Aislamiento entre aprendices | Con el aprendiz A crear un ticket. Entrar con un aprendiz B | B no ve el ticket de A en ningún filtro | ☐ |
| S-02 | Acceso directo por dirección | Como aprendiz B, abrir `/solicitudes/<código del ticket de A>` en el navegador | "No se encontró la solicitud o tu rol no tiene permiso para verla" | ☐ |
| S-03 | Visibilidad del técnico | Con el técnico, revisar el filtro *Sin asignar* | Ve las fallas que nadie ha tomado y las suyas | ☐ |
| S-04 | Pantallas del administrador | Entrar como aprendiz y como técnico | Las pestañas *Tablero* y *Usuarios* no aparecen, y abrir `/tablero` o `/usuarios` muestra "No tienes acceso a esta página" | ☐ |
| S-05 | Escritura no autorizada | Como aprendiz, intentar cambiar el estado de un ticket ajeno desde la API | La operación es rechazada por la política RLS | ☐ |
| S-06 | Bitácora inalterable | Intentar insertar o borrar un registro de `ticket_eventos` desde la API | Rechazado: no hay políticas de insert ni de delete; solo escriben los triggers | ☐ |
| S-07 | Registrarse como administrador | Llamar a `signUp` de Supabase enviando `rol: 'admin'` en los datos del usuario | La cuenta se crea como `aprendiz`: el trigger ignora el rol que manda la app | ☐ |
| S-08 | Subirse de rol | Como aprendiz, actualizar su propio perfil con `rol = 'admin'` desde la API | Error "Solo el administrador puede cambiar el rol de una cuenta" | ☐ |
| S-09 | Lectura sin sesión | Consultar `v_tickets_detalle` con la llave pública y sin iniciar sesión | No devuelve solicitudes: la vista respeta RLS (`security_invoker`) | ☐ |
| S-10 | Evidencia ajena | Como técnico no asignado, insertar una evidencia en una solicitud de otro técnico | Rechazado por la política de `ticket_adjuntos` | ☐ |
| S-11 | Cancelar sin ser administrador | Como técnico, cambiar el estado de su solicitud a `cancelado` desde la API | Error "Solo el administrador puede cancelar una solicitud" | ☐ |

## 5.3 Pruebas de interfaz

| # | Caso | Resultado esperado | ✔ |
|---|---|---|---|
| I-01 | Web en pantalla de 1366 px | El contenido se centra con ancho máximo, sin desbordes | ☐ |
| I-02 | Móvil de 360 px | Los textos no se cortan, los botones son presionables | ☐ |
| I-03 | Listas vacías | Se muestra un mensaje explicativo, no una pantalla en blanco | ☐ |
| I-04 | Estados de carga | Mientras carga se ve el indicador, nunca datos a medias | ☐ |
| I-05 | Errores del servidor | Se muestran en un aviso legible, la app no se cierra | ☐ |

## 5.4 Pruebas de rutas (versión web)

Se hacen en el navegador, con la aplicación corriendo (`npm run web`) o con la versión
desplegada.

| # | Caso | Pasos | Resultado esperado | ✔ |
|---|---|---|---|---|
| R-01 | Dirección propia por pantalla | Recorrer Inicio, Solicitudes, Tablero y Perfil desde el menú | La barra de direcciones muestra `/`, `/solicitudes`, `/tablero` y `/perfil`, y el título de la pestaña cambia | ☐ |
| R-02 | Recargar sin perder la página | En Solicitudes elegir el filtro *Vencidos*, buscar "aire" y recargar (F5) | La lista sigue filtrada y el buscador conserva "aire" | ☐ |
| R-03 | Atrás y adelante del navegador | Abrir una solicitud desde la lista y usar atrás y adelante | Vuelve a la lista con el mismo filtro y luego regresa a la solicitud | ☐ |
| R-04 | Enlace abierto sin sesión | Cerrar sesión y abrir `/solicitudes/MA-2026-0001` | Aparece el acceso; al entrar se abre esa solicitud | ☐ |
| R-05 | Página restringida por rol | Como aprendiz, abrir `/tablero` | Aviso "No tienes acceso a esta página"; la pestaña Tablero no está en el menú | ☐ |
| R-06 | Dirección inexistente | Abrir `/esto/no/existe` | Página "Esta página no existe" con un botón para volver | ☐ |
| R-07 | Código escrito en minúscula | Abrir `/solicitudes/ma-2026-0001` | Se abre la solicitud y la dirección queda en mayúscula | ☐ |
| R-08 | Abrir en otra pestaña | Ctrl+clic sobre una tarjeta de solicitud | La solicitud se abre en otra pestaña del navegador | ☐ |

## 5.5 Registro de defectos encontrados

| # | Descripción | Severidad | Estado | Corrección aplicada |
|---|---|---|---|---|
| D-01 | En la web, la dirección no cambiaba al navegar: recargar devolvía al inicio, no se podía compartir el enlace de una solicitud y la pestaña del navegador decía "Login" en inglés | Media | Corregido | Rutas web con React Navigation: `src/navigation/rutas.js` |
| D-02 | Al pulsar *Volver* en la pantalla de nueva contraseña (abierta desde el correo) la pantalla podía quedarse igual, porque el contexto de sesión no se actualizaba al cancelar la recuperación | Media | Corregido | Se agregó la dependencia que faltaba en `AuthContext` y *Volver* cierra la sesión temporal del enlace |
| D-03 | El registro dejaba elegir el rol (incluido Administrador) y la base de datos lo aceptaba: cualquiera podía darse permisos de administrador | Crítica | Corregido | Se quitó el selector del registro y el trigger `fn_nuevo_usuario` ignora el rol que manda la app |
| D-04 | Un correo personal estaba fijo como administrador en el código y en la base de datos | Alta | Corregido | Los administradores se nombran en la sección 10 de `roles-y-asignacion.sql` y los demás roles desde la pantalla *Usuarios* |
| D-05 | Cualquier usuario podía cambiarse su propio rol actualizando su perfil desde la API | Crítica | Corregido | Trigger `fn_proteger_perfil`: solo el administrador cambia roles y nadie el suyo |
| D-06 | Las vistas (`v_tickets_detalle` y otras) se saltaban RLS: sin iniciar sesión se leían todas las solicitudes | Crítica | Corregido | `security_invoker = true` en las vistas y sin permisos para el rol anónimo |
| D-07 | Los registros de asignación y de evidencia que escribía la app en la bitácora no se guardaban (los bloqueaba RLS) y la nota de la evidencia se perdía | Media | Corregido | La bitácora la escriben triggers con el autor de cada cambio, y la nota se guarda en `ticket_adjuntos.descripcion` |
| D-08 | Reasignar una solicitud reescribía la fecha de primera atención y alteraba el tiempo de respuesta del tablero | Media | Corregido | La base de datos conserva `atendido_at` y la app ya no la envía |
| D-09 | En el celular, el botón de subir evidencia ponía una foto de internet en lugar de una foto real | Alta | Corregido | Selector de cámara y galería (`expo-image-picker`) y reducción de la foto antes de guardarla |
| D-10 | | | | |

> Deja esta tabla en el documento aunque encuentres pocos defectos: mostrar que probaste,
> encontraste y corregiste es parte de lo que se evalúa.
