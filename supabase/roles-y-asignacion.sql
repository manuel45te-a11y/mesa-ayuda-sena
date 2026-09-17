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
