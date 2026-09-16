-- ============================================================================
--  DATOS DE PRUEBA · Tickets de ejemplo para ver la aplicación con contenido
--  Ejecutar DESPUES de schema.sql y seed.sql, y DESPUES de crear tu usuario.
--
--  CAMBIA el correo de la línea marcada por el tuyo antes de ejecutar.
--  Flujo: pendiente -> en_proceso -> resuelto
-- ============================================================================

do $$
declare
  v_correo text := 'manuel45te@gmail.com';   -- <<<<<< CAMBIA ESTE CORREO

  v_yo         uuid;
  v_red        uuid;
  v_video      uuid;
  v_equipos    uuid;
  v_software   uuid;
  v_mobiliario uuid;
  v_clima      uuid;
  v_a101 uuid; v_a102 uuid; v_b101 uuid; v_b203 uuid; v_c101 uuid;
  v_id uuid;
begin
  select id into v_yo from public.perfiles where correo = v_correo;
  if v_yo is null then
    raise exception 'No hay ningun perfil con el correo %. Crea primero el usuario.', v_correo;
  end if;

  select id into v_red        from public.categorias where nombre = 'Red e internet';
  select id into v_video      from public.categorias where nombre = 'Video y proyeccion';
  select id into v_equipos    from public.categorias where nombre = 'Equipos de computo';
  select id into v_software   from public.categorias where nombre = 'Software';
  select id into v_mobiliario from public.categorias where nombre = 'Mobiliario';
  select id into v_clima      from public.categorias where nombre = 'Climatizacion';

  if v_red is null then
    raise exception 'Faltan las categorias. Ejecuta primero seed.sql';
  end if;

  select id into v_a101 from public.ambientes where codigo = 'A-101';
  select id into v_a102 from public.ambientes where codigo = 'A-102';
  select id into v_b101 from public.ambientes where codigo = 'B-101';
  select id into v_b203 from public.ambientes where codigo = 'B-203';
  select id into v_c101 from public.ambientes where codigo = 'C-101';

  -- 1. Pendiente y vencido (SLA de video: 6 h, reportado hace 9)
  insert into public.tickets
    (titulo, descripcion, categoria_id, ambiente_id, prioridad, reportante_id, creado_at)
  values (
    'El videobeam no proyecta',
    'Enciende pero la imagen se ve azul. Probamos con otro cable HDMI y sigue igual.',
    v_video, v_a101, 'alta', v_yo, now() - interval '9 hours'
  );

  -- 2. Pendiente, recien reportado
  insert into public.tickets
    (titulo, descripcion, categoria_id, ambiente_id, prioridad, reportante_id, creado_at)
  values (
    'Sin internet en el laboratorio de redes',
    'Ningun equipo del ambiente tiene conexion. El switch tiene las luces apagadas.',
    v_red, v_b101, 'alta', v_yo, now() - interval '25 minutes'
  );

  -- 3. En proceso
  insert into public.tickets
    (titulo, descripcion, categoria_id, ambiente_id, prioridad, reportante_id, creado_at)
  values (
    'El equipo 12 no enciende',
    'Al presionar el boton no da senal de vida. Ya se reviso que el cable de poder este bien.',
    v_equipos, v_a102, 'media', v_yo, now() - interval '6 hours'
  ) returning id into v_id;

  update public.tickets set tecnico_id = v_yo, estado = 'en_proceso' where id = v_id;
  update public.tickets set atendido_at = now() - interval '4 hours'  where id = v_id;

  -- 4. Resuelto, con la solucion documentada
  insert into public.tickets
    (titulo, descripcion, categoria_id, ambiente_id, prioridad, reportante_id, creado_at)
  values (
    'Dos sillas del ambiente estan rotas',
    'Las sillas de los puestos 8 y 9 tienen el espaldar suelto y no se pueden usar.',
    v_mobiliario, v_b203, 'baja', v_yo, now() - interval '3 days'
  ) returning id into v_id;

  update public.tickets set tecnico_id = v_yo, estado = 'en_proceso' where id = v_id;
  update public.tickets
    set estado = 'resuelto',
        solucion = 'Se reemplazaron los tornillos del espaldar y se ajustaron ambas sillas.'
    where id = v_id;
  update public.tickets
    set atendido_at = now() - interval '70 hours',
        resuelto_at = now() - interval '67 hours'
    where id = v_id;

  -- 5. En proceso
  insert into public.tickets
    (titulo, descripcion, categoria_id, ambiente_id, prioridad, reportante_id, creado_at)
  values (
    'El aire acondicionado no enfria',
    'Prende y suena normal pero el aire sale caliente. Lleva asi toda la semana.',
    v_clima, v_c101, 'media', v_yo, now() - interval '20 hours'
  ) returning id into v_id;

  update public.tickets set tecnico_id = v_yo, estado = 'en_proceso' where id = v_id;
  update public.tickets set atendido_at = now() - interval '18 hours' where id = v_id;

  -- 6. Pendiente, prioridad baja
  insert into public.tickets
    (titulo, descripcion, categoria_id, ambiente_id, prioridad, reportante_id, creado_at)
  values (
    'Licencia del software de diseno vencida',
    'Al abrir el programa aparece un aviso de licencia expirada y se cierra solo.',
    v_software, v_b203, 'baja', v_yo, now() - interval '6 hours'
  );

  raise notice 'Listo: 6 tickets de prueba creados para %', v_correo;
end $$;

-- Comprobacion rapida
select codigo, titulo, estado, prioridad, vence_at < now() as vencido
from public.tickets
order by creado_at desc;
