-- ==========================================================
-- FOUND · esquema de base de datos (Supabase / PostgreSQL)
-- Pégalo entero en Supabase > SQL Editor > New query > Run
-- ==========================================================

-- 1) Perfiles (compradores y marcas)
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          text not null default 'buyer' check (role in ('buyer','brand')),
  brand_name    text,
  brand_bio     text,
  contact_email text,
  styles        text[] not null default '{}',
  cats          text[] not null default '{}',
  budget        int    not null default 150,
  created_at    timestamptz not null default now()
);

-- 2) Productos
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  brand_id    uuid not null references public.profiles(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  price       numeric(10,2) not null check (price > 0),
  category    text not null,
  tags        text[] not null default '{}',
  color       text not null default '#E6335F',
  description text not null default '',
  image_url   text,
  buy_url     text,
  created_at  timestamptz not null default now()
);
create index if not exists products_brand_idx on public.products(brand_id);
create index if not exists products_created_idx on public.products(created_at desc);

-- 3) Favoritos
create table if not exists public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- 4) Seguridad por filas (RLS): cada persona solo toca lo suyo
alter table public.profiles  enable row level security;
alter table public.products  enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "perfiles: ver marcas y el propio" on public.profiles;
create policy "perfiles: ver marcas y el propio" on public.profiles
  for select using (role = 'brand' or id = auth.uid());

drop policy if exists "perfiles: editar el propio" on public.profiles;
create policy "perfiles: editar el propio" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "productos: ver todos" on public.products;
create policy "productos: ver todos" on public.products
  for select using (true);

drop policy if exists "productos: la marca crea los suyos" on public.products;
create policy "productos: la marca crea los suyos" on public.products
  for insert with check (
    brand_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'brand')
  );

drop policy if exists "productos: la marca edita los suyos" on public.products;
create policy "productos: la marca edita los suyos" on public.products
  for update using (brand_id = auth.uid()) with check (brand_id = auth.uid());

drop policy if exists "productos: la marca borra los suyos" on public.products;
create policy "productos: la marca borra los suyos" on public.products
  for delete using (brand_id = auth.uid());

drop policy if exists "favoritos: ver los propios" on public.favorites;
create policy "favoritos: ver los propios" on public.favorites
  for select using (user_id = auth.uid());

drop policy if exists "favoritos: guardar los propios" on public.favorites;
create policy "favoritos: guardar los propios" on public.favorites
  for insert with check (user_id = auth.uid());

drop policy if exists "favoritos: quitar los propios" on public.favorites;
create policy "favoritos: quitar los propios" on public.favorites
  for delete using (user_id = auth.uid());

-- 5) Al registrarse alguien, se crea su perfil automáticamente
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, brand_name, contact_email)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'brand' then 'brand' else 'buyer' end,
    nullif(new.raw_user_meta_data->>'brand_name', ''),
    case when new.raw_user_meta_data->>'role' = 'brand' then new.email else null end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Cuántas veces se ha guardado cada producto de la marca (solo ve los suyos)
create or replace function public.product_save_counts()
returns table(product_id uuid, saves bigint)
language sql security definer set search_path = public as $$
  select f.product_id, count(*)
  from public.favorites f
  join public.products p on p.id = f.product_id
  where p.brand_id = auth.uid()
  group by f.product_id
$$;
revoke all on function public.product_save_counts() from public, anon;
grant execute on function public.product_save_counts() to authenticated;

-- 7) Almacén de fotos de producto
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "fotos: lectura pública" on storage.objects;
create policy "fotos: lectura pública" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "fotos: subir en tu carpeta" on storage.objects;
create policy "fotos: subir en tu carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "fotos: borrar las tuyas" on storage.objects;
create policy "fotos: borrar las tuyas" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ==========================================================
-- 8) PANEL DE CREADOR (admin)
-- Puedes volver a ejecutar todo este archivo sin problema.
-- ==========================================================
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('buyer','brand','admin'));
alter table public.products add column if not exists featured boolean not null default false;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
$$;

-- Nadie puede ascenderse a sí mismo: solo un admin (o tú desde el SQL Editor) cambia roles
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'No puedes cambiar tu tipo de cuenta';
  end if;
  return new;
