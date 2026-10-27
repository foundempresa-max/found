-- ==========================================================
-- FOUND · ESTADÍSTICAS DE CLICS PARA LAS MARCAS
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
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
