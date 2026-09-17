-- ============================================================================
--  INSTALACION COMPLETA · Mesa de Ayuda SENA
--  Copia TODO este archivo y pegalo en el SQL Editor de Supabase, luego Run.
--  Contiene, en orden: limpieza + esquema + datos iniciales + roles.
--  OJO: la limpieza borra las tablas del proyecto si ya existian.
--  Si tu base ya tiene datos, usa solo roles-y-asignacion.sql.
-- ============================================================================

-- ============================================================================
--  LIMPIEZA · Solo si ya ejecutaste una version anterior del esquema
--
--  ATENCION: borra las tablas del proyecto y todo lo que contengan.
--  No toca los usuarios de Authentication: esos siguen ahi y sus perfiles
--  se vuelven a crear cuando vuelvas a ejecutar schema.sql... salvo los ya
--  registrados, que tendras que volver a insertar a mano en perfiles (el
--  bloque comentado del final lo hace por ti).
--
--  Orden:  00-limpiar.sql  ->  schema.sql  ->  seed.sql  ->  roles-y-asignacion.sql
-- ============================================================================

drop view if exists public.v_tickets_por_ambiente;
drop view if exists public.v_indicadores;
drop view if exists public.v_tickets_detalle;

drop table if exists public.ticket_adjuntos cascade;
drop table if exists public.ticket_eventos  cascade;
drop table if exists public.tickets         cascade;
drop table if exists public.categorias      cascade;
drop table if exists public.ambientes       cascade;
drop table if exists public.perfiles        cascade;

drop sequence if exists public.seq_ticket;

drop function if exists public.fn_evento_evidencia()           cascade;
drop function if exists public.fn_proteger_perfil()            cascade;
drop function if exists public.fn_puede_trabajar_ticket(uuid)  cascade;
drop function if exists public.fn_tiene_evidencia(uuid)        cascade;
drop function if exists public.fn_registrar_evento()    cascade;
drop function if exists public.fn_seguimiento_estado()  cascade;
drop function if exists public.fn_calcular_vencimiento() cascade;
drop function if exists public.fn_codigo_ticket()       cascade;
drop function if exists public.fn_nuevo_usuario()       cascade;
drop function if exists public.fn_es_soporte()          cascade;
drop function if exists public.fn_es_admin()            cascade;
drop function if exists public.fn_rol_actual()          cascade;

drop type if exists estado_ticket    cascade;
drop type if exists prioridad_ticket cascade;
drop type if exists rol_usuario      cascade;

-- ---------------------------------------------------------------------------
--  DESPUES de ejecutar schema.sql y seed.sql, si ya tenias usuarios creados
--  en Authentication, recrea sus perfiles con esto:
--
--  insert into public.perfiles (id, nombre, correo, rol)
--  select id,
--         coalesce(raw_user_meta_data ->> 'nombre', split_part(email, '@', 1)),
--         email,
--         'aprendiz'
--  from auth.users
--  on conflict (id) do nothing;
--
--  Y luego nombra al administrador en la sección 10 de roles-y-asignacion.sql.
-- ---------------------------------------------------------------------------


