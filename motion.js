/* ==========================================================
   FOUND · animaciones (v20) — acompaña a motion.css
   · Cambio de pantalla: la nueva aparece subiendo un poco.
   · Prendas, marcas y estilos: aparecen en cascada al entrar en pantalla
     (40 ms entre una y otra, como mucho 360 ms en total), solo la primera vez
     que se ve cada sección en una visita; después aparecen directamente.
   · Guardar una prenda: el corazón salta y suelta un anillo.
   Si borras este archivo y motion.css, la web funciona igual, sin animaciones.
   ========================================================== */
(function () {
  'use strict';
  const root = document.documentElement;
  root.classList.add('m-on');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cambio de pantalla ---------- */
  const view = document.getElementById('view');
  function enterView() {
    // con transiciones nativas del navegador (v22) no hace falta el fundido propio
    if (!view || !root.classList.contains('m-on') || root.classList.contains('vt')) return;
    view.classList.remove('m-enter'); void view.offsetWidth; view.classList.add('m-enter');
  }
  // app.js ya ha pintado la pantalla nueva cuando llega aquí (su escucha se registró antes)
  window.addEventListener('hashchange', () => { if (/^#\//.test(location.hash)) enterView(); });

  /* ---------- aparición en cascada ---------- */
  const SEL = '.card, .brandcard, .stylecard, .bmini > a, .step, .pitem';
  const STAGGER = 40, MAX = 360;
  let lastTyping = 0, batch = [], batchT = 0;
  document.addEventListener('input', () => { lastTyping = Date.now(); }, true);

  const io = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); batch.push(e.target); } });
    clearTimeout(batchT);
    batchT = setTimeout(() => {
      batch.forEach((el, i) => { el.style.setProperty('--m-d', Math.min(i * STAGGER, MAX) + 'ms'); el.classList.add('m-in'); });
      batch = [];
    }, 16);
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }) : null;

  // secciones ya vistas en esta visita: ahí las prendas aparecen sin cascada
  const seen = new Set();
  const section = () => (location.hash.replace(/^#\/?/, '').split('/')[0]) || 'inicio';
  const markSeen = () => setTimeout(() => seen.add(section()), 1200); // deja terminar la primera cascada
  window.addEventListener('hashchange', markSeen); markSeen();

  function prepare(el) {
    if (el.dataset.m) return; el.dataset.m = '1';
    if (seen.has(section())) return;
    // mientras se escribe en el buscador no se anima (sería un parpadeo en cada letra)
    if (!io || reduce || Date.now() - lastTyping < 500 || !root.classList.contains('m-on')) return;
    el.classList.add('m-reveal'); io.observe(el);
  }
  function scan(node) {
    if (node.nodeType !== 1) return;
    if (node.matches && node.matches(SEL)) prepare(node);
    node.querySelectorAll && node.querySelectorAll(SEL).forEach(prepare);
  }

  /* ---------- guardar prenda ---------- */
  function pop(btn, on) {
    if (!root.classList.contains('m-on') || reduce) return;
    const t = btn.classList.contains('heart') || btn.classList.contains('btn') ? btn : (btn.querySelector('svg') || btn);
    t.classList.remove('m-pop', 'm-unpop'); void t.offsetWidth;
    t.classList.add(on ? 'm-pop' : 'm-unpop');
    if (t === btn && btn.classList.contains('btn')) t.classList.replace('m-pop', 'm-unpop'); // botón de texto: sin anillo
    setTimeout(() => t.classList.remove('m-pop', 'm-unpop'), 520);
  }

  new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'childList') m.addedNodes.forEach(scan);
      else if (m.type === 'attributes' && m.target.dataset && m.target.dataset.act === 'fav' && m.oldValue !== m.target.getAttribute('aria-pressed')) pop(m.target, m.target.getAttribute('aria-pressed') === 'true');
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'], attributeOldValue: true });

  // lo que ya estaba pintado al cargar este archivo
  scan(document.body);
  enterView();

  // para la vista previa: encender y apagar las animaciones
  window.FOUND_MOTION = {
    set(on) { root.classList.toggle('m-on', on); document.querySelectorAll('.m-reveal').forEach(el => el.classList.add('m-in')); }
  };
})();
