/* ==========================================================
   FOUND · rellena las páginas legales con los datos de config.js
   · [data-l="owner"] → nombre del titular, etc.
   · [data-if="ga"]  → solo se muestra si usas Google Analytics (también: turnstile, whatsapp, billing)
   Si falta un dato, sale resaltado en amarillo para que lo veas.
   ========================================================== */
(function () {
  const C = window.FOUND_CONFIG || {}, L = C.legal || {};
  const pending = v => !v || /^\[.*\]$/.test(String(v).trim());
  const email = L.email || C.contactEmail || '';
  const data = {
    app: C.appName || 'FOUND',
    owner: L.owner, nif: L.nif, address: L.address, email,
    registry: L.registry, updated: L.updated,
    site: (C.siteUrl && !/TU-USUARIO/i.test(C.siteUrl)) ? C.siteUrl : location.origin + location.pathname.replace(/[^/]*$/, ''),
    region: C.supabaseRegion || 'la Unión Europea',
    whatsapp: C.whatsapp ? '+' + String(C.whatsapp).replace(/\D/g, '') : ''
  };
  document.querySelectorAll('[data-l]').forEach(el => {
    const k = el.dataset.l, v = data[k];
    if (pending(v)) { el.textContent = '[' + (el.dataset.hint || 'pendiente de completar') + ']'; el.classList.add('missing'); return; }
    if (k === 'email') { el.innerHTML = ''; const a = document.createElement('a'); a.href = 'mailto:' + v; a.textContent = v; el.appendChild(a); }
    else if (k === 'site') { el.innerHTML = ''; const a = document.createElement('a'); a.href = v; a.textContent = v.replace(/^https?:\/\//, '').replace(/\/$/, ''); el.appendChild(a); }
    else el.textContent = v;
  });
  const flags = { ga: !!C.gaId, turnstile: !!C.turnstileSiteKey, whatsapp: !!C.whatsapp, registry: !pending(L.registry), noregistry: pending(L.registry) };
  document.querySelectorAll('[data-if]').forEach(el => { if (!flags[el.dataset.if]) el.remove(); });
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