end $$;
drop trigger if exists protect_role on public.profiles;
create trigger protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- El admin puede ver todo y moderar
drop policy if exists "perfiles: ver marcas y el propio" on public.profiles;
create policy "perfiles: ver marcas y el propio" on public.profiles
  for select using (role = 'brand' or id = auth.uid() or public.is_admin());

drop policy if exists "perfiles: editar el propio" on public.profiles;
create policy "perfiles: editar el propio" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "productos: la marca edita los suyos" on public.products;
create policy "productos: la marca edita los suyos" on public.products
  for update using (brand_id = auth.uid() or public.is_admin())
  with check (brand_id = auth.uid() or public.is_admin());

drop policy if exists "productos: la marca borra los suyos" on public.products;
create policy "productos: la marca borra los suyos" on public.products
  for delete using (brand_id = auth.uid() or public.is_admin());

drop policy if exists "favoritos: ver los propios" on public.favorites;
create policy "favoritos: ver los propios" on public.favorites
  for select using (user_id = auth.uid() or public.is_admin());

-- Ajustes de la web (nombre, color, aviso, estilos, categorías)
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;

drop policy if exists "ajustes: leer todos" on public.site_settings;
create policy "ajustes: leer todos" on public.site_settings for select using (true);

drop policy if exists "ajustes: solo el creador escribe" on public.site_settings;
create policy "ajustes: solo el creador escribe" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ==========================================================
-- 9) ESTADÍSTICAS DE CLICS PARA LAS MARCAS
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- ==========================================================

-- 1) Registro de clics: 'view' = abrir la prenda, 'buy' = pulsar Comprar / Preguntar a la marca
create table if not exists public.product_events (
  id          bigserial primary key,
  product_id  uuid not null references public.products(id) on delete cascade,
  brand_id    uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('view', 'buy')),
  visitor     text,
  created_at  timestamptz not null default now()
);
create index if not exists product_events_brand_idx on public.product_events(brand_id, created_at desc);
create index if not exists product_events_dedupe_idx on public.product_events(product_id, kind, visitor, created_at desc);
alter table public.product_events enable row level security;
-- Nadie lee ni escribe la tabla directamente: solo a través de las dos funciones de abajo.
drop policy if exists "clics: el creador los ve" on public.product_events;
create policy "clics: el creador los ve" on public.product_events for select using (public.is_admin());

-- 2) Apuntar un clic (lo llama la web; vale para visitantes sin cuenta)
--    No cuenta los clics de la propia marca ni del creador, y si la misma persona
--    repite el mismo clic en la misma prenda en menos de 30 minutos, solo cuenta uno.
create or replace function public.track_event(p_product uuid, p_kind text, p_visitor text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_brand uuid;
begin
  if p_kind not in ('view', 'buy') then return; end if;
  select brand_id into v_brand from public.products where id = p_product;
  if v_brand is null then return; end if;
  if auth.uid() is not null and (auth.uid() = v_brand or public.is_admin()) then return; end if;
  p_visitor := left(coalesce(p_visitor, ''), 64);
  if p_visitor <> '' and exists (
    select 1 from public.product_events
    where product_id = p_product and kind = p_kind and visitor = p_visitor
      and created_at > now() - interval '30 minutes'
  ) then return; end if;
  insert into public.product_events(product_id, brand_id, kind, visitor)
  values (p_product, v_brand, p_kind, nullif(p_visitor, ''));
end $$;
revoke all on function public.track_event(uuid, text, text) from public;
grant execute on function public.track_event(uuid, text, text) to anon, authenticated;

-- 3) Clics por prenda para el panel de la marca (solo ve los suyos; el creador ve todos)
--    p_days = 7, 30... o null para "desde siempre"
create or replace function public.product_event_counts(p_days int default null)
returns table(product_id uuid, views bigint, buys bigint)
language sql stable security definer set search_path = public as $$
  select e.product_id,
         count(*) filter (where e.kind = 'view'),
         count(*) filter (where e.kind = 'buy')
  from public.product_events e
  where (e.brand_id = auth.uid() or public.is_admin())
    and (p_days is null or e.created_at > now() - make_interval(days => p_days))
  group by e.product_id
$$;
revoke all on function public.product_event_counts(int) from public, anon;
grant execute on function public.product_event_counts(int) to authenticated;

-- ==========================================================
-- 10) LOGO Y PORTADA DE CADA MARCA
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
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

