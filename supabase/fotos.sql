-- ==========================================================
-- FOUND · VARIAS FOTOS POR PRENDA (hasta 5)
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
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