-- ============================================================================
--  MESA DE AYUDA SENA  ·  Esquema de base de datos (PostgreSQL / Supabase)
--  Proyecto formativo · Centro de formación
--
--  Flujo del ticket:  pendiente ──> en_proceso ──> resuelto
--                          └────────────┴────────> cancelado
--
--  Ejecutar completo en:  Supabase → SQL Editor → New query → Run
--  Si ya tenías una version anterior, ejecuta antes 00-limpiar.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS
-- ---------------------------------------------------------------------------
do $$ begin
  create type rol_usuario as enum ('aprendiz', 'tecnico', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_ticket as enum ('pendiente', 'en_proceso', 'resuelto', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prioridad_ticket as enum ('baja', 'media', 'alta');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. TABLAS
-- ---------------------------------------------------------------------------

-- 2.1 Perfiles (extiende auth.users)
create table if not exists public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  correo      text,
  documento   text,
  telefono    text,
  rol         rol_usuario not null default 'aprendiz',
  ficha       text,
  programa    text,
  activo      boolean not null default true,
  creado_at   timestamptz not null default now()
);

comment on table public.perfiles is
  'Datos del usuario del sistema. Se crea automaticamente al registrarse en auth.users.';

-- 2.2 Ambientes de formación
create table if not exists public.ambientes (
  id        uuid primary key default gen_random_uuid(),
  codigo    text not null unique,
  nombre    text not null,
  bloque    text,
  piso      text,
  capacidad integer check (capacidad is null or capacidad > 0),
  activo    boolean not null default true,
  creado_at timestamptz not null default now()
);

-- 2.3 Categorías de falla (definen el tiempo de atención en horas)
create table if not exists public.categorias (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique,
  descripcion text,
  sla_horas   integer not null default 24 check (sla_horas > 0),
  activo      boolean not null default true
);

comment on column public.categorias.sla_horas is
  'Tiempo maximo de resolucion acordado para las fallas de esta categoria.';

-- 2.4 Tickets
create table if not exists public.tickets (
  id            uuid primary key default gen_random_uuid(),
  codigo        text unique,
  titulo        text not null check (char_length(titulo) between 5 and 120),
  descripcion   text not null check (char_length(descripcion) >= 10),
  categoria_id  uuid references public.categorias (id) on delete restrict,
  ambiente_id   uuid references public.ambientes (id) on delete restrict,
  prioridad     prioridad_ticket not null default 'media',
  estado        estado_ticket    not null default 'pendiente',
  reportante_id uuid not null references public.perfiles (id) on delete restrict,
  tecnico_id    uuid references public.perfiles (id) on delete set null,
  solucion      text,
  creado_at     timestamptz not null default now(),
  atendido_at   timestamptz,
  resuelto_at   timestamptz,
  vence_at      timestamptz,
  actualizado_at timestamptz not null default now()
);

create index if not exists idx_tickets_estado     on public.tickets (estado);
create index if not exists idx_tickets_reportante on public.tickets (reportante_id);
create index if not exists idx_tickets_tecnico    on public.tickets (tecnico_id);
create index if not exists idx_tickets_ambiente   on public.tickets (ambiente_id);
create index if not exists idx_tickets_creado     on public.tickets (creado_at desc);

-- 2.5 Bitácora de eventos (trazabilidad del ticket)
create table if not exists public.ticket_eventos (
  id              uuid primary key default gen_random_uuid(),
  ticket_id       uuid not null references public.tickets (id) on delete cascade,
  actor_id        uuid references public.perfiles (id) on delete set null,
  tipo            text not null,   -- creacion | cambio_estado
  estado_anterior estado_ticket,
  estado_nuevo    estado_ticket,
  comentario      text,
  creado_at       timestamptz not null default now()
);

create index if not exists idx_eventos_ticket on public.ticket_eventos (ticket_id, creado_at);

-- 2.6 Adjuntos (fotos de la falla, guardadas en Storage)
create table if not exists public.ticket_adjuntos (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets (id) on delete cascade,
  ruta       text not null,
  nombre     text,
  subido_por uuid references public.perfiles (id) on delete set null,
  creado_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. FUNCIONES AUXILIARES DE ROL
--    SECURITY DEFINER para que las políticas RLS puedan consultar el rol
--    sin caer en recursión infinita sobre la propia tabla perfiles.
-- ---------------------------------------------------------------------------
create or replace function public.fn_rol_actual()
returns rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

create or replace function public.fn_es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.fn_rol_actual() = 'admin', false);
$$;

create or replace function public.fn_es_soporte()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.fn_rol_actual() in ('tecnico', 'admin'), false);
$$;

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------------

-- 4.1 Crear el perfil automáticamente cuando alguien se registra
create or replace function public.fn_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo, rol, ficha, programa, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1), 'Usuario'),
    new.email,
    coalesce((new.raw_user_meta_data ->> 'rol')::rol_usuario, 'aprendiz'),
    new.raw_user_meta_data ->> 'ficha',
    new.raw_user_meta_data ->> 'programa',
    new.raw_user_meta_data ->> 'telefono'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_nuevo_usuario on auth.users;