-- ----------------------------------------------------------
-- HAZTE CREADOR: cambia el correo por el tuyo, regístrate
-- primero en la web con ese correo y luego ejecuta SOLO esto:
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'TU_CORREO@EJEMPLO.COM');
-- ----------------------------------------------------------

-- ==========================================================
-- TALLAS (igual que supabase/tallas.sql)
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

-- ==========================================================
-- VISITAS DE LA WEB (igual que supabase/analitica.sql)
-- ==========================================================
-- 1) Registro de lo que pasa en la web
create table if not exists public.site_events (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  kind        text not null,
  page        text,   -- 'inicio', 'descubrir', 'marca', 'prenda'... (en las búsquedas, lo que se buscó)
  source      text,   -- solo en las visitas: Instagram, TikTok, Google, Directo...
  device      text check (device in ('movil', 'ordenador')),
  visitor     text not null,
  results     int     -- en las búsquedas: cuántas prendas se encontraron
);
-- (si ya tenías la tabla de antes, se le añade lo nuevo)
alter table public.site_events add column if not exists results int;
alter table public.site_events drop constraint if exists site_events_kind_check;
alter table public.site_events add constraint site_events_kind_check check (kind in ('visit', 'page', 'test', 'signup', 'buy', 'share', 'search'));
create index if not exists site_events_time_idx on public.site_events(created_at desc);
create index if not exists site_events_visitor_idx on public.site_events(visitor, created_at desc);
alter table public.site_events enable row level security;
-- Sin políticas: nadie lee ni escribe la tabla directamente, solo con las funciones de abajo.

-- 2) Clave secreta para hacer anónima la huella (nadie puede leerla desde la web)
create table if not exists public.analytics_secret (
  id   int primary key default 1 check (id = 1),
  salt text not null default md5(random()::text || clock_timestamp()::text)
);
insert into public.analytics_secret (id) values (1) on conflict (id) do nothing;
alter table public.analytics_secret enable row level security;

