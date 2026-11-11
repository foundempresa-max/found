/* ==========================================================
   FOUND · aviso de cookies (consentimiento)
   Cumple la Guía de cookies de la AEPD (2023):
   · «Aceptar», «Rechazar» y «Configurar» en la primera capa, con el mismo aspecto.
   · Nada de analítica antes de que la persona elija.
   · Se puede cambiar de opinión en cualquier momento («Configurar cookies» en el pie).
   · La elección caduca a los 12 meses y se vuelve a preguntar.
   Lo usan index.html y las páginas legales.
   ========================================================== */
(function () {
  'use strict';
  const KEY = 'found_consent', VERSION = 1, MAX_AGE = 365 * 864e5;
  const C = window.FOUND_CONFIG || {};
  const subs = [];
  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!v || v.v !== VERSION || !v.t || Date.now() - v.t > MAX_AGE) return null;
      return v;
    } catch { return null; }
  };
  let state = read();

  function save(analytics) {
    const before = state && state.analytics;
    state = { v: VERSION, t: Date.now(), analytics: !!analytics };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    if (!state.analytics) cleanAnalytics();
    hideBanner(); closePanel();
    applyGA();
    subs.forEach(f => { try { f(state); } catch {} });
    if (before && !state.analytics) setTimeout(() => location.reload(), 50); // quita los scripts de analítica ya cargados
  }

  // al retirar el consentimiento se borra todo lo de analítica
  function cleanAnalytics() {
    try { localStorage.removeItem('found_vid'); } catch {}
    document.cookie.split(';').map(c => c.split('=')[0].trim()).filter(n => /^_ga|^_gid|^_gat/.test(n)).forEach(n => {
      const parts = location.hostname.split('.');
      for (let i = 0; i < parts.length; i++) {
        const d = parts.slice(i).join('.');
        document.cookie = n + '=; Max-Age=0; path=/; domain=' + d;
      }
      document.cookie = n + '=; Max-Age=0; path=/';
    });
  }

  // Google Analytics 4: solo si hay ID y la persona ha aceptado
  let gaLoaded = false;
  function applyGA() {
    if (gaLoaded || !C.gaId || !/^G-[A-Z0-9]+$/i.test(C.gaId) || !(state && state.analytics)) return;
    gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', C.gaId, { anonymize_ip: true, send_page_view: false });
    const s = document.createElement('script'); s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(C.gaId);
    document.head.appendChild(s);
  }

  /* ---------- banner (primera capa) ---------- */
  let banner = null;
  function showBanner() {
    if (banner) return;
    banner = document.createElement('section');
    banner.className = 'ck-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    // v25 · barra fina: una línea de texto y tres botones; «Rechazar» y «Aceptar» igual de visibles (AEPD)
    banner.innerHTML = `<div class="ck-in">
      <p>Usamos cookies técnicas y, si aceptas, de analítica anónima. <a href="cookies.html">Más información</a></p>
      <div class="ck-btns">
        <button type="button" class="ck-link2" data-ck="config">Configurar</button>
        <button type="button" class="ck-btn" data-ck="reject">Rechazar</button>
        <button type="button" class="ck-btn" data-ck="accept">Aceptar</button>
      </div></div>`;
    document.body.appendChild(banner);
    document.body.classList.add('has-ck');
  }
  function hideBanner() { if (banner) { banner.remove(); banner = null; } document.body.classList.remove('has-ck'); }

  /* ---------- panel de configuración (segunda capa) ---------- */
  let panel = null;
  function openPanel() {
    closePanel();
    panel = document.createElement('dialog');
    panel.className = 'ck-panel';
    panel.setAttribute('aria-labelledby', 'ck-title');
    const on = !!(state && state.analytics);
    panel.innerHTML = `<form method="dialog" class="ck-form">
      <h2 id="ck-title">Configurar cookies</h2>
      <p class="ck-muted">Elige qué permites. Puedes cambiarlo cuando quieras desde «Configurar cookies», al pie de cada página.</p>
      <div class="ck-row"><div><b>Técnicas y de preferencias</b><span>Mantienen tu sesión, tus gustos, tu talla, tus guardados y esta elección. Sin ellas la web no funciona.</span></div>
        <span class="ck-always">Siempre activas</span></div>
      <label class="ck-row"><div><b>Analítica</b><span>Cuentan visitas, páginas vistas y clics en las prendas de forma agregada para mejorar la web y dar estadísticas a las marcas${C.gaId ? ' (incluye Google Analytics)' : ''}.</span></div>
        <input type="checkbox" class="ck-switch" id="ck-an" ${on ? 'checked' : ''} aria-label="Permitir cookies de analítica"></label>
      <div class="ck-btns">
        <button type="button" class="ck-btn" data-ck="reject">Rechazar todo</button>
        <button type="button" class="ck-btn" data-ck="save">Guardar mi elección</button>
        <button type="button" class="ck-btn" data-ck="accept">Aceptar todo</button>
      </div>
      <a class="ck-link" href="cookies.html">Política de cookies</a>
    </form>`;
    document.body.appendChild(panel);
    panel.addEventListener('close', () => { if (panel) { panel.remove(); panel = null; } });
    panel.showModal();
  }
  function closePanel() { if (panel) { const p = panel; panel = null; if (p.open) p.close(); p.remove(); } }

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ck]');
    if (!b) return;
    e.preventDefault();
    const a = b.dataset.ck;
    if (a === 'accept') save(true);
    else if (a === 'reject') save(false);
    else if (a === 'config' || a === 'open') openPanel();
    else if (a === 'save') save(!!(document.getElementById('ck-an') || {}).checked);
  });

  window.FOUND_CONSENT = {
    analytics: () => !!(state && state.analytics),
    decided: () => !!state,
    open: openPanel,
    onChange: f => subs.push(f)
  };

  function init() { if (!state) showBanner(); applyGA(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
