// ==========================================================
// FOUND · stripe-webhook (Supabase Edge Function)
// Recibe los avisos de Stripe y actualiza la suscripción de cada marca
// en la tabla public.brand_billing. No necesita librerías externas.
//
// Secretos necesarios (Supabase > Edge Functions > Secrets):
//   STRIPE_WEBHOOK_SECRET = whsec_...   (lo da Stripe al crear el webhook)
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya los pone Supabase solo.
//
// IMPORTANTE: en los ajustes de esta función, desactiva
// "Verify JWT with legacy secret" / "Enforce JWT verification":
// Stripe no envía ese token; la seguridad la da la firma de Stripe.
// ==========================================================

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
const SB_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// --- Verificación de la firma de Stripe (cabecera Stripe-Signature) ---
async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
export async function verifyStripe(payload: string, header: string | null, secret: string, toleranceSec = 300): Promise<boolean> {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const v1 = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !v1.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = await hmacHex(secret, `${t}.${payload}`);
  return v1.some((s) => safeEqual(s, expected));
}

// --- Escribir en la base de datos con la clave de servicio ---
async function db(method: string, query: string, body?: unknown, prefer = "return=representation") {
  const res = await fetch(`${SB_URL}/rest/v1/brand_billing${query}`, {
    method,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: prefer },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const txt = await res.text();
  return txt ? JSON.parse(txt) : [];
}
const toIso = (s?: number | null) => (s ? new Date(s * 1000).toISOString() : null);

// deno-lint-ignore no-explicit-any
function subFields(sub: any) {
  const end = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? null;
  return {
    status: sub.status === "incomplete_expired" ? "canceled" : String(sub.status),
    current_period_end: toIso(end),
    cancel_at_period_end: !!sub.cancel_at_period_end,
    stripe_subscription_id: sub.id,
    updated_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405 });
  const payload = await req.text();
  if (!(await verifyStripe(payload, req.headers.get("stripe-signature"), WEBHOOK_SECRET))) {
    return new Response("Firma no válida", { status: 400 });
  }
  const event = JSON.parse(payload);
  const obj = event.data?.object ?? {};
  try {
    switch (event.type) {
      // La marca acaba de pagar en el enlace de pago
      case "checkout.session.completed": {
        const brandId = obj.client_reference_id;
        if (obj.mode !== "subscription" || !UUID.test(brandId ?? "")) break;
        await db("POST", "?on_conflict=brand_id", {
          brand_id: brandId,
          status: obj.payment_status === "paid" || obj.payment_status === "no_payment_required" ? "active" : "incomplete",
          stripe_customer_id: obj.customer,
          stripe_subscription_id: obj.subscription,
          updated_at: new Date().toISOString(),
        }, "resolution=merge-duplicates,return=minimal");
        break;
      }
      // Renovaciones, impagos, cancelaciones...
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const fields = subFields(obj);
        if (event.type === "customer.subscription.deleted") fields.status = "canceled";
        const rows = await db("PATCH", `?stripe_customer_id=eq.${encodeURIComponent(obj.customer)}`, fields);
        // Si aún no conocemos a este cliente (el aviso llegó antes que el del pago), Stripe lo reintenta.
        if (!rows.length && event.type !== "customer.subscription.created") {
          return new Response("Cliente aún no registrado, reintentar", { status: 409 });
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
    return new Response("Error guardando la suscripción", { status: 500 });
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
});
