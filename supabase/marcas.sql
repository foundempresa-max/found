-- ==========================================================
-- FOUND · LOGO Y PORTADA DE CADA MARCA
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
-- ==========================================================

-- 1) Dónde se guarda la dirección del logo y de la portada
alter table public.profiles add column if not exists logo_url  text;
alter table public.profiles add column if not exists cover_url text;

-- Solo se aceptan imágenes subidas por la propia marca a su carpeta de "brand-images"
-- (nadie puede poner como logo una imagen de otra web)
alter table public.profiles drop constraint if exists profiles_logo_url_check;
alter table public.profiles add constraint profiles_logo_url_check
  check (logo_url is null or logo_url ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/brand-images/' || id::text || '/[A-Za-z0-9._-]+$'));
alter table public.profiles drop constraint if exists profiles_cover_url_check;
alter table public.profiles add constraint profiles_cover_url_check
  check (cover_url is null or cover_url ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/brand-images/' || id::text || '/[A-Za-z0-9._-]+$'));

-- 2) Carpeta pública para las imágenes de marca (máx. 5 MB por imagen)
insert into storage.buckets (id, name, public)
values ('brand-images', 'brand-images', true)
on conflict (id) do nothing;

drop policy if exists "marcas: lectura pública" on storage.objects;
create policy "marcas: lectura pública" on storage.objects
  for select using (bucket_id = 'brand-images');

drop policy if exists "marcas: subir en tu carpeta" on storage.objects;
create policy "marcas: subir en tu carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brand-images'
              and (storage.foldername(name))[1] = auth.uid()::text
              and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'brand'));

drop policy if exists "marcas: borrar las tuyas" on storage.objects;
create policy "marcas: borrar las tuyas" on storage.objects
  for delete to authenticated
  using (bucket_id = 'brand-images' and (storage.foldername(name))[1] = auth.uid()::text);