create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function public.fn_nuevo_usuario();

-- 4.2 Código consecutivo del ticket: MA-2026-0001
create sequence if not exists public.seq_ticket;

create or replace function public.fn_codigo_ticket()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null then
    new.codigo := 'MA-' || to_char(now(), 'YYYY') || '-' ||
                  lpad(nextval('public.seq_ticket')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_codigo_ticket on public.tickets;
create trigger trg_codigo_ticket
  before insert on public.tickets
  for each row execute function public.fn_codigo_ticket();

-- 4.3 Fecha de vencimiento: el tiempo acordado de la categoria
create or replace function public.fn_calcular_vencimiento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  horas integer;
begin
  select sla_horas into horas from public.categorias where id = new.categoria_id;
  new.vence_at := new.creado_at + make_interval(hours => coalesce(horas, 24));
  return new;
end;
$$;

drop trigger if exists trg_vencimiento on public.tickets;
create trigger trg_vencimiento
  before insert on public.tickets
  for each row execute function public.fn_calcular_vencimiento();

-- 4.4 Marcas de tiempo por cambio de estado
create or replace function public.fn_seguimiento_estado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_at := now();

  if new.estado is distinct from old.estado then
    if new.estado = 'en_proceso' then
      new.atendido_at := coalesce(new.atendido_at, now());
    elsif new.estado = 'resuelto' then
      new.resuelto_at := now();
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_seguimiento_estado on public.tickets;
create trigger trg_seguimiento_estado
  before update on public.tickets
  for each row execute function public.fn_seguimiento_estado();

-- 4.5 Bitácora automática
create or replace function public.fn_registrar_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.ticket_eventos (ticket_id, actor_id, tipo, estado_nuevo, comentario)
    values (new.id, new.reportante_id, 'creacion', new.estado, 'Falla reportada');

  elsif new.estado is distinct from old.estado then
    insert into public.ticket_eventos
      (ticket_id, actor_id, tipo, estado_anterior, estado_nuevo, comentario)
    values (new.id, auth.uid(), 'cambio_estado', old.estado, new.estado, new.solucion);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_evento_insert on public.tickets;
create trigger trg_evento_insert
  after insert on public.tickets
  for each row execute function public.fn_registrar_evento();

drop trigger if exists trg_evento_update on public.tickets;
create trigger trg_evento_update
  after update on public.tickets
  for each row execute function public.fn_registrar_evento();

-- ---------------------------------------------------------------------------
-- 5. VISTAS PARA EL TABLERO DE INDICADORES
-- ---------------------------------------------------------------------------
create or replace view public.v_tickets_detalle as
select
  t.*,
  c.nombre  as categoria_nombre,
  a.codigo  as ambiente_codigo,
  a.nombre  as ambiente_nombre,
  pr.nombre as reportante_nombre,
  pt.nombre as tecnico_nombre,
  case
    when t.estado = 'resuelto' then t.resuelto_at <= t.vence_at
    else now() <= t.vence_at
  end as en_sla,
  extract(epoch from (coalesce(t.atendido_at, now()) - t.creado_at)) / 3600 as horas_respuesta,
  extract(epoch from (coalesce(t.resuelto_at, now()) - t.creado_at)) / 3600 as horas_resolucion
from public.tickets t
left join public.categorias c  on c.id  = t.categoria_id
left join public.ambientes  a  on a.id  = t.ambiente_id
left join public.perfiles   pr on pr.id = t.reportante_id
left join public.perfiles   pt on pt.id = t.tecnico_id;

create or replace view public.v_indicadores as
select
  count(*)                                                      as total,
  count(*) filter (where estado = 'pendiente')                  as pendientes,
  count(*) filter (where estado = 'en_proceso')                 as en_proceso,
  count(*) filter (where estado = 'resuelto')                   as resueltos,
  count(*) filter (where estado = 'cancelado')                  as cancelados,
  count(*) filter (where estado in ('pendiente', 'en_proceso')
                     and now() > vence_at)                      as vencidos,
  round(avg(extract(epoch from (atendido_at - creado_at)) / 3600)::numeric, 2) as prom_horas_respuesta,
  round(avg(extract(epoch from (resuelto_at - creado_at)) / 3600)::numeric, 2) as prom_horas_resolucion
from public.tickets;

create or replace view public.v_tickets_por_ambiente as
select
  a.codigo,
  a.nombre,
  count(t.id)                                                             as total,
  count(t.id) filter (where t.estado in ('pendiente', 'en_proceso'))      as pendientes
from public.ambientes a
left join public.tickets t on t.ambiente_id = a.id
group by a.codigo, a.nombre
order by total desc;

-- ---------------------------------------------------------------------------
-- 6. SEGURIDAD A NIVEL DE FILA (RLS)
-- ---------------------------------------------------------------------------
alter table public.perfiles        enable row level security;
alter table public.ambientes       enable row level security;
alter table public.categorias      enable row level security;
alter table public.tickets         enable row level security;
alter table public.ticket_eventos  enable row level security;
alter table public.ticket_adjuntos enable row level security;

-- 6.1 Perfiles
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (id = auth.uid() or public.fn_es_soporte());

drop policy if exists perfiles_update_propio on public.perfiles;
create policy perfiles_update_propio on public.perfiles
  for update to authenticated
  using (id = auth.uid() or public.fn_es_admin())
  with check (id = auth.uid() or public.fn_es_admin());

-- 6.2 Catálogos: todos leen, solo el admin administra
drop policy if exists ambientes_select on public.ambientes;
create policy ambientes_select on public.ambientes
  for select to authenticated using (true);

drop policy if exists ambientes_admin on public.ambientes;
create policy ambientes_admin on public.ambientes
  for all to authenticated
  using (public.fn_es_admin()) with check (public.fn_es_admin());

drop policy if exists categorias_select on public.categorias;
create policy categorias_select on public.categorias
  for select to authenticated using (true);

drop policy if exists categorias_admin on public.categorias;
create policy categorias_admin on public.categorias
  for all to authenticated
  using (public.fn_es_admin()) with check (public.fn_es_admin());

-- 6.3 Tickets
--     · el aprendiz ve y crea los suyos
--     · el tecnico ve los suyos y los que estan sin atender
--     · el admin ve y hace todo
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets
  for select to authenticated
  using (
    reportante_id = auth.uid()
    or tecnico_id = auth.uid()
    or (public.fn_es_soporte() and tecnico_id is null)
    or public.fn_es_admin()
  );

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets
  for insert to authenticated
  with check (reportante_id = auth.uid());

drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets
  for update to authenticated
  using (public.fn_es_soporte())
  with check (public.fn_es_soporte());

drop policy if exists tickets_delete on public.tickets;
create policy tickets_delete on public.tickets
  for delete to authenticated using (public.fn_es_admin());

-- 6.4 Bitácora: se lee si el usuario alcanza a ver el ticket
drop policy if exists eventos_select on public.ticket_eventos;
create policy eventos_select on public.ticket_eventos
  for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_id));

