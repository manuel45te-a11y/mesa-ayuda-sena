-- ============================================================================
--  MESA DE AYUDA SENA  ·  Roles, Asignación de Técnicos y Evidencias
--  Complemento / Actualización de políticas RLS y esquema
--
--  Flujo:
--    1. Usuario / Aprendiz: Crea tickets y consulta sus reportes y evidencias.
--    2. Administrador: Recibe todos los tickets y asigna el técnico responsable.
--    3. Técnico: Atiende, monta evidencias en ticket_adjuntos y cierra tickets evidenciados.
-- ============================================================================

-- 1. Asegurar columna de descripción en ticket_adjuntos si no existe
alter table if exists public.ticket_adjuntos
  add column if not exists descripcion text;

-- 2. Asegurar que cualquier usuario autenticado pueda consultar los perfiles
--    con rol de técnico o admin para mostrar la lista de asignación.
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles
  for select to authenticated
  using (
    id = auth.uid()
    or rol in ('tecnico', 'admin')
    or public.fn_es_soporte()
  );

-- 3. Políticas para tickets:
--    - Administrador y técnicos pueden asignar y actualizar tickets
--    - El reportante puede ver sus tickets
--    - El técnico asignado puede ver y actualizar sus tickets
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

-- 4. Políticas para evidencias (ticket_adjuntos):
--    - Visibles para quien tenga permiso de ver el ticket
--    - Montadas por el técnico asignado, por soporte o por admin
drop policy if exists adjuntos_select on public.ticket_adjuntos;
create policy adjuntos_select on public.ticket_adjuntos
  for select to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
      and (
        t.reportante_id = auth.uid()
        or t.tecnico_id = auth.uid()
        or public.fn_es_soporte()
      )
    )
  );

drop policy if exists adjuntos_insert on public.ticket_adjuntos;
create policy adjuntos_insert on public.ticket_adjuntos
  for insert to authenticated
  with check (
    subido_por = auth.uid()
    and public.fn_es_soporte()
  );

-- 5. Asignar rol de Administrador a larioscarvajal2007@gmail.com
update public.perfiles
set rol = 'admin'
where lower(correo) = 'larioscarvajal2007@gmail.com'
   or id in (select id from auth.users where lower(email) = 'larioscarvajal2007@gmail.com');

-- 6. Trigger actualizado para que si se crea la cuenta quede como admin automáticamente
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
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1), 'Administrador'),
    new.email,
    case
      when lower(new.email) = 'larioscarvajal2007@gmail.com' then 'admin'::rol_usuario
      else coalesce((new.raw_user_meta_data ->> 'rol')::rol_usuario, 'aprendiz')
    end,
    new.raw_user_meta_data ->> 'ficha',
    new.raw_user_meta_data ->> 'programa',
    new.raw_user_meta_data ->> 'telefono'
  )
  on conflict (id) do update
  set rol = case
    when lower(new.email) = 'larioscarvajal2007@gmail.com' then 'admin'::rol_usuario
    else excluded.rol
  end;
  return new;
end;
$$;

-- 7. Comentario de verificación
comment on table public.ticket_adjuntos is
  'Evidencias fotográficas y notas técnicas montadas por los técnicos al atender solicitudes.';
