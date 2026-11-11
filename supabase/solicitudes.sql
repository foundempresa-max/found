-- ==========================================================
-- FOUND · SOLICITUDES DE MARCAS (v24.7, 11 nov 2026)
-- Las marcas piden entrar desde «Vende en FOUND». El Creador las aprueba o
-- rechaza en su panel. Solo un correo aprobado puede crear una cuenta de marca
-- (mientras «Solo marcas aprobadas» esté encendido en Ajustes de la web).
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- ==========================================================

-- 1) Tabla de solicitudes
create table if not exists public.brand_applications (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  brand_name  text not null check (char_length(trim(brand_name)) between 1 and 60),
  email       text not null check (char_length(email) <= 200 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  instagram   text check (instagram is null or char_length(instagram) <= 200),
  website     text check (website is null or char_length(website) <= 300),
  city        text check (city is null or char_length(city) <= 80),
  categories  text[] not null default '{}' check (cardinality(categories) <= 12),
  about       text check (about is null or char_length(about) <= 600),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz
);
-- una sola solicitud pendiente por correo
create unique index if not exists brand_applications_pending_email
  on public.brand_applications (lower(email)) where status = 'pending';
create index if not exists brand_applications_created on public.brand_applications (created_at desc);

alter table public.brand_applications enable row level security;

-- cualquiera puede enviar una solicitud (siempre entra como pendiente)
drop policy if exists "solicitudes: cualquiera envía" on public.brand_applications;
create policy "solicitudes: cualquiera envía" on public.brand_applications
  for insert to anon, authenticated
  with check (status = 'pending' and reviewed_at is null);
-- solo el Creador las ve, las cambia y las borra
drop policy if exists "solicitudes: el creador las ve" on public.brand_applications;
create policy "solicitudes: el creador las ve" on public.brand_applications for select using (public.is_admin());
drop policy if exists "solicitudes: el creador las cambia" on public.brand_applications;
create policy "solicitudes: el creador las cambia" on public.brand_applications for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "solicitudes: el creador las borra" on public.brand_applications;
create policy "solicitudes: el creador las borra" on public.brand_applications for delete using (public.is_admin());

-- 2) Antispam: correo en minúsculas y como mucho 20 solicitudes por hora en toda la web
create or replace function public.brand_applications_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email));
  if not public.is_admin() then
    new.status := 'pending';
    new.reviewed_at := null;
    if (select count(*) from public.brand_applications where created_at > now() - interval '1 hour') >= 20 then
      raise exception 'FOUND_DEMASIADAS_SOLICITUDES';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists brand_applications_guard on public.brand_applications;
create trigger brand_applications_guard before insert on public.brand_applications
  for each row execute function public.brand_applications_guard();
revoke execute on function public.brand_applications_guard() from public, anon, authenticated;

-- 3) ¿Está encendido «Solo marcas aprobadas»? (por defecto, sí)
create or replace function public.brand_approval_on()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select (value->>'brandApproval')::boolean from public.site_settings where key = 'main'), true)
$$;

-- 4) La web pregunta antes de registrar una marca si ese correo puede (solo devuelve sí o no)
create or replace function public.brand_signup_allowed(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select not public.brand_approval_on()
      or exists (select 1 from public.brand_applications where email = lower(trim(p_email)) and status = 'approved')
$$;
revoke all on function public.brand_signup_allowed(text) from public;
grant execute on function public.brand_signup_allowed(text) to anon, authenticated;

-- 5) Y la base de datos lo hace cumplir: una cuenta de marca sin aprobar no se crea
create or replace function public.require_brand_approval()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.raw_user_meta_data->>'role' = 'brand' and not public.brand_signup_allowed(new.email) then
    raise exception 'FOUND_MARCA_NO_APROBADA';
  end if;
  return new;
end $$;
drop trigger if exists require_brand_approval on auth.users;
create trigger require_brand_approval before insert on auth.users
  for each row execute function public.require_brand_approval();
revoke execute on function public.require_brand_approval() from public, anon, authenticated;

notify pgrst, 'reload schema';