drop policy if exists eventos_insert on public.ticket_eventos;
create policy eventos_insert on public.ticket_eventos
  for insert to authenticated
  with check (actor_id = auth.uid());

-- 6.5 Adjuntos
drop policy if exists adjuntos_select on public.ticket_adjuntos;
create policy adjuntos_select on public.ticket_adjuntos
  for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_id));

drop policy if exists adjuntos_insert on public.ticket_adjuntos;
create policy adjuntos_insert on public.ticket_adjuntos
  for insert to authenticated
  with check (subido_por = auth.uid());

-- ============================================================================
--  FIN DEL ESQUEMA
-- ============================================================================


-- ============================================================================
--  DATOS DE PRUEBA · Mesa de Ayuda SENA
--  Ejecutar DESPUES de schema.sql
-- ============================================================================

-- Categorías de falla con su SLA base (horas)
insert into public.categorias (nombre, descripcion, sla_horas) values
  ('Red e internet',   'Sin conexion, wifi intermitente, cable de red danado', 4),
  ('Equipos de computo', 'PC que no enciende, lentitud, perifericos danados',  8),
  ('Video y proyeccion', 'Videobeam, televisor, cables HDMI, tablero digital', 6),
  ('Software',         'Programa que no abre, licencias, actualizaciones',     24),
  ('Electrico',        'Tomas sin corriente, iluminacion, breaker',            4),
  ('Mobiliario',       'Sillas, mesas, tableros, puertas y cerraduras',        48),
  ('Climatizacion',    'Aire acondicionado, ventiladores',                     24)
