-- ==========================================================
-- FOUND · MODERACIÓN DE PRENDAS Y DENUNCIAS
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
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
