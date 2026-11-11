-- ==========================================================
-- FOUND · MUJER, HOMBRE O UNISEX (v26, 11 nov 2026)
-- Cada prenda dice para quién es; cada comprador elige qué quiere ver
-- (Todo, Mujer u Hombre). Las prendas unisex salen en las dos opciones.
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- ==========================================================

-- para quién es cada prenda (las que ya existían quedan como unisex)
alter table public.products add column if not exists gender text not null default 'unisex';
alter table public.products drop constraint if exists products_gender_ok;
alter table public.products add  constraint products_gender_ok check (gender in ('mujer', 'hombre', 'unisex'));
create index if not exists products_gender on public.products (gender);

-- qué quiere ver cada comprador (se guarda con sus gustos)
alter table public.profiles add column if not exists gender_pref text;
alter table public.profiles drop constraint if exists profiles_gender_pref_ok;
alter table public.profiles add  constraint profiles_gender_pref_ok check (gender_pref is null or gender_pref in ('todo', 'mujer', 'hombre'));

notify pgrst, 'reload schema';
