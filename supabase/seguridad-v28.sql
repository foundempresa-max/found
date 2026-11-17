-- ==========================================================
-- FOUND · seguridad v28 (17 nov 2026)
-- 1. (Comprobado, sin cambios) Las prendas en revisión o rechazadas solo las ven su marca y el creador:
--    «productos: solo aprobadas» es RESTRICTIVA y necesita «productos: ver todos» (permisiva). No borrar ninguna de las dos.
-- 2. Solo las marcas (y el creador) pueden subir fotos de prendas.
-- 3. Precio máximo comprobado en el servidor (100.000 €).
-- 4. La web de una solicitud de marca tiene que empezar por http:// o https://.
-- ==========================================================

-- 2 · fotos de prendas: solo cuentas de marca, en su propia carpeta
drop policy if exists "fotos: subir en tu carpeta" on storage.objects;
create policy "fotos: subir en tu carpeta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'brand')
  );

-- 3 · precio con tope en el servidor
alter table public.products drop constraint if exists products_price_max;
alter table public.products add constraint products_price_max check (price <= 100000);

-- 4 · enlaces seguros en las solicitudes
alter table public.brand_applications drop constraint if exists brand_applications_website_scheme;
alter table public.brand_applications add constraint brand_applications_website_scheme
  check (website is null or website ~* '^https?://[^[:space:]<>"'']+$');
