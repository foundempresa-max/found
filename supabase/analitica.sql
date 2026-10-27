-- ==========================================================
-- FOUND · VISITAS DE LA WEB (se ven en Panel de creador > Visitas)
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
--
-- Sin cookies y sin datos personales: cada visitante se identifica con una
-- huella anónima (mezcla cifrada de su conexión y su navegador) que cambia
-- cada día, así que una misma persona cuenta como un visitante por día y no
-- se puede saber quién es. Las visitas del creador no cuentan.
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