-- 3) Apuntar un evento (lo llama la web; vale para visitantes sin cuenta)
drop function if exists public.log_site_event(text, text, text, text);
create or replace function public.log_site_event(
  p_kind text, p_page text default null, p_source text default null, p_device text default null, p_results int default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_h json; v_ip text; v_ua text; v_salt text; v_vis text;
begin
  if p_kind not in ('visit', 'page', 'test', 'signup', 'buy', 'share', 'search') then return; end if;
  if auth.uid() is not null and public.is_admin() then return; end if;   -- tus visitas no cuentan
  begin v_h := current_setting('request.headers', true)::json; exception when others then v_h := null; end;
  v_ip := trim(split_part(coalesce(v_h->>'cf-connecting-ip', v_h->>'x-forwarded-for', v_h->>'x-real-ip', ''), ',', 1));
  v_ua := left(coalesce(v_h->>'user-agent', ''), 300);
  select salt into v_salt from public.analytics_secret where id = 1;
  v_vis := md5(coalesce(v_salt, '') || current_date::text || v_ip || v_ua);
  -- freno contra abusos: como mucho 300 eventos por visitante y día
  if (select count(*) from public.site_events where visitor = v_vis and created_at > now() - interval '1 day') >= 300 then return; end if;
  insert into public.site_events (kind, page, source, device, visitor, results)
  values (p_kind, case when p_kind = 'search' then left(lower(trim(p_page)), 40) else left(p_page, 40) end,
          case when p_kind = 'visit' then left(coalesce(nullif(trim(p_source), ''), 'Directo'), 40) end,
          case when p_device in ('movil', 'ordenador') then p_device end, v_vis,
          case when p_kind = 'search' then greatest(p_results, 0) end);
  -- limpieza: se borran los datos de hace más de 13 meses
  if random() < 0.01 then delete from public.site_events where created_at < now() - interval '400 days'; end if;
end $$;
revoke all on function public.log_site_event(text, text, text, text, int) from public;
grant execute on function public.log_site_event(text, text, text, text, int) to anon, authenticated;

-- 4) Resumen para el panel de creador (solo el creador puede verlo)
--    p_days = 7, 30, 90... o null para "desde siempre". Días contados en hora de España.
create or replace function public.site_stats(p_days int default 30)
returns json language plpgsql stable security definer set search_path = public as $$
declare v_today date := (now() at time zone 'Europe/Madrid')::date; v_from date; v_prev date; v_res json;
begin
  if not public.is_admin() then raise exception 'Solo el creador puede ver las visitas'; end if;
  if p_days is null then
    select coalesce(min((created_at at time zone 'Europe/Madrid')::date), v_today) into v_from from public.site_events;
    v_from := greatest(v_from, v_today - 365);
  else
    v_from := v_today - (greatest(p_days, 1) - 1);
  end if;
  v_prev := v_from - (v_today - v_from + 1);
  with e as (
    select *, (created_at at time zone 'Europe/Madrid')::date as d from public.site_events
    where created_at >= (v_prev::timestamp at time zone 'Europe/Madrid')
  ), cur as (select * from e where d >= v_from), prev as (select * from e where d < v_from)
  select json_build_object(
    'from', v_from, 'to', v_today,
    'visits',   (select count(*) from cur where kind = 'visit'),
    'visitors', (select count(distinct visitor) from cur),
    'pages',    (select count(*) from cur where kind = 'page'),
    'tests',    (select count(distinct visitor) from cur where kind = 'test'),
    'signups',  (select count(*) from cur where kind = 'signup'),
    'buys',     (select count(*) from cur where kind = 'buy'),
    'buyers',   (select count(distinct visitor) from cur where kind = 'buy'),
    'shares',   (select count(*) from cur where kind = 'share'),
    'prevVisits', case when p_days is null then null else (select count(*) from prev where kind = 'visit') end,
    'daily', (select json_agg(json_build_object('d', g::date, 'n', coalesce(c.n, 0)) order by g)
              from generate_series(v_from, v_today, interval '1 day') g
              left join (select d, count(*) n from cur where kind = 'visit' group by d) c on c.d = g::date),
    'sources', (select coalesce(json_agg(json_build_object('k', k, 'n', n) order by n desc), '[]'::json)
                from (select coalesce(source, 'Directo') k, count(*) n from cur where kind = 'visit' group by 1 order by 2 desc limit 8) s),
    'topPages', (select coalesce(json_agg(json_build_object('k', k, 'n', n) order by n desc), '[]'::json)
                 from (select page k, count(*) n from cur where kind = 'page' and page is not null group by 1 order by 2 desc limit 8) s),
    'devices', (select coalesce(json_agg(json_build_object('k', k, 'n', n) order by n desc), '[]'::json)
                from (select device k, count(*) n from cur where kind = 'visit' and device is not null group by 1) s),
    'searchCount', (select count(*) from cur where kind = 'search'),
    'searches', (select coalesce(json_agg(json_build_object('k', k, 'n', n, 'zero', z) order by n desc), '[]'::json)
                 from (select page k, count(*) n, count(*) filter (where results = 0) z from cur
                       where kind = 'search' and page is not null group by 1 order by 2 desc limit 12) s),
    'zeroSearches', (select coalesce(json_agg(json_build_object('k', k, 'n', n) order by n desc), '[]'::json)
                     from (select page k, count(*) n from cur where kind = 'search' and results = 0 and page is not null
                           group by 1 order by 2 desc limit 12) s)
  ) into v_res;
  return v_res;
end $$;
revoke all on function public.site_stats(int) from public, anon;
grant execute on function public.site_stats(int) to authenticated;

notify pgrst, 'reload schema';

-- ==========================================================
-- GESTIONAR Y BORRAR CUENTAS (igual que supabase/cuentas.sql)
-- ==========================================================
-- 1) Lista de usuarios con su correo de registro (solo la ve el creador)
create or replace function public.admin_list_users()
returns table(id uuid, email text, role text, brand_name text, created_at timestamptz, last_sign_in_at timestamptz, products bigint)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Solo el creador puede ver los usuarios'; end if;
  return query
    select u.id, u.email::text, coalesce(p.role, 'buyer'), p.brand_name, u.created_at, u.last_sign_in_at,
           (select count(*) from public.products x where x.brand_id = u.id)
    from auth.users u left join public.profiles p on p.id = u.id
    order by u.created_at desc
    limit 2000;
