# Mesa de Ayuda SENA

Sistema de gestión de incidencias (tickets) para los ambientes de formación de un centro
del SENA. Un aprendiz o instructor reporta una falla, el equipo de soporte la atiende y el
sistema mide cuánto se demoró frente al tiempo acordado (SLA).

Proyecto formativo · Aplicación web y móvil con **Expo (React Native)** + **Supabase**.

---

## Cómo ponerlo a funcionar

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto nuevo (plan gratuito).
2. Ve a **SQL Editor → New query**, pega todo el contenido de
   [`supabase/instalar-todo.sql`](supabase/instalar-todo.sql) y presiona **Run**. Ese
   archivo crea el esquema completo, carga los ambientes y las categorías y aplica los
   roles.
   **Si tu base ya existía y tiene datos, no uses ese archivo:** pega solo
   [`supabase/roles-y-asignacion.sql`](supabase/roles-y-asignacion.sql), que agrega lo que
   falta sin borrar nada y se puede ejecutar varias veces.
3. En **Authentication → Sign In / Providers → Email**, activa *Allow new users to sign up*
   y desactiva *Confirm email* mientras desarrollas.

### 2. Configurar las credenciales

Copia `.env.example` como `.env` y pega los datos de **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

La `anon key` es pública por diseño: la seguridad real la dan las políticas RLS del esquema.

### 3. Instalar y ejecutar

```bash
npm install
npm run web
```

Para móvil: `npm start` y escanea el QR con la app **Expo Go**.

### 4. Ejecutar las pruebas

```bash
npm test
```

144 pruebas unitarias sobre la lógica de negocio (flujo del ticket, roles y permisos,
asignación, evidencias, cálculo del tiempo de atención, caducidad de la sesión, capa de
datos y rutas de la aplicación). Detalle en [`docs/05-pruebas.md`](docs/05-pruebas.md).

### 5. Nombrar administradores y asignar roles

Toda cuenta nueva nace como **Usuario / Aprendiz**: nadie elige su rol al registrarse.

1. Regístrate desde la app con tu correo.
2. Abre [`supabase/roles-y-asignacion.sql`](supabase/roles-y-asignacion.sql), escribe tu
   correo en la sección 10 (`v_correos_admin`; puedes poner varios separados por coma) y
   ejecútalo en el SQL Editor.
3. Entra a la app como administrador y, en la pantalla **Usuarios**, asigna el rol de
   técnico o administrador a las demás personas.

---

## Verificación del correo

Al registrarse, la aplicación no abre sesión: Supabase manda un enlace de verificación y la
cuenta queda en *Waiting for verification* hasta que se abre. La app muestra una pantalla
explicándolo, con la opción de reenviar el correo, y en el acceso ofrece reenviarlo si
alguien intenta entrar sin haber confirmado.

Para que funcione hay tres ajustes en el panel de Supabase:

| Dónde | Ajuste | Valor |
|---|---|---|
| Authentication → Sign In / Providers → Email | **Confirm email** | Activado |
| Authentication → Sign In / Providers → Email | **Allow new users to sign up** | Activado |
| Authentication → URL Configuration | **Site URL** | `http://localhost:8081` en desarrollo; la URL pública al desplegar |

La *Site URL* importa: es a donde lleva el enlace del correo. Si queda en el valor por
defecto (`localhost:3000`), el usuario confirma pero aterriza en una página que no existe.

> **Límite del correo integrado.** El servidor de correo que trae Supabase es solo para
> pruebas: envía muy pocos mensajes por hora y no garantiza la entrega a direcciones ajenas
> al equipo del proyecto. Para una demostración con varios usuarios hay que configurar un
> SMTP propio en *Project Settings → Authentication → SMTP Settings* (Resend, Brevo o
> incluso Gmail sirven, y tienen plan gratuito). Sin eso, los correos de verificación se
> quedan sin enviar y nadie podrá entrar.

## Modo demostración

En la pantalla de acceso hay un botón **"Entrar sin cuenta"**. Recorre la aplicación
completa con seis tickets de ejemplo —uno por cada estado, incluidos dos vencidos— sin
tocar Supabase y sin necesidad de conexión.

Los datos viven en memoria ([`src/lib/demo.js`](src/lib/demo.js)) y se guardan en el
navegador. Se puede reportar una falla, asignarla, subir la evidencia y cerrarla: la
bitácora, los tiempos y los permisos siguen las mismas reglas que la base de datos.

Con el selector **Cambiar de rol** (en la barra lateral o en el perfil) se pasa en un clic
de administrador a técnico o a usuario, para mostrar lo que ve y puede hacer cada uno. Las
evidencias se pueden subir con una foto real o con **Usar foto de ejemplo**, que funciona
sin internet.