on conflict (nombre) do nothing;

-- Ambientes de formación
insert into public.ambientes (codigo, nombre, bloque, piso, capacidad) values
  ('A-101', 'Sala de sistemas 1',      'A', '1', 30),
  ('A-102', 'Sala de sistemas 2',      'A', '1', 30),
  ('A-201', 'Aula multiple',           'A', '2', 40),
  ('B-101', 'Laboratorio de redes',    'B', '1', 25),
  ('B-102', 'Taller de mantenimiento', 'B', '1', 20),
  ('B-203', 'Sala de diseno',          'B', '2', 25),
  ('C-101', 'Biblioteca',              'C', '1', 60),
  ('C-102', 'Auditorio',               'C', '1', 120)
on conflict (codigo) do nothing;

-- ---------------------------------------------------------------------------
--  Para convertir un usuario en tecnico o admin, registralo primero desde la
--  app y luego ejecuta (cambiando el correo):
--
--    update public.perfiles set rol = 'admin'   where correo = 'tu@correo.com';
--    update public.perfiles set rol = 'tecnico' where correo = 'tecnico@correo.com';
-- ---------------------------------------------------------------------------


-- ============================================================================
--  MESA DE AYUDA SENA  ·  Roles, asignación de técnicos y evidencias
--
--  Va DESPUÉS de schema.sql y seed.sql (instalar-todo.sql ya lo incluye).
--  Si tu base ya existía, pega solo este archivo en el SQL Editor y presiona
--  Run: no borra datos y se puede ejecutar varias veces.
--
--  Quién hace qué:
--    · Usuario / Aprendiz  reporta fallas y consulta sus solicitudes y evidencias.
--    · Técnico             atiende lo que le asignan (o toma lo que está sin
--                          asignar), sube evidencias y cierra con la solución.
--    · Administrador       ve todo, asigna técnicos, cancela y define los roles.
--
--  Reglas que quedan en la base de datos, no solo en la app:
--    · Nadie elige su rol al registrarse: toda cuenta nace como aprendiz.
--    · Solo el administrador cambia roles, y no puede cambiar el suyo.
--    · Asignar un técnico a una solicitud pendiente la pasa a "en proceso".
--    · Para cerrar hay que adjuntar al menos una evidencia y describir la
--      solución (mínimo 10 caracteres).
--    · Solo el administrador cancela.
--    · La bitácora la escriben los triggers: asignaciones, evidencias y
--      cambios de estado, cada uno con su autor.
--    · Las vistas respetan las políticas RLS de quien consulta.
--
--  Al final (sección 10) puedes nombrar al primer administrador.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- 1. EVIDENCIAS: nota del trabajo realizado
-- ---------------------------------------------------------------------------
alter table public.ticket_adjuntos
  add column if not exists descripcion text;

comment on table public.ticket_adjuntos is
  'Evidencias (foto y nota) que sube el técnico al atender una solicitud.';
comment on column public.ticket_adjuntos.ruta is
  'Foto de la evidencia. La app la guarda reducida (máximo 1280 px) como data URL.';


