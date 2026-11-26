-- FOUND v35 · el Creador puede gestionar marcas (subir prendas en su nombre)
-- Ya podía: editar perfiles y prendas, subir y borrar fotos de cualquier carpeta.
-- Faltaba: crear prendas a nombre de una marca. Solo el Creador, y solo para cuentas de marca.

drop policy if exists "productos: el creador crea para una marca" on public.products;
create policy "productos: el creador crea para una marca" on public.products
  for insert to authenticated
  with check (
    public.is_admin()
    and exists (select 1 from public.profiles p where p.id = brand_id and p.role = 'brand')
  );
