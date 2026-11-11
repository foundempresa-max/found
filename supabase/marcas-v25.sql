-- ==========================================================
-- FOUND · PERFIL DE MARCA COMPLETO Y SEGUIR MARCAS (v25, 11 nov 2026)
-- 1. Perfil de marca: ciudad, historia, Instagram, web, sellos
--    («Hecho en España», «Sostenible»…) y envío/entrega/devoluciones.
-- 2. Logo y portada obligatorios para publicar prendas nuevas.
-- 3. Seguir marcas (con el número de seguidores de cada una).
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- ==========================================================

-- 1) Perfil de marca
alter table public.profiles add column if not exists brand_city   text;
alter table public.profiles add column if not exists brand_story  text;
alter table public.profiles add column if not exists instagram    text;
alter table public.profiles add column if not exists website      text;
alter table public.profiles add column if not exists brand_badges text[] not null default '{}';
alter table public.profiles add column if not exists shop_info    jsonb  not null default '{}'::jsonb;

alter table public.profiles drop constraint if exists profiles_brand_city_len;
alter table public.profiles add  constraint profiles_brand_city_len  check (brand_city  is null or char_length(brand_city)  <= 60);
alter table public.profiles drop constraint if exists profiles_brand_story_len;
alter table public.profiles add  constraint profiles_brand_story_len check (brand_story is null or char_length(brand_story) <= 1500);
alter table public.profiles drop constraint if exists profiles_instagram_ok;
alter table public.profiles add  constraint profiles_instagram_ok    check (instagram   is null or instagram ~ '^[A-Za-z0-9._]{1,30}$');
alter table public.profiles drop constraint if exists profiles_website_ok;
alter table public.profiles add  constraint profiles_website_ok      check (website     is null or (char_length(website) <= 300 and website ~* '^https?://'));
alter table public.profiles drop constraint if exists profiles_badges_ok;
alter table public.profiles add  constraint profiles_badges_ok       check (cardinality(brand_badges) <= 6);
alter table public.profiles drop constraint if exists profiles_shop_info_ok;
alter table public.profiles add  constraint profiles_shop_info_ok    check (jsonb_typeof(shop_info) = 'object' and pg_column_size(shop_info) < 1500);

-- 2) Logo y portada obligatorios: una marca no puede publicar prendas nuevas sin ellos
create or replace function public.require_brand_images()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and exists (
    select 1 from public.profiles
    where id = new.brand_id and (coalesce(logo_url, '') = '' or coalesce(cover_url, '') = '')
  ) then
    raise exception 'FOUND_FALTA_LOGO_PORTADA';
  end if;
  return new;
end $$;
drop trigger if exists require_brand_images on public.products;
create trigger require_brand_images before insert on public.products
  for each row execute function public.require_brand_images();
revoke execute on function public.require_brand_images() from public, anon, authenticated;

-- 3) Seguir marcas
create table if not exists public.brand_follows (
  user_id    uuid not null references auth.users(id) on delete cascade,
  brand_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);
create index if not exists brand_follows_brand on public.brand_follows (brand_id);
alter table public.brand_follows enable row level security;

drop policy if exists "seguir: ver las mías" on public.brand_follows;
create policy "seguir: ver las mías" on public.brand_follows for select
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "seguir: seguir una marca" on public.brand_follows;
create policy "seguir: seguir una marca" on public.brand_follows for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.profiles where id = brand_id and role = 'brand'));
drop policy if exists "seguir: dejar de seguir" on public.brand_follows;
create policy "seguir: dejar de seguir" on public.brand_follows for delete
  using (user_id = auth.uid() or public.is_admin());

-- número de seguidores de cada marca (público: no dice quién sigue a quién)
create or replace function public.brand_follower_counts()
returns table (brand_id uuid, n bigint) language sql stable security definer set search_path = public as $$
  select f.brand_id, count(*) from public.brand_follows f group by f.brand_id
$$;
revoke all on function public.brand_follower_counts() from public;
grant execute on function public.brand_follower_counts() to anon, authenticated;

notify pgrst, 'reload schema';
