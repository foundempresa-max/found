-- ==========================================================
-- FOUND · MENSAJES ENTRE LAS MARCAS Y EL CREADOR
-- Pégalo en Supabase > SQL Editor > New query > Run.
-- Se puede ejecutar varias veces sin problema.
-- (También está incluido al final de schema.sql)
-- ==========================================================

-- 1) Mensajes: una conversación por marca (la marca y tú)
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  brand_id    uuid not null references public.profiles(id) on delete cascade,
  from_admin  boolean not null,                       -- true = lo escribe el creador
  sender      uuid default auth.uid() references auth.users(id) on delete set null,
  body        text not null check (char_length(btrim(body)) between 1 and 2000),
  product_id  uuid references public.products(id) on delete set null,   -- prenda de la que se habla (opcional)
  created_at  timestamptz not null default now(),
  read_at     timestamptz
);
create index if not exists messages_brand_idx on public.messages (brand_id, created_at desc);
create index if not exists messages_unread_idx on public.messages (from_admin) where read_at is null;

alter table public.messages enable row level security;

-- Cada marca ve solo su conversación; el creador las ve todas
drop policy if exists "mensajes: ver" on public.messages;
create policy "mensajes: ver" on public.messages
  for select using (brand_id = auth.uid() or public.is_admin());

-- Escribir: el creador a cualquier marca; la marca solo en su conversación.
-- Nadie puede firmar como otro, y la prenda (si se indica) tiene que ser de esa marca.
drop policy if exists "mensajes: escribir" on public.messages;
create policy "mensajes: escribir" on public.messages
  for insert with check (
    sender = auth.uid()
    and (
      (from_admin and public.is_admin())
      or (not from_admin and brand_id = auth.uid()
          and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'brand'))
    )
    and (product_id is null
         or exists (select 1 from public.products x where x.id = product_id and x.brand_id = messages.brand_id))
  );
-- (no hay permisos para editar ni borrar mensajes: quedan como registro)

-- 2) Marcar como leídos los mensajes que te han enviado
create or replace function public.chat_mark_read(p_brand uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    update public.messages set read_at = now() where brand_id = p_brand and not from_admin and read_at is null;
  elsif auth.uid() = p_brand then
    update public.messages set read_at = now() where brand_id = p_brand and from_admin and read_at is null;
  end if;
end $$;
revoke all on function public.chat_mark_read(uuid) from public, anon;
grant execute on function public.chat_mark_read(uuid) to authenticated;

-- 3) Mensajes al instante (sin recargar la página)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

notify pgrst, 'reload schema';
