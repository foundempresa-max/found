-- ==========================================================
-- FOUND · pruebas de seguridad (se pueden repetir cuando quieras)
-- Simula a un visitante anónimo, un comprador y una marca intentando
-- saltarse las reglas. Todo ocurre dentro de un bloque que al final
-- se deshace: no deja datos de prueba. El resultado sale como «error»
-- con la lista de pruebas: OK = protegido, FALLO = hay un hueco.
-- Pon en las tres variables de abajo: un creador, una marca con prendas y otra marca.
-- ==========================================================
do $$
declare
  v_admin  uuid := '581a383b-61e1-404e-869b-224f77a7e64b';
  v_brandA uuid := 'a685f168-4f88-4e0a-bb20-a151d7b623d8';  -- marca con prendas
  v_brandB uuid := '0a54497a-4a66-41ff-964b-9fbca842df0a';  -- otra marca
  v_buyer  uuid := gen_random_uuid();                        -- comprador cualquiera
  v_prod   uuid;
  r text := '';
  n int;
begin
  select id into v_prod from public.products where brand_id = v_brandA limit 1;

  -- preparación (como creador): una prenda pasa a «en revisión»
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.products set status = 'pending' where id = v_prod; get diagnostics n = row_count;
  if n <> 1 then raise exception 'La preparación falló: el creador no pudo poner la prenda en revisión'; end if;
  reset role;

  -- ===== VISITANTE ANÓNIMO =====
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.products where status <> 'approved';
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' anónimo no ve prendas en revisión (' || n || ')';
  select count(*) into n from public.products where status = 'approved';
  r := r || E'\n' || case when n > 0 then 'OK   ' else 'FALLO' end || ' anónimo sí ve las prendas aprobadas (' || n || ')';
  select count(*) into n from public.brand_applications;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' anónimo no lee solicitudes de marcas';
  select count(*) into n from public.messages;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' anónimo no lee mensajes';
  select count(*) into n from public.analytics_secret;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' anónimo no lee la sal de analítica';
  select count(*) into n from public.site_events;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' anónimo no lee las visitas';
  update public.site_settings set value = '{}'::jsonb; get diagnostics n = row_count;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' anónimo no cambia ajustes de la web';
  begin
    insert into public.brand_applications (brand_name, email, website) values ('x', 'x@x.es', 'javascript:alert(1)');
    r := r || E'\nFALLO solicitud con enlace javascript: aceptada';
  exception when others then r := r || E'\nOK    solicitud con enlace javascript: rechazada'; end;
  begin
    perform * from public.admin_list_users();
    r := r || E'\nFALLO anónimo ve la lista de usuarios';
  exception when others then r := r || E'\nOK    anónimo no ve la lista de usuarios'; end;
  reset role;

  -- ===== COMPRADOR =====
  perform set_config('request.jwt.claims', json_build_object('sub', v_buyer, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.products where status <> 'approved';
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' comprador no ve prendas en revisión';
  select count(*) into n from public.profiles where role <> 'brand';
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' comprador no ve perfiles de otros usuarios ni del creador';
  select count(*) into n from public.reports;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' comprador no lee denuncias';
  begin
    perform * from public.admin_list_users();
    r := r || E'\nFALLO comprador ve la lista de usuarios';
  exception when others then r := r || E'\nOK    comprador no entra en funciones de creador (lista de usuarios)'; end;
  begin
    perform public.admin_delete_user(v_brandB);
    r := r || E'\nFALLO comprador puede borrar cuentas';
  exception when others then r := r || E'\nOK    comprador no puede borrar cuentas'; end;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('product-images', v_buyer::text || '/x.jpg', v_buyer);
    r := r || E'\nFALLO comprador sube fotos de prendas';
  exception when others then r := r || E'\nOK    comprador no sube fotos de prendas'; end;
  begin
    insert into public.products (brand_id, name, price, color, gender) values (v_buyer, 'x', 10, '#000000', 'unisex');
    r := r || E'\nFALLO comprador publica prendas';
  exception when others then r := r || E'\nOK    comprador no publica prendas'; end;
  update public.products set price = 1 where id = v_prod; get diagnostics n = row_count;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' comprador no cambia precios de otros';
  reset role;

  -- ===== MARCA B (intentando tocar lo de la marca A o hacerse creador) =====
  perform set_config('request.jwt.claims', json_build_object('sub', v_brandB, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    update public.profiles set role = 'admin' where id = v_brandB;
    r := r || E'\nFALLO una marca se hace creador';
  exception when others then r := r || E'\nOK    una marca no puede hacerse creador'; end;
  update public.products set price = 1 where id = v_prod; get diagnostics n = row_count;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' una marca no cambia prendas de otra';
  delete from public.products where id = v_prod; get diagnostics n = row_count;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' una marca no borra prendas de otra';
  update public.profiles set brand_name = 'hackeada' where id = v_brandA; get diagnostics n = row_count;
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' una marca no cambia el perfil de otra';
  begin
    insert into storage.objects (bucket_id, name, owner) values ('brand-images', v_brandA::text || '/x.jpg', v_brandB);
    r := r || E'\nFALLO una marca sube fotos en la carpeta de otra';
  exception when others then r := r || E'\nOK    una marca no sube fotos en la carpeta de otra'; end;
  reset role;

  -- ===== MARCA A (con sus propias prendas) =====
  perform set_config('request.jwt.claims', json_build_object('sub', v_brandA, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.products set description = description where id = v_prod; get diagnostics n = row_count;
  r := r || E'\n' || case when n = 1 then 'OK   ' else 'FALLO' end || ' la marca sí puede editar su propia prenda';
  begin
    update public.products set price = 999999999 where id = v_prod;
    r := r || E'\nFALLO precio absurdo aceptado';
  exception when others then r := r || E'\nOK    precio por encima de 100.000 € rechazado'; end;
  begin
    update public.products set price = -5 where id = v_prod; get diagnostics n = row_count;
    r := r || case when n = 0 then E'\nFALLO la prueba de precio negativo no tocó la prenda' else E'\nFALLO precio negativo aceptado' end;
  exception when others then r := r || E'\nOK    precio negativo rechazado'; end;
  begin
    update public.products set buy_url = 'javascript:alert(document.cookie)' where id = v_prod; get diagnostics n = row_count;
    r := r || case when n = 0 then E'\nFALLO la prueba del enlace no tocó la prenda' else E'\nFALLO enlace de compra javascript: aceptado' end;
  exception when others then r := r || E'\nOK    enlace de compra javascript: rechazado'; end;
  update public.products set status = 'approved', featured = true where id = v_prod;
  select count(*) into n from public.products where id = v_prod and status = 'approved';
  r := r || E'\n' || case when n = 0 then 'OK   ' else 'FALLO' end || ' una marca no se aprueba sola sus prendas';
  reset role;

  raise exception 'RESULTADO DE LAS PRUEBAS (todo se ha deshecho):%', r;
end $$;