-- ---------------------------------------------------------------------------
-- 2. REGISTRO: toda cuenta nueva nace como aprendiz
--    El rol NO se toma de los datos que manda la app al registrarse, porque
--    cualquiera podría enviar "admin" desde la API.
-- ---------------------------------------------------------------------------
create or replace function public.fn_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo, ficha, programa, telefono)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1), 'Usuario'),
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'ficha'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'programa'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'telefono'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. ROLES: solo el administrador los cambia
--    Nadie cambia su propio rol: así nadie se sube de rango desde la API y el
--    administrador no se quita el acceso por error. Desde el SQL Editor sí se
--    puede, que es como se nombra al primer administrador.
-- ---------------------------------------------------------------------------
create or replace function public.fn_proteger_perfil()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- current_user es 'authenticated' o 'anon' cuando el cambio llega desde la app.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  new.id        := old.id;
  new.correo    := old.correo;
  new.creado_at := old.creado_at;

  if new.rol is distinct from old.rol or new.activo is distinct from old.activo then
    if not public.fn_es_admin() then
      raise exception 'Solo el administrador puede cambiar el rol de una cuenta.'
        using errcode = '42501';
    end if;
    if new.id = auth.uid() then
      raise exception 'No puedes cambiar tu propio rol.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_perfil on public.perfiles;
create trigger trg_proteger_perfil
  before update on public.perfiles
  for each row execute function public.fn_proteger_perfil();

-- Cualquier usuario con sesión ve a técnicos y administradores (para mostrar
-- quién atiende); el equipo de soporte ve todos los perfiles.
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (
    id = auth.uid()
    or rol in ('tecnico', 'admin')
    or public.fn_es_soporte()
  );


-- ---------------------------------------------------------------------------
-- 4. FUNCIONES DE APOYO
--    SECURITY DEFINER para consultar sin depender de las políticas de quien
--    llama (y sin caer en recursión dentro de las propias políticas).
-- ---------------------------------------------------------------------------
create or replace function public.fn_tiene_evidencia(p_ticket uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.ticket_adjuntos a where a.ticket_id = p_ticket);
$$;

-- ¿Puede quien llama trabajar en esta solicitud? Técnico asignado o administrador,
-- mientras la solicitud siga abierta.
create or replace function public.fn_puede_trabajar_ticket(p_ticket uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tickets t
    where t.id = p_ticket
      and t.estado in ('pendiente', 'en_proceso')
      and (t.tecnico_id = auth.uid() or public.fn_es_admin())
  );
$$;

revoke execute on function public.fn_tiene_evidencia(uuid) from public, anon;
revoke execute on function public.fn_puede_trabajar_ticket(uuid) from public, anon;
grant execute on function public.fn_tiene_evidencia(uuid) to authenticated;
grant execute on function public.fn_puede_trabajar_ticket(uuid) to authenticated;


-- ---------------------------------------------------------------------------
-- 5. SOLICITUDES: quién las ve y quién las cambia
--    · el aprendiz ve las suyas
--    · el técnico ve las suyas y las que están sin asignar (puede tomarlas)
--    · el administrador ve y cambia todas
-- ---------------------------------------------------------------------------
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets
  for select to authenticated
  using (
    reportante_id = auth.uid()
    or tecnico_id = auth.uid()
    or (public.fn_es_soporte() and tecnico_id is null)
    or public.fn_es_admin()
  );

drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets
  for update to authenticated
  using (
    public.fn_es_admin()
    or (public.fn_es_soporte() and (tecnico_id is null or tecnico_id = auth.uid()))
  )
  with check (
    public.fn_es_admin()
    or (public.fn_es_soporte() and (tecnico_id is null or tecnico_id = auth.uid()))
  );


