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
