-- ==========================================================
-- FOUND · GESTIONAR Y BORRAR CUENTAS DESDE EL PANEL DE CREADOR
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
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