-- ---------------------------------------------------------------------------
-- 6. FLUJO DE LA SOLICITUD
--
--    pendiente ──(asignar técnico)──> en_proceso ──(evidencia + solución)──> resuelto
--        └──────────────────────────────┴──────────(solo admin)────────────> cancelado
-- ---------------------------------------------------------------------------
create or replace function public.fn_seguimiento_estado()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  desde_app boolean := current_user in ('authenticated', 'anon');
begin
  new.actualizado_at := now();

  -- Desde la app no se tocan el código, el reportante ni las fechas: las pone
  -- la base de datos. (Desde el SQL Editor sí, para cargar datos de prueba.)
  if desde_app then
    new.codigo        := old.codigo;
    new.reportante_id := old.reportante_id;
    new.creado_at     := old.creado_at;
    new.vence_at      := old.vence_at;
    new.atendido_at   := old.atendido_at;
    new.resuelto_at   := old.resuelto_at;
  end if;

  -- Asignar un técnico a una solicitud pendiente es empezar a atenderla.
  if new.tecnico_id is not null and old.estado = 'pendiente' and new.estado = 'pendiente' then
    new.estado := 'en_proceso';
  end if;

  if new.estado is distinct from old.estado then
    if not (
      (old.estado = 'pendiente'  and new.estado in ('en_proceso', 'cancelado')) or
      (old.estado = 'en_proceso' and new.estado in ('resuelto', 'cancelado'))
    ) then
      raise exception 'Una solicitud en estado % no puede pasar a %.', old.estado, new.estado
        using errcode = '23514';
    end if;

    if new.estado = 'en_proceso' then
      if new.tecnico_id is null then
        raise exception 'Asigna un técnico para empezar a atender la solicitud.'
          using errcode = '23514';
      end if;
      -- La primera atención no se reescribe al reasignar.
      new.atendido_at := coalesce(new.atendido_at, now());

    elsif new.estado = 'resuelto' then
      if char_length(btrim(coalesce(new.solucion, ''))) < 10 then
        raise exception 'Describe la solución aplicada (mínimo 10 caracteres).'
          using errcode = '23514';
      end if;
      if not public.fn_tiene_evidencia(new.id) then
        raise exception 'Adjunta al menos una evidencia antes de cerrar la solicitud.'
          using errcode = '23514';
      end if;
      new.resuelto_at := coalesce(new.resuelto_at, now());

    elsif new.estado = 'cancelado' and desde_app and not public.fn_es_admin() then
      raise exception 'Solo el administrador puede cancelar una solicitud.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_seguimiento_estado on public.tickets;
create trigger trg_seguimiento_estado
  before update on public.tickets
  for each row execute function public.fn_seguimiento_estado();


-- ---------------------------------------------------------------------------
-- 7. BITÁCORA AUTOMÁTICA
--    Solo la escriben estos triggers: la app no puede insertar ni cambiar
--    eventos (no hay política de insert en ticket_eventos).
-- ---------------------------------------------------------------------------
create or replace function public.fn_registrar_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_antes text;
  v_ahora text;
