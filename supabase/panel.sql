-- ==========================================================
-- FOUND · PANEL DE CREADOR: RANKING DE MARCAS Y CORREOS BLOQUEADOS
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
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

notify pgrst, 'reload schema';
