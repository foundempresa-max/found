-- ==========================================================
-- FOUND · FOTOS DE LOS ESTILOS (Creador > Ajustes > Fotos de los estilos)
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
-- ==========================================================

-- El creador puede subir imágenes (por ejemplo, la foto de cada estilo).
-- Las marcas siguen pudiendo subir solo a su propia carpeta.
drop policy if exists "fotos: el creador sube" on storage.objects;
create policy "fotos: el creador sube" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'brand-images') and public.is_admin());
