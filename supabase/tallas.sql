-- ==========================================================
-- FOUND · TALLAS
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
-- ==========================================================

-- 1) Tallas disponibles de cada prenda (por ejemplo {S,M,L} o {38,39,40} o {Única})
alter table public.products add column if not exists sizes text[] not null default '{}';

-- 2) Talla habitual de cada comprador (la elige en el test de estilo)
alter table public.profiles add column if not exists sizes text[] not null default '{}';

-- 3) Solo se aceptan tallas válidas (como máximo 20 por prenda)
alter table public.products drop constraint if exists products_sizes_check;
alter table public.products add constraint products_sizes_check check (
  cardinality(sizes) <= 20
  and sizes <@ array['XXS','XS','S','M','L','XL','XXL',
                     '35','36','37','38','39','40','41','42','43','44','45','46','Única']::text[]
);
alter table public.profiles drop constraint if exists profiles_sizes_check;
alter table public.profiles add constraint profiles_sizes_check check (cardinality(sizes) <= 20);

-- 4) Para que la web vea las columnas nuevas al momento
notify pgrst, 'reload schema';