end $$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- 2) Borrar una cuenta. Se borra todo lo suyo: perfil, prendas, guardados y estadísticas.
--    No se puede borrar la propia cuenta ni otra cuenta de creador.
create or replace function public.admin_delete_user(p_user uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then raise exception 'Solo el creador puede borrar cuentas'; end if;
  if p_user = auth.uid() then raise exception 'No puedes borrar tu propia cuenta desde aquí'; end if;
  if exists (select 1 from public.profiles where id = p_user and role = 'admin') then
    raise exception 'No se puede borrar una cuenta de creador. Cámbiala antes a comprador.';
  end if;
  delete from auth.users where id = p_user;
  if not found then raise exception 'Esa cuenta ya no existe'; end if;
end $$;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- 3) El creador puede borrar las fotos de cualquier cuenta (para no dejar fotos sueltas al borrarla)
drop policy if exists "fotos: el creador borra" on storage.objects;
create policy "fotos: el creador borra" on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'brand-images') and public.is_admin());

notify pgrst, 'reload schema';

-- ==========================================================
-- MODERACIÓN DE PRENDAS Y DENUNCIAS (igual que supabase/moderacion.sql)
-- ==========================================================
-- 1) Estado de cada prenda: pendiente de revisar, aprobada o rechazada.
--    Las prendas que ya estaban publicadas quedan aprobadas.
alter table public.products add column if not exists status text not null default 'approved';
alter table public.products add column if not exists reject_reason text;
alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check check (status in ('pending', 'approved', 'rejected'));
create index if not exists products_status_idx on public.products(status);

-- 2) Las marcas no pueden aprobarse a sí mismas: la base de datos decide el estado.
--    · Prenda nueva → pendiente (o aprobada si apagas la revisión en Creador > Ajustes).
--    · Si la marca cambia la foto o el nombre de una prenda aprobada → vuelve a revisión.
--    · Si edita una prenda rechazada → vuelve a revisión.
--    · Solo el creador aprueba o rechaza.
-- (la columna de fotos se crea aquí también por si aún no se ha ejecutado fotos.sql)
alter table public.products add column if not exists images text[] not null default '{}';
create or replace function public.products_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_on boolean;
begin
  if public.is_admin() then return new; end if;
  select coalesce((value->>'moderation')::boolean, true) into v_on from public.site_settings where key = 'main';
  v_on := coalesce(v_on, true);
  if tg_op = 'INSERT' then
    new.status := case when v_on then 'pending' else 'approved' end;
    new.reject_reason := null;
  elsif old.status = 'rejected' or (old.status = 'approved' and v_on and
        (new.image_url is distinct from old.image_url or new.images is distinct from old.images or new.name is distinct from old.name)) then
    new.status := case when v_on then 'pending' else 'approved' end;
    new.reject_reason := null;
  else
    new.status := old.status;
    new.reject_reason := old.reject_reason;
  end if;
  return new;
end $$;
drop trigger if exists products_moderation on public.products;
create trigger products_moderation before insert or update on public.products
  for each row execute function public.products_moderation();

-- 3) Los visitantes solo ven las prendas aprobadas (la marca ve las suyas y el creador todas).
--    Es una regla «restrictiva»: se suma a las demás, también a la del cobro a marcas.
drop policy if exists "productos: solo aprobadas" on public.products;
create policy "productos: solo aprobadas" on public.products as restrictive
  for select using (status = 'approved' or brand_id = auth.uid() or public.is_admin());

-- 4) Denuncias de prendas
create table if not exists public.reports (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  product_id  uuid not null references public.products(id) on delete cascade,
  reason      text not null check (reason in ('falsificacion', 'inapropiado', 'enlace', 'enganoso', 'otro')),
  details     text check (char_length(details) <= 500),
  reporter    uuid references auth.users(id) on delete set null,
  visitor     text,
  status      text not null default 'open' check (status in ('open', 'resolved'))
);
create index if not exists reports_status_idx on public.reports(status, created_at desc);
alter table public.reports enable row level security;
drop policy if exists "denuncias: el creador las ve" on public.reports;
create policy "denuncias: el creador las ve" on public.reports for select using (public.is_admin());
drop policy if exists "denuncias: el creador las gestiona" on public.reports;
create policy "denuncias: el creador las gestiona" on public.reports for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "denuncias: el creador las borra" on public.reports;
create policy "denuncias: el creador las borra" on public.reports for delete using (public.is_admin());