Sirve para dos cosas: revisar la interfaz sin haber configurado nada, y tener un plan B
en la sustentación si falla el internet del centro. Mientras está activo, una cinta ámbar
avisa en todas las pantallas de que los datos son de ejemplo.

## Roles y qué puede hacer cada uno

| Acción | Usuario / Aprendiz | Técnico | Administrador |
|---|:--:|:--:|:--:|
| Reportar una falla | ✅ | ✅ | ✅ |
| Ver sus propias solicitudes y sus evidencias | ✅ | ✅ | ✅ |
| Ver las solicitudes sin asignar | — | ✅ | ✅ |
| Ver todas las solicitudes | — | — | ✅ |
| Asignar o reasignar un técnico | — | — | ✅ |
| Tomar una solicitud sin asignar | — | ✅ | — |
| Subir evidencias (foto y nota) | — | Si está asignado | ✅ |
| Cerrar con solución y evidencia | — | Si está asignado | ✅ |
| Cancelar una solicitud | — | — | ✅ |
| Tablero de indicadores | — | — | ✅ |
| Asignar roles a las cuentas | — | — | ✅ |

Estas reglas no están solo en la app: las exige la base de datos
([`roles-y-asignacion.sql`](supabase/roles-y-asignacion.sql)), así que tampoco se pueden
saltar llamando directamente a la API de Supabase.

---

## Rutas de la aplicación

Cada pantalla tiene su propia dirección. En la web eso significa que se puede recargar sin
perder la página, usar atrás y adelante del navegador y compartir el enlace de una solicitud.

| Dirección | Pantalla | Quién entra |
|---|---|---|
| `/` | Inicio | Con sesión |
| `/solicitudes` | Lista de solicitudes | Con sesión |
| `/solicitudes?filtro=vencidos&buscar=aire` | La lista con filtro y búsqueda | Con sesión |
| `/solicitudes/nueva` | Reportar una falla | Con sesión |
| `/solicitudes/MA-2026-0004` | Detalle de una solicitud | Con sesión y permiso para verla (RLS) |
| `/tablero` | Tablero de indicadores | Solo el administrador |
| `/usuarios` | Roles de las cuentas | Solo el administrador |
| `/perfil` | Mi perfil | Con sesión |
| `/ingresar` | Iniciar sesión | Sin sesión |
| `/registro` | Crear cuenta | Sin sesión |
| `/recuperar-clave` | Recuperar la contraseña | Sin sesión |
| Cualquier otra | Página no encontrada | Todos |

Cómo se comporta:

- **Enlace abierto sin sesión.** Quien abre `/solicitudes/MA-2026-0004` sin haber entrado ve
  el acceso y, al iniciar sesión (o al entrar en modo demostración), llega a esa solicitud.
- **Página restringida.** Si un usuario o un técnico abre `/tablero` o `/usuarios`, ve el
  aviso *No tienes acceso a esta página* y esas pestañas no aparecen en su menú. Los datos los sigue protegiendo RLS; el
  aviso es para que la persona entienda qué pasó.
- **Código en minúscula.** `/solicitudes/ma-2026-0004` también funciona y la dirección se
  corrige a mayúscula.
- **Volver.** Una solicitud abierta desde un enlace tiene la lista de solicitudes detrás.
- **Título de la pestaña del navegador.** Cambia con la pantalla, por ejemplo
  *Solicitud MA-2026-0004 · Mesa de Ayuda*.
- **Enlaces de verdad.** Las tarjetas y el menú son enlaces: Ctrl+clic los abre en otra
  pestaña.

Todo sale de un solo archivo, [`src/navigation/rutas.js`](src/navigation/rutas.js): la
dirección, el título y los roles de cada pantalla. Para agregar una pantalla hay que
registrarla ahí y en `RootNavigator.js`. Para restringirla por rol, se le ponen `roles` en
`rutas.js` y se envuelve con `conPermiso`, como el Tablero.

**Al desplegar.** El servidor tiene que devolver la app para cualquier dirección, no solo para
`/`; en Vercel eso lo hace la regla `rewrites` de [`vercel.json`](vercel.json).

**En el celular.** La app instalada abre enlaces `mesaayuda://solicitudes/MA-2026-0004`
(el esquema está en `app.json`). En Expo Go no aplican, porque Expo Go usa sus propias
direcciones `exp://`.

---

## Ciclo de vida del ticket

```
pendiente ──(asignar técnico)──> en_proceso ──(evidencia + solución)──> resuelto
    │                                 │
    └─────────────(solo el administrador)──────────────────────────> cancelado
```

