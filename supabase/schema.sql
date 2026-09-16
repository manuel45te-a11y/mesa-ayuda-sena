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
