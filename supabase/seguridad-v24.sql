-- FOUND · arreglos de seguridad (9 nov 2026)
-- Se puede ejecutar varias veces sin problema.

-- 1. (Sin cambios) La lectura de prendas ya era correcta: «solo aprobadas» es RESTRICTIVA y
--    «ver todos» es la que da el permiso base. NO borrar «productos: ver todos»: sin ella no se ve ninguna prenda.

-- 2. Solo el Creador puede marcar una prenda como destacada.
create or replace function public.products_moderation() returns trigger
language plpgsql security definer set search_path to 'public' as $function$
declare v_on boolean;
begin
  if public.is_admin() then return new; end if;
  -- una marca no puede destacarse a sí misma
  if tg_op = 'INSERT' then new.featured := false; else new.featured := old.featured; end if;
  select coalesce((value->>'moderation')::boolean, true) into v_on from public.site_settings where key = 'main';
  v_on := coalesce(v_on, true);
  if tg_op = 'INSERT' then
    new.status := case when v_on then 'pending' else 'approved' end; new.reject_reason := null;
  elsif old.status = 'rejected' or (old.status = 'approved' and v_on and (new.image_url is distinct from old.image_url or new.images is distinct from old.images or new.name is distinct from old.name)) then
    new.status := case when v_on then 'pending' else 'approved' end; new.reject_reason := null;
  else
    new.status := old.status; new.reject_reason := old.reject_reason;
  end if;
  return new;
end $function$;

-- 3. Límites de tamaño en los textos libres (algo por encima de lo que permite la web)
alter table public.products drop constraint if exists products_description_len;
alter table public.products add constraint products_description_len check (description is null or char_length(description) <= 1000);
alter table public.products drop constraint if exists products_category_len;
alter table public.products add constraint products_category_len check (category is null or char_length(category) <= 40);
alter table public.products drop constraint if exists products_tags_len;
alter table public.products add constraint products_tags_len check (tags is null or (cardinality(tags) <= 12 and char_length(array_to_string(tags, '')) <= 12 * 30));
alter table public.products drop constraint if exists products_image_url_check;
alter table public.products add constraint products_image_url_check check (image_url is null or public.product_images_ok(array[image_url], brand_id));
alter table public.profiles drop constraint if exists profiles_brand_name_len;
alter table public.profiles add constraint profiles_brand_name_len check (brand_name is null or char_length(brand_name) <= 60);
alter table public.profiles drop constraint if exists profiles_brand_bio_len;
alter table public.profiles add constraint profiles_brand_bio_len check (brand_bio is null or char_length(brand_bio) <= 600);
alter table public.profiles drop constraint if exists profiles_lists_len;
alter table public.profiles add constraint profiles_lists_len check (coalesce(cardinality(styles), 0) <= 20 and coalesce(cardinality(cats), 0) <= 20);

-- 4. Ajuste interno pendiente (search_path fijo)
alter function public.product_images_ok(text[], uuid) set search_path to 'public';

-- 5. Las funciones que solo se usan como disparadores no se pueden llamar desde fuera
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.block_banned_signups() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;
revoke execute on function public.products_moderation() from public, anon, authenticated;