1. **El usuario reporta** la falla: queda `pendiente` y sin técnico.
2. **El administrador asigna** un técnico (o un técnico **toma** una solicitud sin asignar):
   pasa a `en_proceso` y se guarda la fecha de atención. Reasignar después no la cambia.
3. **El técnico sube evidencias**: una foto del arreglo y una nota. La foto se reduce a
   1280 px antes de guardarse.
4. **El técnico cierra** la solicitud describiendo la solución (mínimo 10 caracteres). Sin al
   menos una evidencia la base de datos no deja cerrarla.

Todo queda en la bitácora (`ticket_eventos`) mediante *triggers*: la creación, cada
asignación («Asignada a…», «Reasignada de… a…»), cada evidencia con su nota y cada cambio
de estado, con quién lo hizo y cuándo. Desde la app nadie puede escribir ni alterar ese
historial.

---

## El tiempo de atención

Cada categoría de falla tiene un tiempo acordado en horas (`sla_horas`) y, al crear el
ticket, un *trigger* calcula su fecha de vencimiento sumándolo a la fecha del reporte.

| Categoría | Tiempo de atención |
|---|---|
| Red e internet | 4 h |
| Eléctrico | 4 h |
| Video y proyección | 6 h |
| Equipos de cómputo | 8 h |
| Software / Climatización | 24 h |
| Mobiliario | 48 h |

La prioridad (baja, media, alta) sirve para ordenar el trabajo del técnico, pero no altera
el reloj: el tiempo depende del tipo de falla, que es lo que el centro puede comprometer.

Con eso el sistema responde la pregunta que le interesa al coordinador: **¿qué porcentaje
de las fallas se atendió dentro del tiempo comprometido?**

---

## Estructura del proyecto

```
mesa-ayuda-sena/
├── App.js                     Punto de entrada
├── jest.config.js             Configuración de las pruebas
├── supabase/
│   ├── instalar-todo.sql      Los cuatro de abajo en un solo pegado (base nueva)
│   ├── 00-limpiar.sql         Borra el esquema anterior (solo si ya existía)
│   ├── schema.sql             Tablas, triggers, vistas y políticas RLS
│   ├── seed.sql               Ambientes y categorías
│   ├── roles-y-asignacion.sql Roles, asignación, evidencias y seguridad
│   │                          (en una base existente se ejecuta solo este)
│   └── datos-prueba.sql       Seis tickets de ejemplo
├── src/
│   ├── lib/
│   │   ├── supabase.js        Cliente de Supabase
│   │   ├── datos.js           Capa de acceso: decide entre base real y demo
│   │   ├── demo.js            Modo demostración, con las mismas reglas de la base
│   │   ├── fotos.js           Elegir la foto de la evidencia y reducirla
│   │   ├── fotosEjemplo.js    Fotos embebidas para la demostración
│   │   ├── errores.js         Mensajes de Supabase en español
│   │   ├── sesion.js          Caducidad de la sesión a los 30 días
│   │   ├── formato.js         Fechas, tiempos y textos
│   │   └── __tests__/         Pruebas unitarias de la lógica
│   ├── context/AuthContext.js Sesión, perfil y rol del usuario
│   ├── theme.js               Colores, estados, prioridades, transiciones
│   ├── components/            Icono y logotipo, ui.js, Pantalla,
│   │                          TarjetaTicket, Graficos (SVG),
│   │                          Protegida (pantallas restringidas por rol)
│   ├── navigation/
│   │   ├── rutas.js           Dirección, título y roles de cada pantalla
│   │   ├── RootNavigator.js   Pantallas según la sesión, enlaces web
│   │   └── Barras.js          Barra lateral en escritorio, pestañas en móvil
│   ├── screens/               Login, Registro, RecuperarClave, Inicio,
│   │                          Tickets, Nuevo, Detalle, Tablero, Usuarios,
│   │                          Perfil, NoEncontrada
│   └── __tests__/             Pruebas del sistema de diseño y el flujo
└── docs/                      Documentación del proyecto formativo
```

## Documentación

| Archivo | Contenido |
|---|---|
| [`docs/01-anteproyecto.md`](docs/01-anteproyecto.md) | Problema, justificación, objetivos y alcance |
| [`docs/02-requisitos.md`](docs/02-requisitos.md) | Historias de usuario y requisitos |
| [`docs/03-modelo-datos.md`](docs/03-modelo-datos.md) | Diagrama entidad-relación y diccionario de datos |
| [`docs/04-casos-uso.md`](docs/04-casos-uso.md) | Casos de uso detallados |
| [`docs/05-pruebas.md`](docs/05-pruebas.md) | Casos de prueba para las evidencias |
| [`docs/06-trabajo-con-ia.md`](docs/06-trabajo-con-ia.md) | Cómo repartir el trabajo entre Claude, ChatGPT y Gemini |