begin
  if tg_op = 'INSERT' then
    insert into public.ticket_eventos (ticket_id, actor_id, tipo, estado_nuevo, comentario)
    values (new.id, new.reportante_id, 'creacion', new.estado, 'Falla reportada');
    return new;
  end if;

  if new.tecnico_id is distinct from old.tecnico_id then
    -- Una asignación puede cambiar también el estado (pendiente -> en proceso):
    -- queda como un solo evento.
    select nombre into v_antes from public.perfiles where id = old.tecnico_id;
    select nombre into v_ahora from public.perfiles where id = new.tecnico_id;

    insert into public.ticket_eventos
      (ticket_id, actor_id, tipo, estado_anterior, estado_nuevo, comentario)
    values (
      new.id, auth.uid(), 'asignacion', old.estado, new.estado,
      case
        when new.tecnico_id is null then format('Se quitó a %s', coalesce(v_antes, 'el técnico'))
        when old.tecnico_id is null then format('Asignada a %s', coalesce(v_ahora, 'un técnico'))
        else format('Reasignada de %s a %s', coalesce(v_antes, 'otro técnico'), coalesce(v_ahora, 'un técnico'))
      end
    );

  elsif new.estado is distinct from old.estado then
    insert into public.ticket_eventos
      (ticket_id, actor_id, tipo, estado_anterior, estado_nuevo, comentario)
    values (
      new.id, auth.uid(), 'cambio_estado', old.estado, new.estado,
      case when new.estado = 'resuelto' then new.solucion end
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_evento_insert on public.tickets;
create trigger trg_evento_insert
  after insert on public.tickets
  for each row execute function public.fn_registrar_evento();

drop trigger if exists trg_evento_update on public.tickets;
create trigger trg_evento_update
  after update on public.tickets
  for each row execute function public.fn_registrar_evento();

-- Cada evidencia nueva deja su evento, con quién la subió y su nota.
create or replace function public.fn_evento_evidencia()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ticket_eventos (ticket_id, actor_id, tipo, comentario)
  values (
    new.ticket_id,
    coalesce(new.subido_por, auth.uid()),
    'evidencia',
    concat_ws(' — ', coalesce(nullif(btrim(new.nombre), ''), 'Evidencia'), nullif(btrim(new.descripcion), ''))
  );
  return new;
end;
$$;

drop trigger if exists trg_evento_evidencia on public.ticket_adjuntos;
create trigger trg_evento_evidencia
  after insert on public.ticket_adjuntos
  for each row execute function public.fn_evento_evidencia();

drop policy if exists eventos_insert on public.ticket_eventos;


-- ---------------------------------------------------------------------------
-- 8. EVIDENCIAS: quién las ve y quién las sube
-- ---------------------------------------------------------------------------
-- Las ve quien puede ver la solicitud (la subconsulta ya pasa por las
-- políticas de tickets).
drop policy if exists adjuntos_select on public.ticket_adjuntos;
create policy adjuntos_select on public.ticket_adjuntos
  for select to authenticated
  using (exists (select 1 from public.tickets t where t.id = ticket_id));

-- Las sube el técnico asignado o el administrador, mientras la solicitud esté
-- abierta. No hay políticas de update ni delete: una evidencia no se cambia.
drop policy if exists adjuntos_insert on public.ticket_adjuntos;
create policy adjuntos_insert on public.ticket_adjuntos
  for insert to authenticated
  with check (
    subido_por = auth.uid()
    and public.fn_puede_trabajar_ticket(ticket_id)
  );


-- ---------------------------------------------------------------------------
-- 9. VISTAS QUE RESPETAN RLS
--    Sin security_invoker, una vista consulta con los permisos de su dueño y
--    se salta las políticas: cualquiera, incluso sin sesión, veía todas las
--    solicitudes a través de v_tickets_detalle.
-- ---------------------------------------------------------------------------
do $$
declare
  v_vista text;
begin
  foreach v_vista in array array['v_tickets_detalle', 'v_indicadores', 'v_tickets_por_ambiente'] loop
    if exists (select 1 from pg_views where schemaname = 'public' and viewname = v_vista) then
      execute format('alter view public.%I set (security_invoker = true)', v_vista);
      execute format('revoke all on public.%I from anon', v_vista);
    end if;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- 10. ADMINISTRADORES
--     Las cuentas deben existir (regístralas primero desde la app). Escribe
--     los correos entre las comillas, separados por coma, y ejecuta el
--     archivo. Vacío no cambia nada.
--     Después, el administrador asigna los demás roles desde la pantalla
--     Usuarios de la app.
-- ---------------------------------------------------------------------------
do $$
declare
  v_correos_admin text := '';   -- <<<<<< por ejemplo 'yo@correo.com, companero@correo.com'
  v_correo text;
  v_filas integer;
begin
  if btrim(v_correos_admin) = '' then
    raise notice 'No se nombró administrador: v_correos_admin está vacío.';
    return;
  end if;

  foreach v_correo in array string_to_array(v_correos_admin, ',') loop
    v_correo := lower(btrim(v_correo));
    continue when v_correo = '';

    update public.perfiles set rol = 'admin' where lower(correo) = v_correo;
    get diagnostics v_filas = row_count;

    if v_filas = 0 then
      raise notice 'No hay ninguna cuenta con el correo %. Regístrala primero desde la app.', v_correo;
    else
      raise notice 'Listo: % ahora es administrador.', v_correo;
    end if;
  end loop;
end $$;
