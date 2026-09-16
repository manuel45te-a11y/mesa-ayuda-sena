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
   archivo crea el esquema completo y carga los ambientes y las categorías.
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

63 pruebas unitarias sobre la lógica de negocio (flujo del ticket, cálculo del tiempo de
atención, caducidad de la sesión y capa de datos). Detalle en
[`docs/05-pruebas.md`](docs/05-pruebas.md).

### 5. Crear los usuarios de prueba

Regístrate desde la app con tres correos distintos y luego, en el SQL Editor, asígnales rol:

```sql
update public.perfiles set rol = 'admin'   where correo = 'coordinador@correo.com';
update public.perfiles set rol = 'tecnico' where correo = 'tecnico@correo.com';
-- el tercero se queda como 'aprendiz'
```

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

Los datos viven en memoria ([`src/lib/demo.js`](src/lib/demo.js)) y se pierden al recargar.
Se puede reportar una falla, atenderla y resolverla: la bitácora y los tiempos se calculan
igual que lo harían los *triggers* de la base de datos.

Sirve para dos cosas: revisar la interfaz sin haber configurado nada, y tener un plan B
en la sustentación si falla el internet del centro. Mientras está activo, una cinta ámbar
avisa en todas las pantallas de que los datos son de ejemplo.

## Roles y qué puede hacer cada uno

| Acción | Aprendiz / Instructor | Técnico | Coordinador |
|---|:--:|:--:|:--:|
| Reportar una falla | ✅ | ✅ | ✅ |
| Ver sus propios tickets | ✅ | ✅ | ✅ |
| Ver fallas sin atender | — | ✅ | ✅ |
| Atender una falla | — | ✅ | ✅ |
| Registrar la solución y resolver | — | ✅ | ✅ |
| Cancelar un ticket | — | ✅ | ✅ |
| Tablero de indicadores | — | — | ✅ |
| Administrar ambientes y categorías | — | — | ✅ |

---

## Ciclo de vida del ticket

```
pendiente ──> en_proceso ──> resuelto
     │             │
     └─────────────┴─────> cancelado
```

Tres estados y dos acciones. El técnico presiona **Atender esta falla** (pasa a
`en_proceso` y queda como responsable) y luego **Marcar como resuelto** describiendo qué
hizo. No hay paso de cierre ni calificación: cuando está resuelto, se acabó.

Cada cambio de estado queda registrado automáticamente en la bitácora (`ticket_eventos`)
mediante un *trigger*, junto con quién lo hizo y cuándo. El usuario no puede alterar ese
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
│   ├── instalar-todo.sql      Los tres de abajo en un solo pegado
│   ├── 00-limpiar.sql         Borra el esquema anterior (solo si ya existía)
│   ├── schema.sql             Tablas, triggers, vistas y políticas RLS
│   ├── seed.sql               Ambientes y categorías
│   └── datos-prueba.sql       Seis tickets de ejemplo
├── src/
│   ├── lib/
│   │   ├── supabase.js        Cliente de Supabase
│   │   ├── datos.js           Capa de acceso: decide entre base real y demo
│   │   ├── demo.js            Datos en memoria del modo demostración
│   │   ├── sesion.js          Caducidad de la sesión a los 30 días
│   │   ├── formato.js         Fechas, tiempos y textos
│   │   └── __tests__/         Pruebas unitarias de la lógica
│   ├── context/AuthContext.js Sesión, perfil y rol del usuario
│   ├── theme.js               Colores, estados, prioridades, transiciones
│   ├── components/            Icono y logotipo, ui.js, Pantalla,
│   │                          TarjetaTicket, Graficos (SVG)
│   ├── navigation/            Barra lateral en escritorio, pestañas en móvil
│   ├── screens/               Login, Registro, Inicio, Tickets, Nuevo,
│   │                          Detalle, Tablero, Perfil
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
