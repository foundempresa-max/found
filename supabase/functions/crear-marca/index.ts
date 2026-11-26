// FOUND v35 · el Creador da de alta una marca o le genera un enlace nuevo para poner su contraseña.
// Solo funciona si quien llama es Creador (profiles.role = 'admin').
//   { action: 'create', email, brand_name }  → crea la cuenta de marca (correo ya confirmado) y devuelve un enlace
//   { action: 'link', user_id }              → enlace nuevo para una marca que ya existe
// El enlace lleva a la web, donde la marca elige su contraseña. Caduca como los demás enlaces de Supabase (1 h);
// si caduca, la marca puede usar «¿Has olvidado tu contraseña?» con su correo, o el Creador pedir otro.
import { createClient } from 'npm:@supabase/supabase-js@2';

const SITE = 'https://foundempresa-max.github.io/found/';
const ORIGINS = ['https://foundempresa-max.github.io', 'http://localhost:8080', 'http://127.0.0.1:8080'];

function cors(req: Request) {
  const o = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

Deno.serve(async (req) => {
  const h = cors(req);
  const out = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { ...h, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (req.method !== 'POST') return out(405, { error: 'Método no permitido' });

  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

  // ¿quién llama?
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return out(401, { error: 'Tienes que entrar con tu cuenta de Creador.' });
  const { data: who, error: whoErr } = await admin.auth.getUser(jwt);
  if (whoErr || !who?.user) return out(401, { error: 'Tu sesión ha caducado. Vuelve a entrar.' });
  const { data: me } = await admin.from('profiles').select('role').eq('id', who.user.id).maybeSingle();
  if (!me || me.role !== 'admin') return out(403, { error: 'Solo el Creador puede hacer esto.' });

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return out(400, { error: 'Petición no válida.' }); }

  const linkFor = async (email: string) => {
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: SITE } });
    if (error) throw new Error(error.message);
    return data.properties?.action_link || '';
  };

  try {
    if (body.action === 'link') {
      const id = String(body.user_id || '');
      const { data: p } = await admin.from('profiles').select('role').eq('id', id).maybeSingle();
      if (!p || p.role !== 'brand') return out(400, { error: 'Esa cuenta no es de marca.' });
      const { data: u, error } = await admin.auth.admin.getUserById(id);
      if (error || !u?.user?.email) return out(404, { error: 'No se encontró la cuenta.' });
      return out(200, { id, email: u.user.email, link: await linkFor(u.user.email) });
    }

    if (body.action !== 'create') return out(400, { error: 'Acción no válida.' });
    const email = String(body.email || '').trim().toLowerCase();
    const brand = String(body.brand_name || '').trim().slice(0, 60);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return out(400, { error: 'El correo no parece correcto.' });
    if (!brand) return out(400, { error: 'Escribe el nombre de la marca.' });

    // la marca queda aprobada (sin esto, la base de datos no deja crear la cuenta de marca)
    const { data: apps } = await admin.from('brand_applications').select('id').eq('email', email);
    if (apps && apps.length) await admin.from('brand_applications').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('email', email);
    else {
      const { error } = await admin.from('brand_applications').insert({ brand_name: brand, email, status: 'approved', reviewed_at: new Date().toISOString(), about: 'Alta hecha por el Creador' });
      if (error) return out(500, { error: 'No se pudo aprobar la marca: ' + error.message });
    }

    const pass = crypto.randomUUID() + crypto.randomUUID().slice(0, 8).toUpperCase() + '9a';
    const { data: cu, error: ce } = await admin.auth.admin.createUser({ email, password: pass, email_confirm: true, user_metadata: { role: 'brand', brand_name: brand } });
    if (ce) {
      if (/already|registered|exists/i.test(ce.message)) return out(409, { error: 'Ya hay una cuenta con ese correo. Búscala en Usuarios (si es de comprador, cámbiala a Marca).' });
      if (/FOUND_EMAIL_BLOQUEADO/.test(ce.message)) return out(400, { error: 'Ese correo está bloqueado.' });
      return out(500, { error: 'No se pudo crear la cuenta: ' + ce.message });
    }
    return out(200, { id: cu.user.id, email, link: await linkFor(email) });
  } catch (e) {
    return out(500, { error: (e as Error).message || 'Error inesperado' });
  }
});
