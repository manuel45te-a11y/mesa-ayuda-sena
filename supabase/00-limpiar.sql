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
