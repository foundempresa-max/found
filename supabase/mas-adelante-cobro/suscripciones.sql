-- ==========================================================
-- FOUND · SUSCRIPCIÓN MENSUAL DE MARCAS (Stripe)
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- ⚠️ NO lo ejecutes hasta tener Stripe listo: en cuanto se ejecuta,
--    las marcas sin suscripción dejan de mostrarse.
-- ==========================================================

-- 1) Estado de la suscripción de cada marca.
--    Solo lo escriben Stripe (a través de la función stripe-webhook) y el creador.
create table if not exists public.brand_billing (
  brand_id               uuid primary key references public.profiles(id) on delete cascade,
  status                 text not null default 'none',   -- none | active | trialing | past_due | unpaid | canceled | incomplete...
  current_period_end     timestamptz,                    -- hasta cuándo está pagado el mes en curso
  cancel_at_period_end   boolean not null default false, -- la marca ha pedido cancelar al final del mes
  manual                 boolean not null default false, -- activada a mano por el creador (sin pagar en Stripe)
  stripe_customer_id     text unique,
  stripe_subscription_id text,
  updated_at             timestamptz not null default now()
);
alter table public.brand_billing enable row level security;

drop policy if exists "suscripción: la marca ve la suya" on public.brand_billing;
create policy "suscripción: la marca ve la suya" on public.brand_billing
  for select using (brand_id = auth.uid() or public.is_admin());

drop policy if exists "suscripción: solo el creador la cambia" on public.brand_billing;
create policy "suscripción: solo el creador la cambia" on public.brand_billing
  for all using (public.is_admin()) with check (public.is_admin());

-- 2) ¿Esta marca tiene la suscripción en vigor?
--    past_due = Stripe está reintentando el cobro: se mantiene visible mientras tanto.
create or replace function public.brand_is_active(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.brand_billing b
    where b.brand_id = uid
      and (b.manual or b.status in ('active', 'trialing', 'past_due'))
  )
$$;
grant execute on function public.brand_is_active(uuid) to anon, authenticated;

-- 3) Solo se ven las prendas de marcas con suscripción en vigor
--    (la propia marca y el creador siempre ven las suyas / todas).
drop policy if exists "productos: ver todos" on public.products;
drop policy if exists "productos: ver los de marcas activas" on public.products;
create policy "productos: ver los de marcas activas" on public.products
  for select using (public.brand_is_active(brand_id) or brand_id = auth.uid() or public.is_admin());

-- 4) Solo una marca con suscripción en vigor puede publicar o editar prendas
drop policy if exists "productos: la marca crea los suyos" on public.products;
create policy "productos: la marca crea los suyos" on public.products
  for insert with check (
    (brand_id = auth.uid()
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'brand')
      and public.brand_is_active(auth.uid()))
    or public.is_admin()
  );

drop policy if exists "productos: la marca edita los suyos" on public.products;
create policy "productos: la marca edita los suyos" on public.products
  for update using ((brand_id = auth.uid() and public.brand_is_active(auth.uid())) or public.is_admin())
  with check ((brand_id = auth.uid() and public.brand_is_active(auth.uid())) or public.is_admin());

-- (borrar sus prendas lo puede hacer siempre)

-- 5) Subir fotos también exige suscripción en vigor
drop policy if exists "fotos: subir en tu carpeta" on storage.objects;
create policy "fotos: subir en tu carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images'
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.brand_is_active(auth.uid()));
