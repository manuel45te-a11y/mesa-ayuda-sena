# 5. Plan de pruebas

## 5.0 Pruebas unitarias automatizadas

Además de las pruebas manuales de las secciones siguientes, el proyecto tiene una batería
de **63 pruebas unitarias** sobre la lógica de negocio, escritas con **Jest**. Se ejecutan
con:

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
| `src/__tests__/theme.test.js` | Que los estados y las transiciones del flujo sean coherentes: que no haya transiciones a estados inexistentes, que *resuelto* y *cancelado* sean finales y que no se pueda saltar de *pendiente* a *resuelto* sin atender | 10 |
| `src/lib/__tests__/formato.test.js` | Cálculo del tiempo de atención (vencido, en plazo, progreso), fechas relativas y formato de horas | 16 |
| `src/lib/__tests__/demo.test.js` | Ciclo de vida completo del ticket: creación con código consecutivo, cálculo del vencimiento por categoría, cambios de estado, bitácora e indicadores | 21 |
| `src/lib/__tests__/sesion.test.js` | Caducidad de la sesión a los 30 días: que no se reinicie al reabrir la aplicación, que venza en su momento y que se limpie al cerrar sesión | 8 |
| `src/lib/__tests__/datos.test.js` | Que la capa de acceso a datos enrute bien y que en modo demostración **no haga ni una llamada de red** | 8 |

### Resultado de la última ejecución

```
Test Suites: 5 passed, 5 total
Tests:       63 passed, 63 total

File          | % Stmts | % Branch | % Funcs | % Lines
--------------|---------|----------|---------|--------
All files     |   88.97 |   56.84  |   97.26 |  88.88
  theme.js    |     100 |     100  |     100 |    100
  demo.js     |     100 |   82.85  |     100 |    100
  formato.js  |      90 |    87.5  |     100 |  91.89
  sesion.js   |   83.33 |     100  |     100 |  81.81
```

Las líneas sin cubrir de `datos.js` corresponden a las ramas que hablan con Supabase: esas
se validan con las pruebas de integración manuales de las secciones 5.1 y 5.2, porque
dependen de la base de datos real y de sus políticas de seguridad.

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
| Aprendiz | aprendiz@prueba.com | `aprendiz` |
| Técnico | tecnico@prueba.com | `tecnico` |
| Coordinador | coordinador@prueba.com | `admin` |

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
| P-12 | Atender una falla | Con el técnico, presionar *Atender esta falla* | Estado pasa a `en_proceso`, aparece el nombre del técnico y se registra `atendido_at` | ☐ |
| P-13 | Resolver sin solución | Marcar como resuelto con el campo vacío | Mensaje de validación, no cambia el estado | ☐ |
| P-14 | Resolver con solución | Describir la solución y marcar como resuelto | Estado `resuelto`, se guarda la solución y `resuelto_at` | ☐ |
| P-15 | Ticket terminado | Abrir un ticket resuelto | No se muestran acciones de soporte: no admite más cambios | ☐ |
| P-16 | Cancelar un ticket | Cancelar una falla pendiente | Estado `cancelado`, deja de contar en pendientes y en el cumplimiento | ☐ |
| P-17 | Bitácora completa | Abrir el historial de un ticket resuelto | Aparecen en orden: falla reportada, pendiente → en proceso y en proceso → resuelto, con autor y fecha | ☐ |
| P-18 | Indicador de tiempo vencido | Crear un ticket y cambiar `vence_at` a una fecha pasada desde el SQL Editor | La tarjeta muestra "Vencido hace …" en rojo y suma en *Fuera de SLA* | ☐ |
| P-19 | Tablero | Entrar como coordinador a *Tablero* | Se muestran totales, promedios, cumplimiento y ambientes | ☐ |
| P-20 | Filtros de la lista | Cambiar entre Pendientes / Míos / Resueltos / Todos | La lista se actualiza según el filtro | ☐ |

## 5.2 Pruebas de seguridad (RLS)

Estas son las más valiosas para la sustentación, porque demuestran que la seguridad está en
la base de datos y no solo en la interfaz.

| # | Caso | Pasos | Resultado esperado | ✔ |
|---|---|---|---|---|
| S-01 | Aislamiento entre aprendices | Con el aprendiz A crear un ticket. Entrar con un aprendiz B | B no ve el ticket de A en ningún filtro | ☐ |
| S-02 | Acceso directo por URL/ID | Como aprendiz B, abrir el detalle del ticket de A usando su id | "No se encontró el ticket o no tienes permiso para verlo" | ☐ |
| S-03 | Visibilidad del técnico | Con el técnico, revisar el filtro *Sin atender* | Ve las fallas que nadie ha tomado y las suyas | ☐ |
| S-04 | Pestaña de tablero | Entrar como aprendiz y como técnico | La pestaña *Tablero* no aparece; solo la ve el coordinador | ☐ |
| S-05 | Escritura no autorizada | Como aprendiz, intentar cambiar el estado de un ticket ajeno desde la API | La operación es rechazada por la política RLS | ☐ |
| S-06 | Bitácora inalterable | Intentar borrar un registro de `ticket_eventos` desde la aplicación | No existe operación de borrado y la política no lo permite | ☐ |

## 5.3 Pruebas de interfaz

| # | Caso | Resultado esperado | ✔ |
|---|---|---|---|
| I-01 | Web en pantalla de 1366 px | El contenido se centra con ancho máximo, sin desbordes | ☐ |
| I-02 | Móvil de 360 px | Los textos no se cortan, los botones son presionables | ☐ |
| I-03 | Listas vacías | Se muestra un mensaje explicativo, no una pantalla en blanco | ☐ |
| I-04 | Estados de carga | Mientras carga se ve el indicador, nunca datos a medias | ☐ |
| I-05 | Errores del servidor | Se muestran en un aviso legible, la app no se cierra | ☐ |

## 5.4 Registro de defectos encontrados

| # | Descripción | Severidad | Estado | Corrección aplicada |
|---|---|---|---|---|
| D-01 | | | | |
| D-02 | | | | |

> Deja esta tabla en el documento aunque encuentres pocos defectos: mostrar que probaste,
> encontraste y corregiste es parte de lo que se evalúa.