-- 5) Enviar una denuncia (lo llama la web; vale para visitantes sin cuenta).
--    Freno contra abusos: la misma persona, una vez por prenda y como mucho 10 al día.
create or replace function public.report_product(p_product uuid, p_reason text, p_details text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_h json; v_vis text;
begin
  if p_reason not in ('falsificacion', 'inapropiado', 'enlace', 'enganoso', 'otro') then raise exception 'Motivo no válido'; end if;
  if not exists (select 1 from public.products where id = p_product) then raise exception 'Esa prenda ya no existe'; end if;
  begin v_h := current_setting('request.headers', true)::json; exception when others then v_h := null; end;
  v_vis := md5(current_date::text || coalesce(auth.uid()::text, '') ||
               trim(split_part(coalesce(v_h->>'cf-connecting-ip', v_h->>'x-forwarded-for', ''), ',', 1)) ||
               left(coalesce(v_h->>'user-agent', ''), 300));
  if exists (select 1 from public.reports where product_id = p_product and visitor = v_vis) then return; end if;
  if (select count(*) from public.reports where visitor = v_vis and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Has enviado muchas denuncias hoy. Inténtalo mañana.';
  end if;
  insert into public.reports (product_id, reason, details, reporter, visitor)
  values (p_product, p_reason, nullif(left(trim(coalesce(p_details, '')), 500), ''), auth.uid(), v_vis);
end $$;
revoke all on function public.report_product(uuid, text, text) from public;
grant execute on function public.report_product(uuid, text, text) to anon, authenticated;

notify pgrst, 'reload schema';

-- ==========================================================
-- FOTOS DE LOS ESTILOS (igual que supabase/fotos-estilos.sql)
-- ==========================================================
-- El creador puede subir imágenes (por ejemplo, la foto de cada estilo).
-- Las marcas siguen pudiendo subir solo a su propia carpeta.
drop policy if exists "fotos: el creador sube" on storage.objects;
create policy "fotos: el creador sube" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'brand-images') and public.is_admin());

-- ==========================================================
-- RANKING Y CORREOS BLOQUEADOS (igual que supabase/panel.sql)
-- ==========================================================
-- 1) Guardados de todas las prendas (para el ranking de marcas; solo lo ve el creador)
create or replace function public.admin_save_counts()
returns table(product_id uuid, saves bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Solo el creador puede ver esto'; end if;
  return query select f.product_id, count(*) from public.favorites f group by f.product_id;
end $$;
revoke all on function public.admin_save_counts() from public, anon;
grant execute on function public.admin_save_counts() to authenticated;

-- 2) Correos bloqueados: no pueden crear una cuenta nueva
create table if not exists public.blocked_emails (
  email      text primary key check (email = lower(email) and char_length(email) between 3 and 254),
  reason     text check (char_length(reason) <= 200),
  created_at timestamptz not null default now()
);
alter table public.blocked_emails enable row level security;
drop policy if exists "bloqueados: el creador los ve" on public.blocked_emails;
create policy "bloqueados: el creador los ve" on public.blocked_emails for select using (public.is_admin());
drop policy if exists "bloqueados: el creador los añade" on public.blocked_emails;
create policy "bloqueados: el creador los añade" on public.blocked_emails for insert with check (public.is_admin());
drop policy if exists "bloqueados: el creador los quita" on public.blocked_emails;
create policy "bloqueados: el creador los quita" on public.blocked_emails for delete using (public.is_admin());

-- Al registrarse alguien, si su correo está bloqueado, el registro se rechaza
create or replace function public.block_banned_signups()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.blocked_emails where email = lower(trim(new.email))) then
    raise exception 'FOUND_EMAIL_BLOQUEADO';
  end if;
  return new;
end $$;
drop trigger if exists block_banned_signups on auth.users;
create trigger block_banned_signups before insert on auth.users
  for each row execute function public.block_banned_signups();

-- ==========================================================
-- MENSAJES ENTRE LAS MARCAS Y EL CREADOR (igual que supabase/mensajes.sql)
-- ==========================================================

-- 1) Mensajes: una conversación por marca (la marca y tú)
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  brand_id    uuid not null references public.profiles(id) on delete cascade,
  from_admin  boolean not null,                       -- true = lo escribe el creador
  sender      uuid default auth.uid() references auth.users(id) on delete set null,
  body        text not null check (char_length(btrim(body)) between 1 and 2000),
  product_id  uuid references public.products(id) on delete set null,   -- prenda de la que se habla (opcional)
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists messages_brand_idx on public.messages (brand_id, created_at desc);
create index if not exists messages_unread_idx on public.messages (from_admin) where read_at is null;

alter table public.messages enable row level security;

-- Cada marca ve solo su conversación; el creador las ve todas
drop policy if exists "mensajes: ver" on public.messages;
create policy "mensajes: ver" on public.messages
  for select using (brand_id = auth.uid() or public.is_admin());

-- Escribir: el creador a cualquier marca; la marca solo en su conversación.
-- Nadie puede firmar como otro, y la prenda (si se indica) tiene que ser de esa marca.
drop policy if exists "mensajes: escribir" on public.messages;
create policy "mensajes: escribir" on public.messages
  for insert with check (
    sender = auth.uid()
    and (
      (from_admin and public.is_admin())
      or (not from_admin and brand_id = auth.uid()
          and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'brand'))
    )
    and (product_id is null
         or exists (select 1 from public.products x where x.id = product_id and x.brand_id = messages.brand_id))
  );
-- (no hay permisos para editar ni borrar mensajes: quedan como registro)

-- 2) Marcar como leídos los mensajes que te han enviado
create or replace function public.chat_mark_read(p_brand uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    update public.messages set read_at = now() where brand_id = p_brand and not from_admin and read_at is null;
  elsif auth.uid() = p_brand then
    update public.messages set read_at = now() where brand_id = p_brand and from_admin and read_at is null;
  end if;
end $$;
revoke all on function public.chat_mark_read(uuid) from public, anon;
grant execute on function public.chat_mark_read(uuid) to authenticated;

-- 3) Mensajes al instante (sin recargar la página)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

notify pgrst, 'reload schema';

-- ==========================================================
-- VARIAS FOTOS POR PRENDA (igual que fotos.sql)
-- ==========================================================

-- 1) Lista de fotos de cada prenda, en orden. La primera es la portada
--    (se sigue guardando también en image_url, así todo lo demás funciona igual).
alter table public.products add column if not exists images text[] not null default '{}';

-- 2) Las prendas que ya tenían foto pasan a tener esa foto como portada.
update public.products set images = array[image_url]
where image_url is not null and cardinality(images) = 0
  and image_url ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/product-images/' || brand_id::text || '/[A-Za-z0-9._-]+$');

-- 3) Como máximo 5 fotos, y solo fotos que la propia marca ha subido a su carpeta.
create or replace function public.product_images_ok(p_images text[], p_brand uuid)
returns boolean language sql immutable as $$
  select cardinality(p_images) <= 5 and coalesce(bool_and(u ~ ('^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/product-images/' || p_brand::text || '/[A-Za-z0-9._-]+$')), true)
  from unnest(p_images) as u
$$;
alter table public.products drop constraint if exists products_images_check;
alter table public.products add constraint products_images_check check (public.product_images_ok(images, brand_id));

-- 4) Si la revisión de prendas está activada (moderacion.sql): cambiar cualquier foto
--    de una prenda aprobada la devuelve a revisión, igual que cambiar el nombre.
do $mod$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'status') then
    execute $f$
      create or replace function public.products_moderation()
      returns trigger language plpgsql security definer set search_path = public as $body$
      declare v_on boolean;
      begin
        if public.is_admin() then return new; end if;
        select coalesce((value->>'moderation')::boolean, true) into v_on from public.site_settings where key = 'main';
        v_on := coalesce(v_on, true);
        if tg_op = 'INSERT' then
          new.status := case when v_on then 'pending' else 'approved' end;
          new.reject_reason := null;
        elsif old.status = 'rejected' or (old.status = 'approved' and v_on and
              (new.image_url is distinct from old.image_url or new.images is distinct from old.images or new.name is distinct from old.name)) then
          new.status := case when v_on then 'pending' else 'approved' end;
          new.reject_reason := null;
        else
          new.status := old.status;
          new.reject_reason := old.reject_reason;
        end if;
        return new;
      end $body$;
    $f$;
  end if;
end $mod$;

-- 5) Para que la web vea la columna nueva al momento
notify pgrst, 'reload schema';
