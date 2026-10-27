/* ==========================================================
   FOUND · aplicación
   - Con Supabase configurado (config.js): usuarios, productos,
     fotos y favoritos reales en tu base de datos.
   - Sin configurar: MODO DEMO (datos solo en este navegador).
   ========================================================== */
(() => {
'use strict';
const C = window.FOUND_CONFIG;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => Number(n).toLocaleString('es-ES', {maximumFractionDigits: 2}) + ' ' + C.currency;
const isHex = c => /^#[0-9a-fA-F]{6}$/.test(c || '');
const isUrl = u => /^https?:\/\/\S+$/i.test(u || '');
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ilustraciones de prenda tipo "foto de estudio" (si el producto no tiene foto) ---------- */
const hexRgb = h => { const n = parseInt((isHex(h) ? h : '#E6335F').slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const mix = (h, t, a) => { const c = hexRgb(h), d = t === 'w' ? [255, 255, 255] : t === 'k' ? [0, 0, 0] : hexRgb(t); return '#' + c.map((v, i) => Math.round(v + (d[i] - v) * a).toString(16).padStart(2, '0')).join(''); };
const lum = h => { const [r, g, b] = hexRgb(h); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
const tileBg = p => mix(p.color, '#F2F0EA', 0.82);
let ART_ID = 0;
// silueta y detalles de cada categoría (lienzo 100 x 120)
const GARMENTS = {
  Camisetas: {
    hanger: true,
    body: 'M32 20 Q37 17 42 15 Q50 22 58 15 Q63 17 68 20 L86 36 Q87.5 38 85.5 40.5 L76.5 50 Q75 51.5 73 50 L68.5 46.5 L69 104 Q50 107 31 104 L31.5 46.5 L27 50 Q25 51.5 23.5 50 L14.5 40.5 Q12.5 38 14 36 Z',
    shade: ['M31.5 46.5 L32 20 Q33 34 34 48 Q35 75 33 104 L31 104 Z', 'M68.5 46.5 L68 20 Q67 34 66 48 Q65 75 67 104 L69 104 Z', 'M42 15 Q50 18 58 15 Q50 22 42 15 Z'],
    light: ['M45 30 Q50 60 47 100 L53 100 Q55 60 52 28 Z'],
    folds: ['M40 58 Q43 78 39 100', 'M60 62 Q57 80 61 100', 'M24 44 Q27 46 31 44', 'M76 44 Q73 46 69 44'],
    seams: ['M32 21 Q33 34 31.5 46.5', 'M68 21 Q67 34 68.5 46.5'],
    stitch: ['M31.6 101.5 Q50 104.5 68.4 101.5', 'M24 48.5 L15.5 39.5', 'M76 48.5 L84.5 39.5'],
    rib: 'M42 15 Q50 22 58 15'
  },
  Vestidos: {
    hanger: true,
    body: 'M40 14 Q50 22 60 14 L63 16 Q61 30 63 42 Q64 50 61 54 Q70 80 81 108 Q50 114 19 108 Q30 80 39 54 Q36 50 37 42 Q39 30 37 16 Z',
    shade: ['M39 54 Q30 80 19 108 Q24 109 28 109.5 Q34 80 41 56 Z', 'M61 54 Q70 80 81 108 Q76 109 72 109.5 Q66 80 59 56 Z', 'M40 14 Q50 19 60 14 Q50 22 40 14 Z'],
    light: ['M46 26 Q50 40 48 52 L52 52 Q54 40 52 25 Z', 'M48 58 Q47 85 45 111 L52 112 Q53 85 51 58 Z'],
    folds: ['M44 57 Q40 84 35 110', 'M56 57 Q60 84 65 110', 'M50 58 Q50 86 50 112', 'M40 24 Q44 34 41 46'],
    seams: ['M39 54 Q50 57.5 61 54'],
    stitch: ['M20.5 106 Q50 112 79.5 106'],
    rib: 'M40 14 Q50 22 60 14'
  },
  Chaquetas: {
    hanger: true,
    body: 'M34 16 L44 12 L50 20 L56 12 L66 16 L87 37 Q90 40 90 45 L90 98 L78 98 L78 56 L70 56 L70 106 L30 106 L30 56 L22 56 L22 98 L10 98 L10 45 Q10 40 13 37 Z',
    shade: ['M44 12 L50 20 L47 44 L40 23 Z', 'M56 12 L50 20 L53 44 L60 23 Z', 'M10 92 H22 V98 H10 Z', 'M78 92 H90 V98 H78 Z', 'M30 99 H70 V106 H30 Z', 'M22 56 L30 56 L30 60 L22 60 Z'],
    light: ['M36 26 Q39 60 36 98 L41 98 Q43 60 40 26 Z', 'M82 44 L86 44 L86 90 L82 90 Z'],
    folds: ['M15 50 Q17 70 15 90', 'M85 50 Q83 70 85 90', 'M57 60 Q60 80 58 98', 'M43 62 Q40 80 42 98'],
    seams: ['M50 20 V106', 'M30 56 Q30 40 34 17', 'M70 56 Q70 40 66 17'],
    stitch: ['M35 78 H45', 'M55 78 H65', 'M11 91 H21', 'M79 91 H89'],
    dots: [[52.5, 50], [52.5, 62], [52.5, 74], [52.5, 86]]
  },
  Pantalones: {
    body: 'M30 14 L70 14 L71 22 L76 110 L56 110 L50 44 L44 110 L24 110 L29 22 Z',
    shade: ['M30 14 L70 14 L71 22 L29 22 Z', 'M50 44 L56 110 L53 110 L49.5 50 Z', 'M29 22 L24 110 L27 110 L31 40 Z'],
    light: ['M36 26 Q37 70 33 108 L39 108 Q42 70 41 28 Z', 'M60 28 Q60 70 64 108 L69 108 Q65 70 64 26 Z'],
    folds: ['M37 48 L34 108', 'M63 48 L66 108', 'M44 96 Q40 100 44 104', 'M56 96 Q60 100 56 104'],
    seams: ['M50 22 Q51 34 50 44', 'M30 22 Q36 31 41 22', 'M70 22 Q64 31 59 22'],
    stitch: ['M24.5 106.5 H43.6', 'M56.4 106.5 H75.5', 'M30 20.5 H70'],
    loops: [34, 42, 58, 66]
  },
  Calzado: {
    y: 6,
    body: 'M10 84 L10 66 Q22 67 32 56 Q38 47 47 48 Q54 49 58 60 Q64 70 84 72 Q95 74 95 84 Z',
    sole: 'M8 84 H96 Q97.5 92 90 94 H13 Q6.5 92 8 84 Z',
    shade: ['M10 66 Q14 66 17 68 L17 84 L10 84 Z', 'M70 76 Q84 76 95 84 L70 84 Z'],
    light: ['M36 54 Q44 50 50 52 Q46 54 40 58 Z', 'M66 72 Q78 72 88 75 Q78 75 68 75 Z'],
    folds: ['M24 70 Q34 72 44 66', 'M60 72 Q62 78 58 84'],
    seams: ['M10 76 Q40 78 64 70', 'M47 48 Q46 60 54 66'],
    stitch: ['M11 81 H94'],
    laces: [[38, 56, 48, 52], [40, 60, 51, 56], [43, 64, 54, 60]]
  },
  Complementos: {
    body: 'M22 46 H78 L84 106 Q84 108 82 108 H18 Q16 108 16 106 Z',
    flap: 'M22 46 H78 L76.5 66 Q50 75 23.5 66 Z',
    shade: ['M16 106 L22 46 L25 46 L20 108 Z', 'M84 106 L78 46 L75 46 L80 108 Z'],
    light: ['M30 70 Q50 76 70 70 L70 74 Q50 80 30 74 Z'],
    folds: ['M34 80 Q36 94 32 106', 'M66 80 Q64 94 68 106'],
    seams: [],
    stitch: ['M24.5 48.5 H75.5', 'M25.5 64.5 Q50 72.5 74.5 64.5', 'M19 105.5 H81'],
    handle: 'M36 47 V38 Q36 22 50 22 Q64 22 64 38 V47'
  }
};
function fabricOf(p) {
  const n = (p.name + ' ' + p.desc).toLowerCase();
  if (/pana|cord/.test(n)) return 'ribs';
  if (/vaquer|denim|jean/.test(n)) return 'twill';
  if (/seda|satén|saten|lencer/.test(n)) return 'silk';
  if (/lana|punto|knit|jersey|abrigo/.test(n)) return 'knit';
  if (/estampad|print|flores|cuadros/.test(n)) return 'print';
  if (/técnic|tecnic|deport|malla|run/.test(n)) return 'mesh';
  return 'weave';
}
function pattern(id, kind, c) {
  const dk = lum(c) > 0.5 ? 'rgba(0,0,0,.10)' : 'rgba(255,255,255,.08)';
  const lt = lum(c) > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)';
  const P = (w, h, inner, rot = '') => `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${rot}>${inner}</pattern>`;
  switch (kind) {
    case 'ribs': return P(1.8, 4, `<rect width=".9" height="4" fill="${dk}"/><rect x=".9" width=".35" height="4" fill="${lt}"/>`);
    case 'twill': return P(2, 2, `<path d="M0 2 L2 0" stroke="${dk}" stroke-width=".6"/><path d="M-1 1 L1 -1 M1 3 L3 1" stroke="${lt}" stroke-width=".3"/>`);
    case 'knit': return P(3, 2.4, `<path d="M0 0 L1.5 1.8 L3 0" fill="none" stroke="${dk}" stroke-width=".45"/>`);
    case 'print': return P(9, 9, `<circle cx="2.5" cy="2.5" r="1.3" fill="${lt}"/><circle cx="7" cy="6.8" r=".9" fill="${dk}"/><path d="M6 1.5 q1 1 2 0" stroke="${lt}" stroke-width=".5" fill="none"/>`);
    case 'mesh': return P(2.2, 2.2, `<circle cx="1.1" cy="1.1" r=".42" fill="${dk}"/>`);
    case 'silk': return P(4, 4, `<rect width="4" height="4" fill="none"/>`);
    default: return P(1.2, 1.2, `<rect width=".6" height=".6" fill="${dk}"/><rect x=".6" y=".6" width=".6" height=".6" fill="${dk}"/>`);
  }
}
function art(p, full) {
  const G = GARMENTS[p.cat] || GARMENTS.Camisetas;
  const c = isHex(p.color) ? p.color : '#E6335F';
  const id = 'a' + (++ART_ID), fab = fabricOf(p);
  const dark = lum(c) < 0.18;
  const top = mix(c, 'w', dark ? 0.22 : 0.16), bot = mix(c, 'k', dark ? 0.12 : 0.22);
  const seamC = lum(c) > 0.55 ? mix(c, 'k', 0.35) : mix(c, 'k', 0.45);
  const stitchC = lum(c) > 0.55 ? 'rgba(0,0,0,.28)' : 'rgba(255,255,255,.4)';
  const y = G.y ? `translate(0 ${G.y})` : '';
  const shape = d => `<path d="${d}"/>`;
  const defs = `<defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
    <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity="${fab === 'silk' ? .38 : .14}"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <radialGradient id="${id}b" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="${mix(c, '#FBFAF8', 0.9)}"/><stop offset="1" stop-color="${mix(c, '#E6E4DF', 0.74)}"/></radialGradient>
    <filter id="${id}f" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${full ? 1.6 : 1.2}"/></filter>
    <filter id="${id}d" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.6" flood-color="#000" flood-opacity=".22"/></filter>
    ${pattern(id + 'p', fab, c)}
    <clipPath id="${id}c">${shape(G.body)}${G.sole ? shape(G.sole) : ''}</clipPath>
  </defs>`;
  const bg = full ? '' : `<rect width="100" height="120" fill="url(#${id}b)"/><path d="M0 100 Q50 95 100 100 V120 H0 Z" fill="${mix(c, '#E1DFD9', 0.8)}" opacity=".55"/>`;
  const floor = `<ellipse cx="50" cy="${G.sole ? 101 : 113}" rx="${G.sole ? 44 : 32}" ry="3.2" fill="#000" opacity=".16" filter="url(#${id}f)"/>`;
  const hanger = G.hanger ? `<g fill="none" stroke-linecap="round"><path d="M50 15 V10 Q50 5.5 54 5.5 Q57.5 5.5 57.5 9" stroke="#8C877E" stroke-width="1.3"/><path d="M33 19 L50 13 L67 19" stroke="#6B5A45" stroke-width="2.4"/></g>` : '';
  const lines = (arr, st, w, extra = '') => (arr || []).map(d => `<path d="${d}" fill="none" stroke="${st}" stroke-width="${w}" stroke-linecap="round"${extra}/>`).join('');
  let deco = '';
  if (G.flap) deco += `<path d="${G.flap}" fill="${mix(c, 'k', 0.12)}"/><path d="M23.5 66 Q50 75 76.5 66" fill="none" stroke="${mix(c, 'k', 0.35)}" stroke-width="1"/>`;
  if (G.rib) deco += `<path d="${G.rib}" fill="none" stroke="${mix(c, 'k', 0.18)}" stroke-width="2.6" stroke-linecap="round"/><path d="${G.rib}" fill="none" stroke="${stitchC}" stroke-width=".35" stroke-dasharray="1 .8" transform="translate(0 1.6)"/>`;
  if (G.dots) deco += G.dots.map(([x, yy]) => `<circle cx="${x}" cy="${yy}" r="1.9" fill="${mix(c, 'k', 0.45)}"/><circle cx="${x - .5}" cy="${yy - .5}" r=".6" fill="rgba(255,255,255,.45)"/>`).join('');
  if (G.loops) deco += G.loops.map(x => `<rect x="${x - 1}" y="13" width="2" height="9.5" rx=".6" fill="${mix(c, 'k', 0.25)}"/>`).join('') + `<rect x="47.6" y="15.5" width="4.8" height="4" rx="1" fill="#C9B07A" stroke="#8F7A4C" stroke-width=".4"/>`;
  if (G.laces) deco += G.laces.map(([a, b, cc, d]) => `<path d="M${a} ${b} L${cc} ${d}" stroke="#F4F1EC" stroke-width="1.5" stroke-linecap="round"/>`).join('') + `<circle cx="42" cy="58" r=".7" fill="${mix(c, 'k', .5)}"/><circle cx="50" cy="54" r=".7" fill="${mix(c, 'k', .5)}"/>`;
  if (G.handle) deco += `<circle cx="50" cy="69" r="3.2" fill="#D4B46A" stroke="#8F7A4C" stroke-width=".6"/><circle cx="49" cy="68" r="1" fill="rgba(255,255,255,.6)"/>`;
  const handle = G.handle ? `<path d="${G.handle}" fill="none" stroke="${mix(c, 'k', 0.3)}" stroke-width="4.6" stroke-linecap="round"/><path d="${G.handle}" fill="none" stroke="${mix(c, 'w', 0.15)}" stroke-width="1.2" stroke-linecap="round" transform="translate(-.8 -.4)" opacity=".7"/>` : '';
  const sole = G.sole ? `<path d="${G.sole}" fill="#F3F0EA"/><path d="M8 88 H96" stroke="#D8D2C6" stroke-width="1.2"/><path d="M8 84 H96" stroke="#CFC8BB" stroke-width=".6"/>` : '';
  return `<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid ${full ? 'meet" class="g' : 'slice'}" aria-hidden="true">${defs}${bg}${floor}${hanger}
    <g transform="${y}"><g filter="url(#${id}d)">${handle}<path d="${G.body}" fill="url(#${id}g)"/>${sole}</g>
    <g clip-path="url(#${id}c)">
      <path d="${G.body}" fill="url(#${id}p)"/>
      ${(G.shade || []).map(d => `<path d="${d}" fill="#000" opacity=".16" filter="url(#${id}f)"/>`).join('')}
      ${(G.light || []).map(d => `<path d="${d}" fill="#fff" opacity="${dark ? .1 : .18}" filter="url(#${id}f)"/>`).join('')}
      ${lines(G.folds, 'rgba(0,0,0,.16)', 2.2, ` filter="url(#${id}f)"`)}
      <rect width="100" height="120" fill="url(#${id}s)"/>
      ${deco}
      ${lines(G.seams, seamC, .7)}
      ${lines(G.stitch, stitchC, .45, ' stroke-dasharray="1.2 .9"')}
    </g></g></svg>`;
}
const pic = (p, alt = '') => p.image ? `<img src="${esc(p.image)}" alt="${esc(alt)}" loading="lazy">` : art(p);
const ICON = {
  heart:'<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.7h2C14 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  bag:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/></svg>',
  compass:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15.500 8.500l-2 5-5 2 2-5z"/></svg>',
  grid:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.500"/><rect x="13" y="4" width="7" height="7" rx="1.500"/><rect x="4" y="13" width="7" height="7" rx="1.500"/><rect x="13" y="13" width="7" height="7" rx="1.500"/></svg>',
  user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>',
  store:'<svg viewBox="0 0 24 24"><path d="M4 9l1.500-5h13L20 9M4 9v11h16V9M4 9c0 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 4 2 4 0"/></svg>',
  cog:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.900 4.900l2.100 2.100M17 17l2.100 2.100M4.900 19.100L7 17M17 7l2.100-2.100"/></svg>',
  home:'<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/></svg>',
  search:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.500"/><path d="M20 20l-4-4"/></svg>',
  up:'<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"/></svg>',
  left:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  down:'<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  share:'<svg viewBox="0 0 24 24"><path d="M12 15V4M8 8l4-4 4 4M5 12v7a1 1 0 001 1h12a1 1 0 001-1v-7"/></svg>'
};

/* ---------- normalizar productos ---------- */
const MAX_PHOTOS = 5;
function norm(r) {
  const o = {
    id: r.id, brand_id: r.brand_id, brand: r.brand || 'Marca', contact: r.contact || '', bio: r.bio || '',
    logo: r.logo || '', cover: r.cover || '',
    name: r.name, price: Number(r.price), cat: r.cat, tags: Array.isArray(r.tags) ? r.tags : [],
    color: isHex(r.color) ? r.color : '#E6335F', desc: r.desc || '', image: r.image || '',
    images: (Array.isArray(r.images) && r.images.length ? r.images : r.image ? [r.image] : []).filter(u => typeof u === 'string' && u).slice(0, MAX_PHOTOS),
    buy_url: r.buy_url || '', created: r.created || '', featured: !!r.featured,
    sizes: Array.isArray(r.sizes) ? r.sizes : [],
    status: r.status || 'approved', reason: r.reason || ''
  };
  o.image = o.images[0] || '';
  return o;
}

/* ---------- imágenes: reducir antes de subir ---------- */
async function shrink(file, max, quality, type = 'image/jpeg') {
  const bmp = await createImageBitmap(file);
  const r = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * r); c.height = Math.round(bmp.height * r);
  const ctx = c.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, c.width, c.height); }
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(res => c.toBlob(res, type, quality));
}
// logo: cuadrado pequeño en PNG (respeta el fondo transparente); portada: horizontal en JPG
const BRAND_IMG = { logo: { max: 400, type: 'image/png', ext: 'png' }, cover: { max: 1800, type: 'image/jpeg', ext: 'jpg' }, style: { max: 900, type: 'image/jpeg', ext: 'jpg' } };
const blobToDataUrl = b => new Promise(res => { const f = new FileReader(); f.onload = () => res(f.result); f.readAsDataURL(b); });

/* ---------- visitas: cálculo del resumen en modo demo (en Supabase lo hace site_stats) ---------- */
const madridDay = t => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 864e5);
function aggregateSite(list, days) {
  const today = madridDay(Date.now());
  let from = days ? addDays(today, -(days - 1)) : (list.length ? list.map(e => madridDay(e.t)).sort()[0] : today);
  if (from < addDays(today, -365)) from = addDays(today, -365);
  const prevFrom = addDays(from, -(daysBetween(from, today) + 1));
  const cur = list.filter(e => madridDay(e.t) >= from), prev = list.filter(e => { const d = madridDay(e.t); return d >= prevFrom && d < from; });
  const cnt = (l, k) => l.filter(e => e.kind === k).length;
  const uniq = (l, k) => new Set(l.filter(e => !k || e.kind === k).map(e => e.v)).size;
  const group = (l, f) => { const m = {}; l.forEach(e => { const k = f(e); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n).slice(0, 12); };
  const daily = []; for (let d = from; d <= today; d = addDays(d, 1)) daily.push({ d, n: cur.filter(e => e.kind === 'visit' && madridDay(e.t) === d).length });
  return {
    from, to: today, visits: cnt(cur, 'visit'), visitors: uniq(cur), pages: cnt(cur, 'page'), tests: uniq(cur, 'test'),
    signups: cnt(cur, 'signup'), buys: cnt(cur, 'buy'), buyers: uniq(cur, 'buy'), shares: cnt(cur, 'share'),
    prevVisits: days ? cnt(prev, 'visit') : null, daily,
    sources: group(cur.filter(e => e.kind === 'visit'), e => e.source || 'Directo'),
    topPages: group(cur.filter(e => e.kind === 'page'), e => e.page),
    devices: group(cur.filter(e => e.kind === 'visit'), e => e.device),
    searchCount: cnt(cur, 'search'),
    searches: group(cur.filter(e => e.kind === 'search'), e => e.page).slice(0, 12).map(x => ({ ...x, zero: cur.filter(e => e.kind === 'search' && e.page === x.k && e.results === 0).length })),
    zeroSearches: group(cur.filter(e => e.kind === 'search' && e.results === 0), e => e.page).slice(0, 12)
  };
}

/* ==========================================================
   BACKEND REAL (Supabase)
   ========================================================== */
function supabaseApi() {
  const sb = window.supabase.createClient(C.supabaseUrl, C.supabaseAnonKey);
  const bucket = C.imageBucket || 'product-images';
  const fail = e => { if (e) throw new Error(e.message || 'Error inesperado'); };
  const getProfile = async uid => {
    const { data, error } = await sb.from('profiles').select('*').eq('id', uid).maybeSingle();
    fail(error); return data;
  };
  const rowToProduct = r => norm({
    id: r.id, brand_id: r.brand_id, brand: r.profiles?.brand_name, contact: r.profiles?.contact_email, bio: r.profiles?.brand_bio,
    logo: r.profiles?.logo_url, cover: r.profiles?.cover_url,
    name: r.name, price: r.price, cat: r.category, tags: r.tags, color: r.color, desc: r.description,
    image: r.image_url, images: r.images, buy_url: r.buy_url, created: r.created_at, featured: r.featured, sizes: r.sizes, status: r.status, reason: r.reject_reason
  });
  // si aún no se ha ejecutado mensajes.sql, la tabla no existe
  const chatMissing = e => /Could not find the table|schema cache|relation .* does not exist/i.test((e && e.message) || '');
  // si aún no se ha ejecutado tallas.sql, se guarda igual pero sin las tallas
  const noSizesCol = (error, obj) => error && 'sizes' in obj && /sizes/.test(error.message || '');
  const withoutSizes = obj => { const o = { ...obj }; delete o.sizes; return o; };
  return {
    live: true,
    onChange(cb) { sb.auth.onAuthStateChange((ev) => { if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') cb(); }); },
    async init() {
      const { data } = await sb.auth.getSession();
      const u = data?.session?.user; if (!u) return { user: null, profile: null };
      return { user: { id: u.id, email: u.email }, profile: await getProfile(u.id) };
    },
    async signUp({ email, password, role, brandName }) {
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { role, brand_name: brandName || null } } });
      fail(error);
      return { needsConfirm: !data.session, userId: data.user ? data.user.id : null };
    },
    async signIn({ email, password }) { const { error } = await sb.auth.signInWithPassword({ email, password }); fail(error); },
    async signOut() { await sb.auth.signOut(); },
    async saveProfile(uid, patch) {
      let { error } = await sb.from('profiles').update(patch).eq('id', uid);
      if (noSizesCol(error, patch)) ({ error } = await sb.from('profiles').update(withoutSizes(patch)).eq('id', uid));
      fail(error);
    },
    async listProducts() {
      let { data, error } = await sb.from('products').select('*, profiles:brand_id(brand_name, contact_email, brand_bio, logo_url, cover_url)').order('created_at', { ascending: false });
      // si aún no se ha ejecutado marcas.sql, se cargan sin logo ni portada
      if (error && /logo_url|cover_url/.test(error.message || '')) ({ data, error } = await sb.from('products').select('*, profiles:brand_id(brand_name, contact_email, brand_bio)').order('created_at', { ascending: false }));
      fail(error); S.modMissing = !!(data && data.length && !('status' in data[0])); return (data || []).map(rowToProduct);
    },
    // photos: lista ordenada de { url } (fotos que ya estaban) y { file } (fotos nuevas); la primera es la portada
    async saveProduct(uid, f, photos, id) {
      const images = [];
      for (const [i, ph] of photos.slice(0, MAX_PHOTOS).entries()) {
        if (ph.url) { images.push(ph.url); continue; }
        const blob = await shrink(ph.file, 1400, 0.82);
        const path = `${uid}/${Date.now()}-${i}.jpg`;
        const up = await sb.storage.from(bucket).upload(path, blob, { contentType: 'image/jpeg' });
        fail(up.error);
        images.push(sb.storage.from(bucket).getPublicUrl(path).data.publicUrl);
      }
      const row = { name: f.name, price: f.price, category: f.cat, tags: f.tags, sizes: f.sizes, color: f.color, description: f.desc, buy_url: f.buy_url || null, image_url: images[0] || null, images };
      const write = r => id ? sb.from('products').update(r).eq('id', id) : sb.from('products').insert({ ...r, brand_id: uid });
      // si aún no se han ejecutado tallas.sql o fotos.sql, se guarda igual sin esas columnas (y solo con la portada)
      const out = {}; let r = row, { error } = await write(r);
      for (let n = 0; error && n < 2; n++) {
        if ('images' in r && /images/.test(error.message || '')) { r = { ...r }; delete r.images; out.imagesSkipped = true; }
        else if (noSizesCol(error, r)) { r = withoutSizes(r); out.sizesSkipped = true; }
        else break;
        ({ error } = await write(r));
      }
      fail(error); return out;
    },
    async removeProduct(id) { const { error } = await sb.from('products').delete().eq('id', id); fail(error); },
    async uploadBrandImage(uid, file, kind) {
      const o = BRAND_IMG[kind];
      const blob = await shrink(file, o.max, 0.86, o.type);
      const path = `${uid}/${kind}-${Date.now()}.${o.ext}`;
      const up = await sb.storage.from('brand-images').upload(path, blob, { contentType: o.type });
      if (up.error) throw new Error(/bucket/i.test(up.error.message || '') ? 'Las imágenes de marca aún no están activadas (falta ejecutar marcas.sql).' : kind === 'style' && /row-level|policy|security/i.test(up.error.message || '') ? 'Para subir fotos de estilos falta ejecutar supabase/fotos-estilos.sql en Supabase.' : up.error.message);
      return sb.storage.from('brand-images').getPublicUrl(path).data.publicUrl;
    },
    async getSettings() { try { const { data, error } = await sb.from('site_settings').select('value').eq('key', 'main').maybeSingle(); if (error) return null; return data ? data.value : null; } catch { return null; } },
    async saveSettings(v) {
      if (v === null) { const { error } = await sb.from('site_settings').delete().eq('key', 'main'); fail(error); }
      else { const { error } = await sb.from('site_settings').upsert({ key: 'main', value: v }); fail(error); }
    },
    async adminOverview() {
      const c = async (t, f) => { let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = f(q); const { count, error } = await q; fail(error); return count || 0; };
      return { buyers: await c('profiles', q => q.eq('role', 'buyer')), brands: await c('profiles', q => q.eq('role', 'brand')), products: await c('products'), favs: await c('favorites') };
    },
    async adminProfiles() { const { data, error } = await sb.from('profiles').select('id, role, brand_name, contact_email, created_at').order('created_at', { ascending: false }).limit(300); fail(error); return data || []; },
    // lista con correo de registro (cuentas.sql); si falta, se usa la lista básica de perfiles
    async adminUsers() {
      const { data, error } = await sb.rpc('admin_list_users');
      if (error) {
        if (/admin_list_users|schema cache|Could not find|does not exist/i.test(error.message || '')) return { missing: true, list: (await this.adminProfiles()).map(u => ({ ...u, email: '', products: null })) };
        throw new Error(error.message);
      }
      return { list: data || [] };
    },
    async adminDeleteUser(id) {
      // primero las fotos de su carpeta (si no se puede, se borra igual la cuenta)
      for (const b of [bucket, 'brand-images']) {
        try {
          const { data } = await sb.storage.from(b).list(id, { limit: 1000 });
          const paths = (data || []).filter(f => f.name && f.id !== null).map(f => id + '/' + f.name);
          if (paths.length) await sb.storage.from(b).remove(paths);
        } catch {}
      }
      const { error } = await sb.rpc('admin_delete_user', { p_user: id });
      if (error) throw new Error(/admin_delete_user|schema cache|Could not find/i.test(error.message || '') ? 'Para borrar cuentas falta ejecutar supabase/cuentas.sql en Supabase.' : error.message);
    },
    async adminSetRole(id, role) {
      const { data, error } = await sb.from('profiles').update({ role }).eq('id', id).select('id'); fail(error);
      if (!data || !data.length) throw new Error('No tienes permiso para este cambio. Comprueba que tu cuenta es de creador y que ejecutaste la última versión de schema.sql.');
    },
    async adminSetFeatured(id, on) {
      const { data, error } = await sb.from('products').update({ featured: on }).eq('id', id).select('id'); fail(error);
      if (!data || !data.length) throw new Error('No tienes permiso para este cambio. Comprueba que tu cuenta es de creador y que ejecutaste la última versión de schema.sql.');
    },
    async listFavs(uid) { const { data, error } = await sb.from('favorites').select('product_id').eq('user_id', uid); fail(error); return (data || []).map(r => r.product_id); },
    async setFav(uid, pid, on) {
      if (on) { const { error } = await sb.from('favorites').upsert({ user_id: uid, product_id: pid }); fail(error); }
      else { const { error } = await sb.from('favorites').delete().eq('user_id', uid).eq('product_id', pid); fail(error); }
    },
    async saveCounts() {
      const { data, error } = await sb.rpc('product_save_counts'); fail(error);
      const m = {}; (data || []).forEach(r => { m[r.product_id] = Number(r.saves); }); return m;
    },
    // --- suscripción de marcas ---
    async getBilling(uid) {
      const { data, error } = await sb.from('brand_billing').select('*').eq('brand_id', uid).maybeSingle();
      if (error) { if (/brand_billing/.test(error.message || '')) return { missing: true }; throw new Error(error.message); }
      return data || null;
    },
    async adminBilling() {
      const { data, error } = await sb.from('brand_billing').select('*');
      if (error) return {};
      const m = {}; (data || []).forEach(r => { m[r.brand_id] = r; }); return m;
    },
    // --- estadísticas de clics ---
    async track(pid, kind, visitor) { try { await sb.rpc('track_event', { p_product: pid, p_kind: kind, p_visitor: visitor }); } catch {} },
    async eventCounts(days) {
      const { data, error } = await sb.rpc('product_event_counts', { p_days: days });
      if (error) return null;
      const m = {}; (data || []).forEach(r => { m[r.product_id] = { views: Number(r.views), buys: Number(r.buys) }; }); return m;
    },
    // --- panel de creador: ranking, edición, bloqueos ---
    async adminSaveCounts() {
      const { data, error } = await sb.rpc('admin_save_counts');
      if (error) return null;
      const m = {}; (data || []).forEach(r => { m[r.product_id] = Number(r.saves); }); return m;
    },
    async adminUpdateProduct(id, f) {
      const row = { name: f.name, price: f.price, category: f.cat, tags: f.tags, sizes: f.sizes, description: f.desc, buy_url: f.buy_url || null };
      const write = r => sb.from('products').update(r).eq('id', id).select('id');
      let { data, error } = await write(row);
      if (noSizesCol(error, row)) ({ data, error } = await write(withoutSizes(row)));
      fail(error); if (!data || !data.length) throw new Error('No tienes permiso para este cambio.');
    },
    async adminBlocked() {
      const { data, error } = await sb.from('blocked_emails').select('*').order('created_at', { ascending: false });
      if (error) { if (/blocked_emails|schema cache|does not exist|Could not find/i.test(error.message || '')) return { missing: true, list: [] }; throw new Error(error.message); }
      return { list: data || [] };
    },
    async adminBlock(email, reason) {
      const { error } = await sb.from('blocked_emails').upsert({ email: email.toLowerCase().trim(), reason: reason || null });
      if (error) throw new Error(/blocked_emails|schema cache|Could not find/i.test(error.message || '') ? 'Para bloquear correos falta ejecutar supabase/panel.sql en Supabase.' : error.message);
    },
    async adminUnblock(email) { const { error } = await sb.from('blocked_emails').delete().eq('email', email); fail(error); },
    // --- moderación y denuncias ---
    async adminSetStatus(id, status, reason) {
      const { data, error } = await sb.from('products').update({ status, reject_reason: status === 'rejected' ? (reason || null) : null }).eq('id', id).select('id');
      if (error) throw new Error(/status|reject_reason/.test(error.message || '') ? 'Falta ejecutar supabase/moderacion.sql en Supabase.' : error.message);
      if (!data || !data.length) throw new Error('No tienes permiso para este cambio.');
    },
    async reportProduct(pid, reason, details) {
      const { error } = await sb.rpc('report_product', { p_product: pid, p_reason: reason, p_details: details || null });
      if (error) throw new Error(/report_product|schema cache|Could not find/i.test(error.message || '') ? 'Las denuncias aún no están activadas. Escríbenos por correo.' : error.message);
    },
    async adminReports() {
      const { data, error } = await sb.from('reports').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(200);
      if (error) { if (/reports|schema cache|does not exist|Could not find/i.test(error.message || '')) return { missing: true, list: [] }; throw new Error(error.message); }
      return { list: data || [] };
    },
    async adminResolveReport(id) { const { error } = await sb.from('reports').update({ status: 'resolved' }).eq('id', id); fail(error); },
    async adminResolveReportsFor(pid) { const { error } = await sb.from('reports').update({ status: 'resolved' }).eq('product_id', pid).eq('status', 'open'); fail(error); },
    // --- visitas de la web (panel de creador) ---
    async logSite(kind, page, source, device, results) {
      try {
        const args = { p_kind: kind, p_page: page || null, p_source: source || null, p_device: device || null };
        if (kind === 'search') args.p_results = results;
        await sb.rpc('log_site_event', args);
      } catch {}
    },
    async siteStats(days) {
      const { data, error } = await sb.rpc('site_stats', { p_days: days });
      if (error) { if (/site_stats|schema cache|does not exist|Could not find/i.test(error.message || '')) return { missing: true }; throw new Error(error.message); }
      return data;
    },
    async adminSetManual(id, on) {
      const { error } = await sb.from('brand_billing').upsert({ brand_id: id, manual: on, updated_at: new Date().toISOString() }, { onConflict: 'brand_id' }); fail(error);
    },
    // --- mensajes entre marcas y creador (mensajes.sql) ---
    async chatList() {
      const { data, error } = await sb.from('messages').select('id, brand_id, from_admin, body, created_at, read_at').order('created_at', { ascending: false }).limit(2000);
      if (error) { if (chatMissing(error)) return { missing: true, list: [] }; throw new Error(error.message); }
      return { list: data || [] };
    },
    async chatThread(brandId) {
      const { data, error } = await sb.from('messages').select('*').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(300);
      if (error) throw new Error(chatMissing(error) ? 'FOUND_CHAT_MISSING' : error.message);
      return (data || []).reverse();
    },
    async chatSend(brandId, body, productId, fromAdmin) {
      const { error } = await sb.from('messages').insert({ brand_id: brandId, body, product_id: productId || null, from_admin: !!fromAdmin });
      if (error) throw new Error(chatMissing(error) ? 'Los mensajes aún no están activados (falta ejecutar supabase/mensajes.sql).' : error.message);
    },
    async chatRead(brandId) { try { await sb.rpc('chat_mark_read', { p_brand: brandId }); } catch {} },
    async chatUnread(asAdmin) {
      const { count, error } = await sb.from('messages').select('id', { count: 'exact', head: true }).is('read_at', null).eq('from_admin', !asAdmin);
      return error ? 0 : (count || 0);
    },
    chatSubscribe(cb) {
      try { this._chat = sb.channel('found-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => cb()).subscribe(); } catch {}
    },
    chatUnsubscribe() { try { if (this._chat) sb.removeChannel(this._chat); } catch {} this._chat = null; }
  };
}

/* ==========================================================
   BACKEND DEMO (localStorage)
   ========================================================== */
function demoApi() {
  const KEY = 'found_demo_v1';
  let db = lsGet(KEY, null);
  function save() { if (!lsSet(KEY, db)) throw new Error('No hay espacio en el navegador para guardar más datos de demo.'); }
  if (!db) { db = seed(); lsSet(KEY, db); }
  if (!db.billing) { db.billing = {}; db.users.filter(u => u.role === 'brand' && /^b\d$/.test(u.id)).forEach(u => { db.billing[u.id] = { brand_id: u.id, status: 'none', manual: true }; }); lsSet(KEY, db); }
  const activeB = id => { const b = db.billing[id]; return !!b && (b.manual || ['active', 'trialing', 'past_due'].includes(b.status)); };
  const me = () => db.users.find(u => u.id === db.session) || null;
  const userObj = u => u && { id: u.id, email: u.email };
  const withBrand = p => { const b = db.users.find(u => u.id === p.brand_id) || {}; return norm({ ...p, brand: b.brand_name, contact: b.contact_email, bio: b.brand_bio, logo: b.logo_url, cover: b.cover_url }); };
  return {
    live: false,
    onChange() {},
    async init() { const u = me(); return { user: userObj(u), profile: u ? { ...u } : null }; },
    async signUp({ email, role, brandName }) {
      if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Ya existe una cuenta con ese correo.');
      if ((db.blocked || []).some(x => x.email === email.toLowerCase().trim())) throw new Error('FOUND_EMAIL_BLOQUEADO');
      const u = { id: 'u' + Date.now(), email, role, brand_name: role === 'brand' ? brandName : null, brand_bio: '', contact_email: role === 'brand' ? email : '', styles: [], cats: [], budget: 150 };
      db.users.push(u); db.session = u.id; save(); return { needsConfirm: false, userId: u.id };
    },
    async signIn({ email }) {
      const u = db.users.find(x => x.email.toLowerCase() === email.toLowerCase());
      if (!u) throw new Error('No encontramos esa cuenta en el modo demo. Crea una primero.');
      db.session = u.id; save();
    },
    async signOut() { db.session = null; save(); },
    async saveProfile(uid, patch) { const u = db.users.find(x => x.id === uid); Object.assign(u, patch); save(); },
    async listProducts() {
      const u = me(), admin = u && u.role === 'admin';
      const on = db.settings && db.settings.billing && db.settings.billing.enabled === true;
      return db.products.filter(p => admin || (u && p.brand_id === u.id) || ((!on || activeB(p.brand_id)) && (p.status || 'approved') === 'approved')).map(withBrand).sort((a, b) => String(b.created).localeCompare(String(a.created)));
    },
    async saveProduct(uid, f, photos, id) {
      const images = [];
      for (const ph of photos.slice(0, MAX_PHOTOS)) images.push(ph.url || await blobToDataUrl(await shrink(ph.file, 640, 0.7)));
      const row = { name: f.name, price: f.price, cat: f.cat, tags: f.tags, sizes: f.sizes, color: f.color, desc: f.desc, buy_url: f.buy_url, image: images[0] || '', images };
      // misma lógica que la base de datos real (moderacion.sql)
      const u = me(), modOn = !(db.settings && db.settings.moderation === false);
      if (id) {
        const old = db.products.find(p => p.id === id), st = old.status || 'approved';
        if (u && u.role !== 'admin' && (st === 'rejected' || (st === 'approved' && modOn && (JSON.stringify(row.images) !== JSON.stringify(old.images || (old.image ? [old.image] : [])) || row.name !== old.name)))) { row.status = modOn ? 'pending' : 'approved'; row.reason = ''; }
        Object.assign(old, row);
      } else db.products.push({ id: 'd' + Date.now(), brand_id: uid, created: new Date().toISOString(), status: (u && u.role === 'admin') || !modOn ? 'approved' : 'pending', ...row });
      save();
    },
    async adminSaveCounts() { const m = {}; Object.values(db.favs).forEach(l => l.forEach(id => { m[id] = (m[id] || 0) + 1; })); return m; },
    async adminUpdateProduct(id, f) { Object.assign(db.products.find(p => p.id === id), { name: f.name, price: f.price, cat: f.cat, tags: f.tags, sizes: f.sizes, desc: f.desc, buy_url: f.buy_url }); save(); },
    async adminBlocked() { return { list: (db.blocked || []).slice().reverse() }; },
    async adminBlock(email, reason) { db.blocked = (db.blocked || []).filter(x => x.email !== email.toLowerCase().trim()); db.blocked.push({ email: email.toLowerCase().trim(), reason: reason || '', created_at: new Date().toISOString() }); save(); },
    async adminUnblock(email) { db.blocked = (db.blocked || []).filter(x => x.email !== email); save(); },
    async adminSetStatus(id, status, reason) { const p = db.products.find(x => x.id === id); p.status = status; p.reason = status === 'rejected' ? (reason || '') : ''; save(); },
    async reportProduct(pid, reason, details) {
      db.reports = db.reports || [];
      if (db.reports.some(r => r.product_id === pid && r.v === VISITOR)) return;
      db.reports.push({ id: Date.now(), created_at: new Date().toISOString(), product_id: pid, reason, details: details || '', status: 'open', v: VISITOR }); save();
    },
    async adminReports() { return { list: (db.reports || []).filter(r => r.status === 'open' && db.products.some(p => p.id === r.product_id)).sort((a, b) => b.id - a.id) }; },
    async adminResolveReport(id) { const r = (db.reports || []).find(x => x.id === id); if (r) r.status = 'resolved'; save(); },
    async adminResolveReportsFor(pid) { (db.reports || []).forEach(r => { if (r.product_id === pid) r.status = 'resolved'; }); save(); },
    async uploadBrandImage(uid, file, kind) { const o = BRAND_IMG[kind]; return blobToDataUrl(await shrink(file, kind === 'logo' ? 240 : kind === 'style' ? 520 : 1000, 0.72, o.type)); },
    async removeProduct(id) { db.products = db.products.filter(p => p.id !== id); Object.keys(db.favs).forEach(k => { db.favs[k] = db.favs[k].filter(x => x !== id); }); save(); },
    async getSettings() { return db.settings || null; },
    async saveSettings(v) { if (v === null) delete db.settings; else db.settings = v; save(); },
    async adminOverview() { return { buyers: db.users.filter(u => u.role === 'buyer').length, brands: db.users.filter(u => u.role === 'brand').length, products: db.products.length, favs: Object.values(db.favs).reduce((a, l) => a + l.length, 0) }; },
    async adminProfiles() { return db.users.map(u => ({ id: u.id, role: u.role, brand_name: u.brand_name, contact_email: u.contact_email || u.email, created_at: '' })); },
    async adminSetRole(id, role) { db.users.find(u => u.id === id).role = role; save(); },
    async adminUsers() { return { list: db.users.map(u => ({ id: u.id, email: u.email, role: u.role, brand_name: u.brand_name, contact_email: u.contact_email, created_at: /^u\d+$/.test(u.id) ? new Date(+u.id.slice(1)).toISOString() : '', last_sign_in_at: '', products: db.products.filter(p => p.brand_id === u.id).length })) }; },
    async adminDeleteUser(id) {
      const u = db.users.find(x => x.id === id); if (!u) throw new Error('Esa cuenta ya no existe');
      if (id === db.session) throw new Error('No puedes borrar tu propia cuenta desde aquí');
      if (u.role === 'admin') throw new Error('No se puede borrar una cuenta de creador. Cámbiala antes a comprador.');
      const gone = new Set(db.products.filter(p => p.brand_id === id).map(p => p.id));
      db.products = db.products.filter(p => p.brand_id !== id);
      delete db.favs[id]; Object.keys(db.favs).forEach(k => { db.favs[k] = db.favs[k].filter(x => !gone.has(x)); });
      db.users = db.users.filter(x => x.id !== id); if (db.billing) delete db.billing[id];
      save();
    },
    async adminSetFeatured(id, on) { db.products.find(x => x.id === id).featured = on; save(); },
    async listFavs(uid) { return db.favs[uid] || []; },
    async setFav(uid, pid, on) { const s = new Set(db.favs[uid] || []); on ? s.add(pid) : s.delete(pid); db.favs[uid] = [...s]; save(); },
    async saveCounts(uid) {
      const mine = new Set(db.products.filter(p => p.brand_id === uid).map(p => p.id)), m = {};
      Object.values(db.favs).forEach(list => list.forEach(id => { if (mine.has(id)) m[id] = (m[id] || 0) + 1; }));
      return m;
    },
    async track(pid, kind, visitor) {
      const p = db.products.find(x => x.id === pid), u = me(); if (!p) return;
      if (u && (u.id === p.brand_id || u.role === 'admin')) return;
      db.events = db.events || [];
      if (db.events.some(e => e.pid === pid && e.kind === kind && e.v === visitor && Date.now() - e.t < 30 * 60e3)) return;
      db.events.push({ pid, brand: p.brand_id, kind, v: visitor, t: Date.now() }); save();
    },
    async eventCounts(days) {
      const u = me(), m = {}, from = days ? Date.now() - days * 864e5 : 0;
      (db.events || []).filter(e => e.t >= from && u && (e.brand === u.id || u.role === 'admin')).forEach(e => {
        const r = m[e.pid] || (m[e.pid] = { views: 0, buys: 0 }); e.kind === 'view' ? r.views++ : r.buys++;
      });
      return m;
    },
    async logSite(kind, page, source, device, results) {
      const u = me(); if (u && u.role === 'admin') return;
      db.site = db.site || [];
      db.site.push({ kind, page: kind === 'search' ? String(page || '').trim().toLowerCase().slice(0, 40) : page, source: kind === 'visit' ? (source || 'Directo') : null, device, results: kind === 'search' ? results : null, v: VISITOR + ':' + madridDay(Date.now()), t: Date.now() });
      if (db.site.length > 5000) db.site = db.site.slice(-5000);
      try { save(); } catch {}
    },
    async siteStats(days) { return aggregateSite(db.site || [], days); },
    async getBilling(uid) { return db.billing[uid] || null; },
    async adminBilling() { return { ...db.billing }; },
    async adminSetManual(id, on) { db.billing[id] = { ...(db.billing[id] || { brand_id: id, status: 'none' }), manual: on }; save(); },
    async demoPay(uid) { db.billing[uid] = { ...(db.billing[uid] || { brand_id: uid }), status: 'active', manual: false, cancel_at_period_end: false, current_period_end: new Date(Date.now() + 30 * 864e5).toISOString() }; save(); },
    // --- mensajes (misma lógica que mensajes.sql) ---
    async chatList() { const u = me(); return { list: (db.messages || []).filter(m => u && (u.role === 'admin' || m.brand_id === u.id)).slice().reverse() }; },
    async chatThread(brandId) { const u = me(); if (!u || (u.role !== 'admin' && u.id !== brandId)) return []; return (db.messages || []).filter(m => m.brand_id === brandId); },
    async chatSend(brandId, body, productId, fromAdmin) {
      const u = me(); if (!u) throw new Error('Entra con tu cuenta.');
      if (fromAdmin ? u.role !== 'admin' : (u.role !== 'brand' || u.id !== brandId)) throw new Error('No puedes escribir en esta conversación.');
      db.messages = db.messages || [];
      db.messages.push({ id: Date.now() + Math.random(), brand_id: brandId, from_admin: !!fromAdmin, body, product_id: productId || null, created_at: new Date().toISOString(), read_at: null });
      save();
    },
    async chatRead(brandId) { const u = me(); if (!u) return; (db.messages || []).forEach(m => { if (m.brand_id === brandId && !m.read_at && (u.role === 'admin' ? !m.from_admin : (u.id === brandId && m.from_admin))) m.read_at = new Date().toISOString(); }); save(); },
    async chatUnread(asAdmin) { const u = me(); if (!u) return 0; return (db.messages || []).filter(m => !m.read_at && (asAdmin ? !m.from_admin : (m.from_admin && m.brand_id === u.id))).length; }
  };
  function seed() {
    const B = [
      ['b1', 'Norte Atelier', 'Prendas atemporales de lino y lana reciclada, hechas en pequeñas tiradas.'],
      ['b2', 'Marea Studio', 'Vestidos y calzado con caída elegante y patronaje cuidado.'],
      ['b3', 'Calle 33', 'Streetwear de edición limitada diseñado en la ciudad.'],
      ['b4', 'Lúa Vintage', 'Piezas rescatadas y rehechas con alma de archivo.'],
      ['b5', 'Raíz Textil', 'Tejidos naturales, tintes vegetales y trabajo artesano.'],
      ['b6', 'Ola Sport', 'Ropa deportiva técnica con materiales reciclados.']
    ];
    const users = B.map(([id, n, bio]) => ({ id, email: id + '@demo.found', role: 'brand', brand_name: n, brand_bio: bio, contact_email: 'hola@' + n.toLowerCase().replace(/[^a-z0-9]/g, '') + '.demo', styles: [], cats: [], budget: 150 }));
    const P = [
      ['b1','Camiseta lino bruma',38,'Camisetas',['Minimalista','Sostenible'],'#C9C4B0','Lino lavado de cultivo europeo. Corte recto y cuello limpio, pensada para durar años.'],
      ['b2','Vestido midi Marea',96,'Vestidos',['Elegante','Minimalista'],'#2F3E8F','Caída fluida, cintura marcada y espalda abierta. Se pasa del día a la noche.'],
      ['b3','Bomber Calle 33',119,'Chaquetas',['Streetwear'],'#E3573B','Bomber oversize con forro acolchado y puños elásticos. Edición limitada de 200 unidades.'],
      ['b4','Pantalón pana Lúa',64,'Pantalones',['Vintage','Bohemio'],'#9A6B3F','Pana gruesa de talle alto y pierna ancha, inspirada en archivos de los setenta.'],
      ['b6','Zapatilla Ola Run',89,'Calzado',['Deportivo','Streetwear'],'#2FA58C','Suela amortiguada, malla transpirable y peso pluma. Para correr o para el día a día.'],
      ['b5','Bolso asa Raíz',72,'Complementos',['Sostenible','Bohemio'],'#C9A24D','Tejido a mano con fibras recicladas. Cada pieza tiene un patrón único.'],
      ['b3','Camiseta boxy negra',34,'Camisetas',['Streetwear','Minimalista'],'#2B2D42','Algodón orgánico de 240 g, hombro caído y estampado serigrafiado a mano.'],
      ['b2','Vestido lencero seda',140,'Vestidos',['Elegante'],'#B23A5E','Seda lavable con tirantes ajustables. Un básico para ocasiones especiales.'],
      ['b4','Chaqueta vaquera vintage',85,'Chaquetas',['Vintage','Streetwear'],'#5B7DB1','Denim recuperado y rehecho en taller local. Cada una pasa por lavado artesanal.'],
      ['b6','Leggings técnicos Ola',49,'Pantalones',['Deportivo'],'#3B3FE0','Compresión media, cintura alta sin costuras y bolsillo para el móvil.'],
      ['b5','Sandalia cuero Raíz',78,'Calzado',['Bohemio','Sostenible'],'#A9714B','Cuero curtido al vegetal y suela de corcho. Se amolda al pie con el uso.'],
      ['b1','Abrigo lana Norte',189,'Chaquetas',['Elegante','Minimalista','Sostenible'],'#8E8672','Lana reciclada certificada. Silueta recta, forro interior y costuras vistas.'],
      ['b4','Pañuelo seda estampado',29,'Complementos',['Vintage','Elegante'],'#D6527A','Estampados rescatados de archivo, impresos en seda con tintas al agua.'],
      ['b5','Vestido lino Raíz',92,'Vestidos',['Bohemio','Sostenible'],'#B9AD8E','Lino teñido con plantas, manga corta y bolsillos amplios.']
    ];
    const now = Date.now();
    const demoSizes = (cat, i) => cat === 'Calzado' ? ['37', '38', '39', '40', '41', '42', '43'].filter((_, k) => (k + i) % 4) : cat === 'Complementos' ? ['Única'] : ['XS', 'S', 'M', 'L', 'XL'].filter((_, k) => (k + i) % 3);
    const products = P.map(([b, name, price, cat, tags, color, desc], i) => ({ id: 'd' + (i + 1), brand_id: b, name, price, cat, tags, sizes: demoSizes(cat, i), color, desc, image: '', buy_url: '', created: new Date(now - i * 3600e3).toISOString() }));
    return { users, products, favs: {}, session: null };
  }
}

/* ==========================================================
   ESTADO
   ========================================================== */
const configured = !!(C.supabaseUrl && C.supabaseAnonKey);
const hasLib = !!window.supabase;
const api = configured && hasLib ? supabaseApi() : demoApi();
const S = {
  user: null, profile: null, products: [], allProducts: [], favs: new Set(), counts: {},
  taste: lsGet('found_taste', null),
  cat: 'Todo', style: 'Todos', q: '', sort: 'match', authMode: 'in', authRole: 'buyer',
  formTags: [], formSizes: [], formPhotos: [], onlyMine: true, editing: null, draft: null, settings: null, adminTab: 'resumen', siteDays: 30, rankDays: 30,
  billing: null, ev: {}, statsDays: 30, editMode: false, textDraft: {}, colorDraft: null, colorsOpen: false, resetTexts: false,
  unread: 0, chat: { brand: null, product: null, draft: '', thread: [] }
};
const DEFAULTS = JSON.parse(JSON.stringify({ appName: C.appName, tagline: C.tagline, styles: C.styles, categories: C.categories }));
const DEFAULT_ACCENT = '#2F4A3A';
const inkFor = hex => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6 ? '#15201A' : '#FFFFFF'; };
function applySettings(v) {
  v = v || {};
  C.appName = v.appName || DEFAULTS.appName;
  C.tagline = v.tagline || DEFAULTS.tagline;
  C.styles = Array.isArray(v.styles) && v.styles.length ? v.styles : DEFAULTS.styles;
  C.categories = Array.isArray(v.categories) && v.categories.length ? v.categories : DEFAULTS.categories;
  C.announcement = v.announcement || '';
  const root = document.documentElement.style;
  applyColors({ ...(v.colors || {}), accent: (v.colors && v.colors.accent) || v.accent });
  root.setProperty('--ann-h', C.announcement ? '34px' : '0px');
  document.title = C.appName + ' · ' + C.tagline;
  S.settings = v;
}
/* ---------- colores editables ---------- */
const COLOR_FIELDS = [
  ['accent', 'Color de marca', 'Botones y detalles'],
  ['bg', 'Fondo de la web', 'El fondo general'],
  ['surface', 'Tarjetas', 'Tarjetas, formularios y ventanas'],
  ['ink', 'Texto', 'Títulos y textos'],
  ['deep', 'Bloques oscuros', 'Pie de página y bloque de marcas'],
  ['tagc', 'Etiqueta «% para ti»', 'Fondo de la etiqueta de encaje']
];
const COLOR_DEFAULTS = { accent: '#2F4A3A', bg: '#F6F4EF', surface: '#FFFFFF', ink: '#1A1A18', deep: '#2F4A3A', tagc: '#E3E8E1' };
function applyColors(c) {
  c = c || {};
  const r = document.documentElement.style, set = (k, v) => r.setProperty('--' + k, v);
  ['accent', 'accent-ink', 'accent-on-deep', 'bg', 'surface', 'ink', 'muted', 'line', 'soft', 'deep', 'deep-ink', 'tagc', 'tag-ink'].forEach(k => r.removeProperty('--' + k));
  if (isHex(c.accent)) { set('accent', c.accent); set('accent-ink', inkFor(c.accent)); set('accent-on-deep', lum(c.accent) < 0.5 ? mix(c.accent, 'w', 0.5) : c.accent); }
  if (isHex(c.bg)) set('bg', c.bg);
  if (isHex(c.surface)) set('surface', c.surface);
  if (isHex(c.ink)) set('ink', c.ink);
  if (isHex(c.bg) || isHex(c.ink)) {
    const bg = isHex(c.bg) ? c.bg : COLOR_DEFAULTS.bg, ink = isHex(c.ink) ? c.ink : COLOR_DEFAULTS.ink;
    set('soft', mix(bg, ink, 0.06)); set('line', mix(bg, ink, 0.12)); set('muted', mix(ink, bg, 0.42));
  }
  if (isHex(c.deep)) { set('deep', c.deep); set('deep-ink', lum(c.deep) < 0.5 ? '#F6F4EF' : '#1A1A18'); }
  if (isHex(c.tagc)) { set('tagc', c.tagc); set('tag-ink', lum(c.tagc) < 0.5 ? '#FFFFFF' : '#141414'); }
}

/* ---------- textos editables ---------- */
// Escribe *palabra* para ponerla en cursiva con el color de marca.
const TEXT_DEF = {};
const fmtText = t => esc(t).replace(/\*(.+?)\*/g, '<em>$1</em>');
const rawText = k => (k in S.textDraft) ? S.textDraft[k] : (!S.resetTexts && S.settings && S.settings.texts && typeof S.settings.texts[k] === 'string' && S.settings.texts[k]) ? S.settings.texts[k] : TEXT_DEF[k];
function T(k, def) {
  TEXT_DEF[k] = def;
  return S.editMode ? `<span data-ed="${k}" contenteditable="true" spellcheck="true">${fmtText(rawText(k))}</span>` : fmtText(rawText(k));
}

const isBrand = () => S.profile && S.profile.role === 'brand';
/* ---------- estadísticas de clics ---------- */
const VISITOR = (() => { let v = lsGet('found_vid', ''); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); lsSet('found_vid', v); } return v; })();
/* ---------- visitas de la web (las ve el creador en su panel) ---------- */
const DEVICE = (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || matchMedia('(max-width: 820px)').matches) ? 'movil' : 'ordenador';
// de dónde viene la visita: se calcula al cargar la página, antes de limpiar la dirección
const SOURCE = (() => {
  const SRC = [[/instagram/, 'Instagram'], [/tiktok/, 'TikTok'], [/(^|\.)google\./, 'Google'], [/(^|\.)bing\./, 'Bing'], [/facebook|(^|\.)fb\.(com|me)|(^|\.)m\.me$/, 'Facebook'],
    [/(^|\.)t\.co$|twitter|(^|\.)x\.com$/, 'X (Twitter)'], [/whatsapp|(^|\.)wa\.me$/, 'WhatsApp'], [/pinterest|(^|\.)pin\.it$/, 'Pinterest'], [/youtube|youtu\.be/, 'YouTube'],
    [/linkedin|lnkd\.in/, 'LinkedIn'], [/telegram|(^|\.)t\.me$/, 'Telegram'], [/duckduckgo/, 'DuckDuckGo'], [/yahoo/, 'Yahoo'], [/ecosia/, 'Ecosia']];
  const name = v => { v = String(v || '').toLowerCase(); const hit = SRC.find(([re]) => re.test(v)); return hit ? hit[1] : ''; };
  const q = new URLSearchParams(location.search);
  const utm = (q.get('utm_source') || '').trim();
  if (utm) return utm.charAt(0).toUpperCase() + utm.slice(1, 40); // tal cual, para distinguir cada publicación
  let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : ''; } catch {}
  if (ref && ref !== location.hostname) return name(ref) || ref.slice(0, 40);
  if (q.get('p') || q.get('m')) return 'Enlace compartido';
  return 'Directo';
})();
function logSite(kind, page, results) {
  if (!api.logSite || isAdmin() || S.editMode) return;
  api.logSite(kind, page || null, kind === 'visit' ? SOURCE : null, DEVICE, results);
}
// búsquedas: se apunta lo que la persona deja escrito (tras una pausa), una vez por término y visita
const searched = new Set(); let searchTimer = 0;
function logSearchSoon() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const term = S.q.trim().toLowerCase().replace(/\s+/g, ' ');
    if (term.length < 2 || searched.has(term) || S.route !== 'explorar') return;
    searched.add(term);
    const n = S.products.filter(p => (p.name + ' ' + p.brand + ' ' + p.tags.join(' ') + ' ' + p.cat).toLowerCase().includes(term)).length;
    logSite('search', term, n);
  }, 1400);
}
let lastPage = '';
function trackPage() {
  if (S.route === 'admin' || location.hash === lastPage) return;
  lastPage = location.hash;
  let first = false; try { first = !sessionStorage.getItem('found_sess'); if (first) sessionStorage.setItem('found_sess', '1'); } catch {}
  if (first) logSite('visit', S.route);
  logSite('page', S.route);
}

const tracked = new Set();
function track(pid, kind) {
  if (!pid || !api.track) return;
  const k = pid + ':' + kind; if (tracked.has(k)) return; tracked.add(k);
  api.track(pid, kind, VISITOR);
}
document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('[data-track]'); if (t && !S.editMode) { track(t.dataset.id, t.dataset.track); if (t.dataset.track === 'buy') logSite('buy'); } });

/* ---------- suscripción mensual de marcas ---------- */
const BILL = () => (S.settings && S.settings.billing) || {};
// Cobro a marcas: apagado hasta que el creador lo active en Creador > Ajustes
const billingOn = () => BILL().enabled === true;
const subPrice = () => { const n = Number(BILL().price); return n > 0 ? n : 0; };
const priceLabel = () => subPrice() ? money(subPrice()) + ' / mes' : 'Suscripción mensual';
const subActive = b => !!b && !b.missing && (b.manual || ['active', 'trialing', 'past_due'].includes(b.status));
const isActiveBrand = () => isBrand() && (!billingOn() || subActive(S.billing) || (S.billing && S.billing.missing));
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
function payUrl(uid, email) {
  const link = BILL().payLink;
  if (!isUrl(link) || !uid) return '';
  return link + (link.includes('?') ? '&' : '?') + 'client_reference_id=' + encodeURIComponent(uid) + (email ? '&prefilled_email=' + encodeURIComponent(email) : '');
}
async function refreshBilling() {
  if (!S.user || !isBrand() || !api.getBilling) { S.billing = null; return; }
  try { S.billing = await api.getBilling(S.user.id); } catch { S.billing = null; }
}
const PLAN_FEATURES = () => [T('plan.f1', 'Publica todas las prendas que quieras'), T('plan.f2', 'Te recomendamos a compradores de tu estilo'), T('plan.f3', 'Estadísticas de guardados por prenda'), T('plan.f4', 'Tu página de marca dentro de ' + C.appName)];
function payButton(label) {
  const url = S.user ? payUrl(S.user.id, S.user.email) : '';
  if (url) return `<a class="btn" href="${esc(url)}">${label} <span class="arr">→</span></a>`;
  if (!api.live) return `<button class="btn" data-act="demopay">${label} (demo) <span class="arr">→</span></button>`;
  return `<span class="muted">El pago aún no está disponible. Escríbenos y activaremos tu cuenta.</span>`;
}
const isAdmin = () => S.profile && S.profile.role === 'admin';
const hasTaste = () => S.taste && S.taste.styles && S.taste.styles.length > 0;

function matchPct(p) {
  if (!hasTaste()) return null;
  const t = S.taste;
  const ov = p.tags.filter(x => t.styles.includes(x)).length;
  const den = Math.max(1, Math.min(t.styles.length, p.tags.length));
  const tag = Math.min(1, ov / den);
  const cat = t.cats.length ? (t.cats.includes(p.cat) ? 1 : 0) : .5;
  const price = p.price <= t.budget ? 1 : .3;
  return Math.round(100 * (.6 * tag + .25 * cat + .15 * price));
}
/* ---------- tallas ---------- */
const SIZE_UNI = 'Única';
const SIZES_ROPA = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZES_PIE = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];
const SIZE_ORDER = [...SIZES_ROPA, ...SIZES_PIE, SIZE_UNI];
// el tipo de talla se deduce del nombre de la categoría (así funciona aunque cambies las categorías)
const sizeKind = cat => /calzado|zapat|bota|sandalia|sneaker|deportiva/i.test(cat || '') ? 'pie'
  : /complement|accesori|bolso|joya|bisuter|gorr|sombrer|bufanda|pañuelo/i.test(cat || '') ? 'uni' : 'ropa';
const sizeOptions = cat => [...(sizeKind(cat) === 'pie' ? SIZES_PIE : SIZES_ROPA), SIZE_UNI];
const sortSizes = l => [...l].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));
const mySizes = () => (S.taste && Array.isArray(S.taste.sizes)) ? S.taste.sizes : [];
const hasSizes = () => mySizes().length > 0;
const mySizesFor = cat => mySizes().filter(s => (sizeKind(cat) === 'pie' ? SIZES_PIE : SIZES_ROPA).includes(s));
// true = hay tu talla · false = no hay · null = no se sabe (sin tallas guardadas o prenda sin tallas)
function fitsMe(p) {
  if (!hasSizes() || !p.sizes.length) return null;
  if (p.sizes.includes(SIZE_UNI)) return true;
  const mine = mySizesFor(p.cat);
  if (!mine.length) return null;
  return p.sizes.some(s => mine.includes(s));
}
const mySizesLabel = () => sortSizes(mySizes()).join(' · ');
const sizeChips = (p, cls = '') => sortSizes(p.sizes).map(s => `<span class="sz${cls}${mySizes().includes(s) || (s === SIZE_UNI && hasSizes()) ? ' mine' : ''}">${s === SIZE_UNI ? 'Talla única' : esc(s)}</span>`).join('');

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 3200);
}
const go = name => { location.hash = '#/' + name; };
const view = $('#view');

/* ---------- carga de datos ---------- */
// S.allProducts: todo lo que esta cuenta puede ver (la marca, también las suyas pendientes; el creador, todas).
// S.products: solo lo publicado, que es lo que se enseña en la web.
async function refreshProducts() {
  try { S.allProducts = await api.listProducts(); } catch (e) { S.allProducts = []; toast('No se pudieron cargar los productos: ' + e.message); }
  S.products = S.allProducts.filter(p => p.status === 'approved');
}
const findProduct = id => S.allProducts.find(x => x.id === id);
const modOn = () => !(S.settings && S.settings.moderation === false);
const guestFavs = () => new Set(lsGet('found_guest_favs', []));
async function afterAuth() {
  const { user, profile } = await api.init();
  S.user = user; S.profile = profile;
  if (user) {
    // gustos: si el perfil los tiene, mandan; si no, subimos los del invitado
    if (profile && profile.styles && profile.styles.length) S.taste = { styles: profile.styles, cats: profile.cats || [], budget: profile.budget || 150, sizes: Array.isArray(profile.sizes) && profile.sizes.length ? profile.sizes : mySizes() };
    else if (hasTaste()) { try { await api.saveProfile(user.id, { styles: S.taste.styles, cats: S.taste.cats, budget: S.taste.budget, sizes: mySizes() }); } catch {} }
    // favoritos del invitado -> cuenta
    const g = guestFavs();
    for (const id of g) { try { await api.setFav(user.id, id, true); } catch {} }
    if (g.size) lsSet('found_guest_favs', []);
    try { S.favs = new Set(await api.listFavs(user.id)); } catch { S.favs = new Set(); }
    await refreshBilling();
  } else { S.favs = guestFavs(); S.billing = null; }
  startChatWatch();
}

/* ==========================================================
   CABECERA Y NAVEGACIÓN
   ========================================================== */
function renderNav() {
  const r = S.route;
  // [ruta, texto, icono, dónde: d = menú de escritorio, t = barra móvil]
  const links = [['inicio', 'Inicio', ICON.home, 't'], ['descubrir', 'Descubrir', ICON.compass, 'dt'], ['explorar', 'Explorar', ICON.grid, 'dt'], ['marcas', 'Marcas', ICON.store, 'd'], ['guardados', 'Guardados', ICON.heart, 'dt']];
  // contador de mensajes sin leer: en el móvil va sobre «Mi panel» / «Creador»; en el ordenador, también sobre «Mensajes»
  const nb = `<span class="tabn navn" data-unread${S.unread ? '' : ' hidden'}>${S.unread}</span>`;
  if (isBrand()) { links.push(['panel', 'Mi panel', ICON.store, 't', nb]); links.push(['panel', 'Mi panel', ICON.store, 'd']); links.push(['mensajes', 'Mensajes', ICON.store, 'd', nb]); }
  if (isAdmin()) links.push(['admin', 'Creador', ICON.cog, 'dt', nb]);
  links.push([S.user ? 'cuenta' : 'entrar', S.user ? 'Cuenta' : 'Entrar', ICON.user, 'dt']);
  const cur = n => (r === n || (n === 'cuenta' && r === 'gustos') || (n === 'marcas' && r === 'marca') || (n === 'entrar' && r === 'vender') || (n === 'panel' && r === 'mensajes' && !isAdmin())) ? ' aria-current="page"' : '';
  const curD = n => (n === 'panel' || n === 'mensajes') ? (r === n ? ' aria-current="page"' : '') : cur(n);
  const cta = !isBrand() && !isAdmin() ? `<a class="cta" href="#/vender">Vende en ${esc(C.appName)}</a>` : '';
  // v4 · escaparate: fila 1 = logo, buscador y cuenta; fila 2 = secciones y categorías (solo en ordenador)
  const MAIN = ['descubrir', 'explorar', 'marcas', 'guardados'];
  const acts = links.filter(l => l[3].includes('d') && !MAIN.includes(l[0])).map(([n, l, , , x]) => `<a href="#/${n}"${curD(n)}>${l}${x || ''}</a>`).join('');
  const catCur = c => r === 'explorar' && S.cat === c ? ' aria-current="page"' : '';
  $('#top').innerHTML = `${C.announcement ? `<div class="ann" role="note">${esc(C.announcement)}</div>` : ''}<div class="wrap">
    <div class="hrow"><a class="logo" href="#/inicio" aria-label="${esc(C.appName)}, inicio">${esc(C.appName.slice(0, -1))}<b>${esc(C.appName.slice(-1))}</b>${api.live ? '' : '<span class="demo" title="Los datos se guardan solo en este navegador">DEMO</span>'}</a>
      <form class="hsearch" id="hsearch" role="search">${ICON.search}<input type="search" id="hq" placeholder="${matchMedia('(max-width:480px)').matches ? 'Buscar en ' + esc(C.appName) : 'Busca prendas, marcas o estilos'}" aria-label="Buscar en ${esc(C.appName)}" value="${esc(S.q)}" autocomplete="off"></form>
      <nav class="nav" aria-label="Cuenta"><a class="hfav" href="#/guardados" aria-label="Guardados"${cur('guardados')}>${ICON.heart}<span>Guardados</span></a>${acts}${cta}</nav></div>
    <nav class="hcats" aria-label="Principal"><a href="#/inicio"${cur('inicio')}>Inicio</a><a href="#/descubrir"${cur('descubrir')}>Descubrir</a><a href="#/explorar"${r === 'explorar' && S.cat === 'Todo' ? ' aria-current="page"' : ''}>Explorar</a>${C.categories.map(c => `<a href="#/explorar" data-act="gocat" data-v="${esc(c)}"${catCur(c)}>${esc(c)}</a>`).join('')}<a href="#/marcas"${cur('marcas')}>Marcas</a></nav></div>`;
  $('#tabbar').innerHTML = links.filter(l => l[3].includes('t')).map(([n, l, i, , x]) => `<a href="#/${n}"${cur(n)}>${i}<span>${l}</span>${x || ''}</a>`).join('');
  renderFoot();
}
function renderFoot() {
  const year = new Date().getFullYear();
  const contact = C.contactEmail ? `<li><a href="mailto:${esc(C.contactEmail)}">${esc(C.contactEmail)}</a></li>` : '';
  const ig = isUrl(C.instagram) ? `<li><a href="${esc(C.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a></li>` : '';
  $('#foot').innerHTML = `<div class="wrap"><div class="cols">
    <div><a class="logo" href="#/inicio">${esc(C.appName.slice(0, -1))}<b>${esc(C.appName.slice(-1))}</b></a><p>${T('foot.text', C.tagline + '. Marcas independientes y prendas elegidas según tu estilo.')}</p></div>
    <div><h4>Comprar</h4><ul><li><a href="#/descubrir">Descubrir</a></li><li><a href="#/explorar">Explorar</a></li><li><a href="#/marcas">Marcas</a></li><li><a href="#/gustos">Test de estilo</a></li><li><a href="#/guardados">Guardados</a></li></ul></div>
    <div><h4>Marcas</h4><ul><li><a href="#/vender">Vende en ${esc(C.appName)}</a></li>${isBrand() ? '<li><a href="#/panel">Mi panel</a></li>' : '<li><a href="#/vender">Crear cuenta de marca</a></li>'}</ul></div>
    <div><h4>${esc(C.appName)}</h4><ul><li><a href="#/inicio">Cómo funciona</a></li>${contact}${ig}<li><a href="#/${S.user ? 'cuenta' : 'entrar'}">${S.user ? 'Mi cuenta' : 'Entrar'}</a></li></ul></div>
  </div><div class="legal"><span>© ${year} ${esc(C.appName)}</span><span>${T('foot.legal', 'La compra se realiza en la tienda de cada marca.')}</span></div></div>`;
}

/* ==========================================================
   TARJETAS
   ========================================================== */
function cardHTML(p) {
  const m = matchPct(p), fav = S.favs.has(p.id);
  return `<article class="card">
    <button class="tile" data-act="open" data-id="${esc(p.id)}" aria-label="Ver ${esc(p.name)}" style="background:${tileBg(p)}">${pic(p, p.name)}${p.images[1] ? `<img class="alt" src="${esc(p.images[1])}" alt="" loading="lazy"><span class="nph" aria-hidden="true">${p.images.length} fotos</span>` : ''}</button>
    ${m !== null ? `<span class="hang">${m} % para ti</span>` : ''}
    <button class="heart" data-act="fav" data-id="${esc(p.id)}" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de guardados' : 'Guardar'}: ${esc(p.name)}">${ICON.heart}</button>
    <div class="meta"><div class="p">${money(p.price)}</div><div class="n">${esc(p.name)}</div><div class="b">${[sizeLine(p), esc(p.brand)].filter(Boolean).join(' · ')}${p.featured ? ' · <b>Destacado</b>' : ''}</div></div>
  </article>`;
}
// «Talla M» si la prenda tiene tu talla; si no, sus tallas (como en las apps de segunda mano)
function sizeLine(p) {
  if (!p.sizes || !p.sizes.length) return '';
  if (p.sizes.includes(SIZE_UNI)) return 'Talla única';
  const mine = sortSizes(p.sizes.filter(s => mySizes().includes(s)));
  const l = mine.length ? mine : sortSizes(p.sizes);
  return 'Talla ' + esc(l.slice(0, 3).join(', ')) + (l.length > 3 ? '…' : '');
}
function ranked(list) {
  const l = [...list];
  if (S.sort === 'price-asc') l.sort((a, b) => a.price - b.price);
  else if (S.sort === 'price-desc') l.sort((a, b) => b.price - a.price);
  else if (S.sort === 'new') l.sort((a, b) => String(b.created).localeCompare(String(a.created)));
  else { const sc = p => (hasTaste() ? matchPct(p) : 0) + (p.featured ? 15 : 0); l.sort((a, b) => sc(b) - sc(a)); }
  return l;
}
function applyFilters(list) {
  const q = S.q.trim().toLowerCase();
  return list.filter(p => (S.cat === 'Todo' || p.cat === S.cat) && (S.style === 'Todos' || p.tags.includes(S.style)) && (!S.onlyMine || fitsMe(p) !== false) && (!q ||(p.name + ' ' + p.brand + ' ' + p.tags.join(' ') + ' ' + p.cat).toLowerCase().includes(q)));
}

/* marcas a partir de los productos publicados */
function brandList() {
  const m = new Map();
  S.products.forEach(p => {
    if (!m.has(p.brand_id)) m.set(p.brand_id, { id: p.brand_id, name: p.brand, bio: p.bio, contact: p.contact, logo: p.logo, cover: p.cover, items: [], color: p.color });
    m.get(p.brand_id).items.push(p);
  });
  return [...m.values()].sort((a, b) => b.items.length - a.items.length);
}
const avatar = (b, lg) => b.logo
  ? `<span class="avatar has-img${lg ? ' lg' : ''}" aria-hidden="true"><img src="${esc(b.logo)}" alt=""></span>`
  : `<span class="avatar${lg ? ' lg' : ''}" style="background:${esc(b.color)}" aria-hidden="true">${esc((b.name || '?').trim().charAt(0).toUpperCase())}</span>`;
const miniLogo = url => url ? `<img class="minilogo" src="${esc(url)}" alt="">` : '';
const softBg = c => `color-mix(in srgb, ${c} 26%, #F2F0EA)`;
function brandCardHTML(b) {
  return `<a class="brandcard${b.cover ? ' hascover' : ''}" href="#/marca/${esc(b.id)}">${b.cover ? `<span class="bc-cover"><img src="${esc(b.cover)}" alt="" loading="lazy"></span>` : ''}${avatar(b)}<div><b>${esc(b.name)}</b><small>${b.items.length} ${b.items.length === 1 ? 'prenda' : 'prendas'}</small></div>
    ${b.bio ? `<p>${esc(b.bio)}</p>` : ''}
    <div class="strip">${[0, 1, 2].map(i => b.items[i] ? `<div style="background:${tileBg(b.items[i])}">${pic(b.items[i])}</div>` : '<div></div>').join('')}</div></a>`;
}
// colores de las etiquetas de cada estilo: kraft, chambray, rosa empolvado, salvia, lino, lila, menta, mostaza, gris
// foto de cada estilo (se sube en Creador > Ajustes > Fotos de los estilos)
const styleImg = s => { const m = S.settings && S.settings.styleImages; const u = m && m[s]; return typeof u === 'string' && (isUrl(u) || u.startsWith('data:image/')) ? u : ''; };
const STYLE_COLORS = ['#DCD6CA', '#C9CCC0', '#D6CCC0', '#CBCBC6', '#D9D2C3', '#C3C8BB', '#D2CBBE', '#E0D8C8', '#CFD2CB'];
const styleCount = s => S.products.filter(p => p.tags.includes(s)).length;

/* ==========================================================
   VISTAS
   ========================================================== */
const VIEWS = {};

/* --- Inicio (portada) --- */
VIEWS.inicio = () => {
  // v4 · escaparate: como una app de compra, lo primero que ves son prendas
  const fit = l => (S.onlyMine && hasSizes()) ? l.filter(p => fitsMe(p) !== false) : l;
  const top = ranked(fit(S.products));
  const brands = brandList();
  const pick = top.slice(0, 3);
  const ph = ['#DCD6CA', '#C9CCC0', '#D6CCC0'];
  const heroPics = [0, 1, 2].map(i => pick[i]
    ? `<button class="hpic" data-act="open" data-id="${esc(pick[i].id)}" aria-label="Ver ${esc(pick[i].name)}" style="background:${tileBg(pick[i])}">${pic(pick[i], pick[i].name)}</button>`
    : `<div class="hpic" aria-hidden="true" style="background:${ph[i]}"></div>`).join('');
  const shown = new Set(top.slice(0, 10).map(p => p.id));
  const fresh = fit(S.products).filter(p => !shown.has(p.id)).sort((a, b) => String(b.created).localeCompare(String(a.created))).slice(0, 10);
  const head = (title, link, label, extra = '') => `<div class="shead"><h2>${title}</h2><div class="sacts">${extra}${link ? `<a href="${link}">${label}</a>` : ''}</div></div>`;
  const sizeChip = hasSizes() ? `<button class="chip" data-act="onlymine" data-v="${S.onlyMine ? 0 : 1}" aria-pressed="${S.onlyMine}" title="Solo prendas en tu talla (${esc(mySizesLabel())})">Mi talla · ${esc(mySizesLabel())}</button>` : `<button class="chip" data-act="gustos">Añade tu talla</button>`;
  view.innerHTML = `<div class="wrap home">
    <section class="hbox">
      <div class="htext">
        <h1>${T('home.title', 'La moda que encaja *contigo*.')}</h1>
        <p class="lead">${T('home.lead', 'Haz el test de estilo en un minuto y verás en cada prenda cuánto encaja contigo.')}</p>
        <div class="ctas">
          <button class="btn" data-act="gustos">${hasTaste() ? 'Ajustar mis gustos' : T('home.cta1', 'Haz el test de estilo')}</button>
          <a class="btn ghost" href="#/descubrir">${T('home.cta2', 'Descubrir prendas')}</a>
        </div>
      </div>
      <div class="hpics">${heroPics}</div>
    </section>

    <div class="mcats chips" role="group" aria-label="Categorías">${C.categories.map(c => `<a class="chip" href="#/explorar" data-act="gocat" data-v="${esc(c)}">${esc(c)}</a>`).join('')}</div>

    <section class="hsec">
      ${head(hasTaste() ? 'Para ti' : T('feat.title', 'Lo más destacado'), '#/explorar', 'Ver todo', sizeChip)}
      ${top.length ? `<div class="grid">${top.slice(0, 10).map(cardHTML).join('')}</div>`
        : `<div class="empty">${S.products.length ? 'No hay prendas en tu talla todavía.<br><button class="btn small" data-act="onlymine" data-v="0">Ver todas las tallas</button>' : 'Aún no hay prendas publicadas.<br><a class="btn small" href="#/vender">¿Tienes una marca? Publica la primera</a>'}</div>`}
    </section>

    <section class="hsec">
      ${head(T('styles.title', 'Compra por estilo'), '#/explorar', 'Ver todo')}
      <div class="stylerow">${C.styles.map((s, i) => { const n = styleCount(s); const img = styleImg(s); return `<button class="stylecard${img ? ' hasimg' : ''}" data-act="style" data-v="${esc(s)}" style="background:${STYLE_COLORS[i % STYLE_COLORS.length]}">${img ? `<img class="sc-img" src="${esc(img)}" alt="" loading="lazy">` : ''}<span class="sc-txt"><b>${esc(s)}</b><small>${n ? n + (n === 1 ? ' prenda' : ' prendas') : 'Muy pronto'}</small></span></button>`; }).join('')}</div>
    </section>

    ${brands.length ? `<section class="hsec">
      ${head(T('brands.title', 'Marcas que te pueden gustar'), '#/marcas', 'Todas las marcas')}
      <div class="bmini">${brands.slice(0, 6).map(b => `<a href="#/marca/${esc(b.id)}">${avatar(b)}<b>${esc(b.name)}</b><small>${b.items.length} ${b.items.length === 1 ? 'prenda' : 'prendas'}</small></a>`).join('')}</div>
    </section>` : ''}

    ${fresh.length ? `<section class="hsec">
      ${head(T('new.title', 'Recién llegado'), '#/explorar', 'Explorar todo')}
      <div class="grid">${fresh.map(cardHTML).join('')}</div>
    </section>` : ''}

    <section class="hsec">
      <div class="hband">
        <div><b>${T('band.title', '¿Tienes una marca? Publica en ' + C.appName + '.')}</b><span>${T('band.text', 'Los compradores con tu estilo te encuentran. La venta se hace en tu propia tienda.')}</span></div>
        <div class="ctas"><button class="btn light" data-act="brandsignup">${T('band.cta1', 'Crear cuenta de marca')}</button><a class="btn ghost light2" href="#/vender">${T('band.cta2', 'Saber más')}</a></div>
      </div>
    </section>
  </div>`;
};

/* --- Directorio de marcas --- */
VIEWS.marcas = () => {
  const brands = brandList();
  view.innerHTML = `<div class="wrap page has-tabbar">
    <div class="pagehead"><div><span class="eyebrow">${T('dir.eyebrow', 'Directorio')}</span><h1 style="margin-top:12px">${T('dir.title', 'Marcas')}</h1><p class="muted">${T('dir.text', 'Todas las marcas independientes que ya están en ' + C.appName + '.')}</p></div>
      ${isBrand() ? '' : '<a class="btn small" href="#/vender">Únete como marca</a>'}</div>
    <div class="brandgrid">${brands.length ? brands.map(brandCardHTML).join('') : '<div class="empty">Aún no hay marcas con prendas publicadas.<br><a class="btn" href="#/vender">Sé la primera</a></div>'}</div></div>`;
};

/* --- Vende en FOUND --- */
VIEWS.vender = () => {
  view.innerHTML = `<div class="wrap">
    <section class="hero" style="grid-template-columns:1fr">
      <div style="max-width:880px">
        <span class="eyebrow">${T('sell.eyebrow', 'Para marcas independientes')}</span>
        <h1>${T('sell.title', 'Tus prendas, delante de quien *ya* las busca.')}</h1>
        <p class="lead">${T('sell.lead', 'En ' + C.appName + ' los compradores nos dicen su estilo antes de empezar. Tú etiquetas tus prendas y nosotros las enseñamos a las personas con las que encajan.')}</p>
        <div class="ctas"><button class="btn" data-act="brandsignup">${isBrand() ? 'Ir a mi panel' : 'Crear cuenta de marca'} <span class="arr">→</span></button><a class="btn ghost" href="#/marcas">Ver marcas</a></div>
      </div>
    </section></div>
    <section class="section tint"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">${T('sell.how', 'Cómo funciona')}</span><h2>${T('sell.howtitle', 'Empezar te lleva *diez minutos*.')}</h2></div></div>
      <div class="steps">
        <div class="step"><h3>${T('sell.s1', 'Crea tu cuenta')}</h3><p>${billingOn() ? T('sell.s1tp', 'Regístrate como marca, confirma tu correo y activa la suscripción mensual con tarjeta.') : T('sell.s1t', 'Regístrate como marca, confirma tu correo y completa tu perfil: nombre, logo, portada y correo de contacto.')}</p></div>
        <div class="step"><h3>${T('sell.s2', 'Sube tus prendas')}</h3><p>${T('sell.s2t', 'Foto, precio, categoría, etiquetas de estilo y el enlace a tu tienda online. Puedes editarlas cuando quieras.')}</p></div>
        <div class="step"><h3>${T('sell.s3', 'Recibe compradores')}</h3><p>${T('sell.s3t', 'Tus prendas aparecen a quien encajan. Desde tu panel ves cuántas veces se guarda cada una.')}</p></div>
      </div></div></section>
    ${billingOn() ? `<section class="section"><div class="wrap">
      <div class="pricing">
        <div><span class="eyebrow">${T('price.eyebrow', 'Precio')}</span><h2>${T('price.title', 'Un solo plan. *Sin sorpresas.*')}</h2>
          <p class="muted">${T('price.text', 'Una suscripción mensual para tu marca. Sin comisiones por venta: lo que vendes en tu tienda es tuyo.')}</p></div>
        <div class="plan">
          <span class="plan-name">${T('plan.name', 'Plan Marca')}</span>
          <div class="pw-price">${subPrice() ? `<b>${money(subPrice())}</b><span>al mes · IVA incluido</span>` : '<b>Mensual</b><span>Precio próximamente</span>'}</div>
          <ul class="pw-list">${PLAN_FEATURES().map(f => `<li>${f}</li>`).join('')}</ul>
          <button class="btn block" data-act="brandsignup">${isBrand() ? 'Ir a mi panel' : T('plan.cta', 'Crear cuenta y suscribirme')} <span class="arr">→</span></button>
          <small class="muted">${T('plan.small', 'Pago seguro con Stripe. Cancela cuando quieras desde tu panel.')}</small>
        </div>
      </div></div></section>` : ''}
    <section class="section${billingOn() ? ' tint' : ''}"><div class="wrap">
      <div class="sec-head"><div><span class="eyebrow">${T('faq.eyebrow', 'Preguntas frecuentes')}</span><h2>${T('faq.title', 'Lo que suelen *preguntarnos*.')}</h2></div></div>
      <div class="faq">
        ${billingOn() ? `<details><summary>${T('faq.q0', '¿Cuánto cuesta?')}</summary><p>${subPrice() ? T('faq.a0p', 'La suscripción de marca cuesta ' + money(subPrice()) + ' al mes, IVA incluido. Se cobra con tarjeta a través de Stripe y puedes cancelarla cuando quieras: seguirá activa hasta el final del mes pagado.') : T('faq.a0', 'Es una suscripción mensual que se paga con tarjeta a través de Stripe. Puedes cancelarla cuando quieras: seguirá activa hasta el final del mes pagado.')}</p></details>` : ''}
        <details><summary>${T('faq.q1', '¿Se vende dentro de ' + C.appName + '?')}</summary><p>${T('faq.a1', 'No. Cada prenda enlaza a tu tienda online, y la compra se hace allí. Si no tienes tienda, el comprador puede escribirte al correo de contacto de tu perfil.')}</p></details>
        <details><summary>${T('faq.q2', '¿Qué necesito para empezar?')}</summary><p>${T('faq.a2', 'Una cuenta de marca, buenas fotos de tus prendas, el precio y, si la tienes, la dirección de tu tienda online.')}</p></details>
        <details><summary>${T('faq.q3', '¿Cómo deciden a quién se enseñan mis prendas?')}</summary><p>${T('faq.a3', 'Comparamos las etiquetas de estilo y la categoría de cada prenda con los gustos y el presupuesto de cada comprador. Cuanto mejor etiquetes, mejor encajan.')}</p></details>
        <details><summary>${T('faq.q4', '¿Puedo cambiar o retirar mis prendas?')}</summary><p>${T('faq.a4', 'Sí, en cualquier momento desde tu panel: editar, cambiar la foto o eliminar.')}</p></details>
        ${billingOn() ? `<details><summary>${T('faq.q6', '¿Qué pasa si cancelo?')}</summary><p>${T('faq.a6', 'Tu suscripción sigue activa hasta el final del mes ya pagado. Después tus prendas dejan de mostrarse, pero se quedan guardadas: si vuelves a suscribirte, reaparecen.')}</p></details>` : ''}
        <details><summary>${T('faq.q5', '¿Qué datos veo de mis prendas?')}</summary><p>${T('faq.a5', 'Cuántas veces abren cada prenda, cuántas personas pasan a tu tienda desde ' + C.appName + ' y cuántas la guardan, por semana, por mes o desde siempre.')}</p></details>
      </div></div></section>`;
};

/* --- Orden del feed de Descubrir ---
   Lo que más encaja sigue arriba, pero:
   · se mezclan las prendas que encajan parecido (el orden cambia en cada visita y se mantiene durante ella),
   · sube lo que la persona aún no ha visto y baja lo que ya pasó varias veces sin guardarlo,
   · cada pocas prendas aparece una «fuera de tu estilo» para descubrir cosas nuevas,
   · se evita que salgan seguidas dos prendas de la misma marca. */
const FEED = {
  jitter: 22,        // cuánto se mezclan las prendas con puntuación parecida (0 = nada)
  unseenBoost: 12,   // empujón a lo que nunca ha visto
  seenPenalty: 7,    // castigo por cada vez que ya la vio sin guardarla (máx. 35)
  newBoost: 10,      // empujón a lo publicado en los últimos 7 días
  surpriseEvery: 6   // cada cuántas prendas va una «fuera de tu estilo»
};
const SEEN_KEY = 'found_seen';
const SEEN0 = (() => { const m = lsGet(SEEN_KEY, {}), lim = Date.now() - 21 * 864e5; Object.keys(m).forEach(k => { if (!m[k] || m[k].t < lim) delete m[k]; }); return m; })();
const FEED_SEED = (() => { try { let v = sessionStorage.getItem('found_seed'); if (!v) { v = String(Math.floor(Math.random() * 1e9)); sessionStorage.setItem('found_seed', v); } return v; } catch { return String(Math.floor(Math.random() * 1e9)); } })();
const rand01 = key => { let h = 2166136261; const str = FEED_SEED + ':' + key; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } h += h << 13; h ^= h >>> 7; h += h << 3; h ^= h >>> 17; h += h << 5; return ((h >>> 0) % 100000) / 100000; };
function markSeen(id) {
  if (!id) return;
  const m = lsGet(SEEN_KEY, {}); const e = m[id] || { n: 0, t: 0 };
  if (Date.now() - e.t < 30 * 60e3) return; // una vez cada 30 min como mucho
  m[id] = { n: e.n + 1, t: Date.now() };
  const keys = Object.keys(m); if (keys.length > 600) keys.sort((a, b) => m[a].t - m[b].t).slice(0, keys.length - 600).forEach(k => delete m[k]);
  lsSet(SEEN_KEY, m);
}
function feedOrder(list) {
  const taste = hasTaste(), now = Date.now();
  const score = p => {
    const m = taste ? matchPct(p) : 50;
    const seen = SEEN0[p.id], n = seen ? seen.n : 0;
    let sc = m + (p.featured ? 12 : 0);
    if (!n) sc += FEED.unseenBoost; else if (!S.favs.has(p.id)) sc -= Math.min(35, FEED.seenPenalty * n);
    if (S.favs.has(p.id)) sc -= 10; // ya la tiene guardada: que deje sitio a otras
    const age = (now - new Date(p.created || 0).getTime()) / 864e5;
    if (age >= 0 && age < 7) sc += FEED.newBoost * (1 - age / 7);
    return sc + rand01(p.id) * FEED.jitter;
  };
  const scored = list.map(p => ({ p, sc: score(p), off: taste && matchPct(p) < 45 }));
  let main = scored.filter(x => !x.off).sort((a, b) => b.sc - a.sc);
  const surprises = scored.filter(x => x.off).sort((a, b) => rand01('s' + a.p.id) - rand01('s' + b.p.id));
  if (!taste || !main.length) main = scored.sort((a, b) => b.sc - a.sc);
  // intercalar una «fuera de tu estilo» cada pocas prendas; el resto, al final
  const out = [];
  main.forEach((x, i) => { out.push(x); if ((i + 1) % (FEED.surpriseEvery - 1) === 0 && surprises.length && taste) out.push({ ...surprises.shift(), surprise: true }); });
  surprises.forEach(x => out.push(x));
  // evitar dos seguidas de la misma marca (si se puede)
  for (let i = 1; i < out.length; i++) {
    if (out[i].p.brand_id !== out[i - 1].p.brand_id) continue;
    const j = out.findIndex((x, k) => k > i && x.p.brand_id !== out[i - 1].p.brand_id);
    if (j > -1) { const [x] = out.splice(j, 1); out.splice(i, 0, x); }
  }
  return out.map(x => (x.surprise ? Object.assign(Object.create(x.p), x.p, { _surprise: true }) : x.p));
}

/* --- Descubrir (estilo reel) --- */
VIEWS.descubrir = () => {
  document.body.classList.add('noscroll');
  const list = feedOrder(applyFilters(S.products));
  const N = list.length;
  const slides = list.map((p, i) => {
    const m = matchPct(p), fav = S.favs.has(p.id);
    const buy = isUrl(p.buy_url) ? `<a href="${esc(p.buy_url)}" target="_blank" rel="noopener noreferrer" data-track="buy" data-id="${esc(p.id)}" aria-label="Comprar ${esc(p.name)}">${ICON.bag}</a>` : `<button data-act="open" data-id="${esc(p.id)}" aria-label="Cómo comprar ${esc(p.name)}">${ICON.bag}</button>`;
    return `<section class="slide" data-id="${esc(p.id)}" style="background:${tileBg(p)}" aria-label="${esc(p.name)}">
      ${p.image ? `<img class="pic" src="${esc(p.image)}" alt="${esc(p.name)}">` : art(p, true)}
      ${i === 0 ? '<div class="hint">Desliza hacia arriba · doble toque para guardar</div>' : ''}
      ${p.images.length > 1 ? `<button class="morepics" data-act="open" data-id="${esc(p.id)}">Ver ${p.images.length} fotos</button>` : ''}
      ${p._surprise ? '<span class="surprise">Algo distinto a tu estilo</span>' : ''}
      <div class="info">
        <a href="#/marca/${esc(p.brand_id)}" class="dbrand">${miniLogo(p.logo)}${esc(p.brand)}</a>
        <div class="n">${esc(p.name)}</div>
        <div class="p">${money(p.price)}</div>
        <div class="chips">${m !== null ? `<span class="tag" style="background:var(--tagc);color:var(--tag-ink,#141414);font-weight:800">${m} % para ti</span>` : ''}${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        ${p.sizes.length ? `<div class="szline"><span class="szlbl">${fitsMe(p) ? 'Hay tu talla' : 'Tallas'}</span>${sizeChips(p)}</div>` : ''}
      </div>
      <div class="rail">
        <div><button data-act="fav" data-id="${esc(p.id)}" aria-pressed="${fav}" aria-label="${fav ? 'Quitar de guardados' : 'Guardar'}: ${esc(p.name)}">${ICON.heart}</button><small>Guardar</small></div>
        <div><button data-act="open" data-id="${esc(p.id)}" aria-label="Ver detalles de ${esc(p.name)}">${ICON.info}</button><small>Detalles</small></div>
        <div><button data-act="share" data-v="p" data-id="${esc(p.id)}" aria-label="Compartir ${esc(p.name)}">${ICON.share}</button><small>Compartir</small></div>
        <div>${buy}<small>Comprar</small></div>
      </div></section>`;
  }).join('');
  const empty = `<section class="slide" style="background:var(--soft)"><div class="empty" style="margin:20px;background:var(--surface);grid-column:auto">${S.products.length ? 'No hay prendas con este filtro.' + (hasSizes() && S.onlyMine ? '<br><button class="btn small" data-act="onlymine" data-v="0">Ver también otras tallas</button>' : '') : 'Aún no hay productos. Si eres una marca, sube el primero desde tu panel.'}</div></section>`;
  view.innerHTML = `<div class="reelwrap">
    <div class="reel" id="reel" tabindex="0" aria-label="Prendas para ti. Usa las flechas arriba y abajo para cambiar de prenda">${N ? slides : empty}</div>
    <div class="reeltop" role="group" aria-label="Filtros">
      <button class="chip" data-act="gustos">${hasTaste() ? 'Mis gustos' : 'Personalizar'}</button>
      ${hasSizes() ? `<button class="chip" data-act="onlymine" data-v="${S.onlyMine ? 0 : 1}" aria-pressed="${S.onlyMine}" title="Solo prendas en tu talla (${esc(mySizesLabel())})">Mi talla</button>` : ''}
      ${['Todo', ...C.categories].map(c => `<button class="chip" data-act="cat" data-v="${esc(c)}" aria-pressed="${S.cat === c}">${esc(c)}</button>`).join('')}
    </div>
    ${N ? `<div class="count" id="cnt" aria-hidden="true">1 / ${N}</div>` : ''}
  </div>
  <div class="navbtns"><button data-act="rnav" data-v="-1" aria-label="Prenda anterior">${ICON.up}</button><button data-act="rnav" data-v="1" aria-label="Prenda siguiente">${ICON.down}</button></div>`;
  const r = $('#reel');
  if (r && N) {
    // se apunta como «vista» la prenda en la que la persona se para al menos un segundo
    let seenT = 0;
    const settle = () => { clearTimeout(seenT); seenT = setTimeout(() => { const i = Math.round(r.scrollTop / r.clientHeight); if (list[i] && S.route === 'descubrir') markSeen(list[i].id); }, 1000); };
    r.addEventListener('scroll', () => { const c = $('#cnt'); if (c) c.textContent = (Math.round(r.scrollTop / r.clientHeight) + 1) + ' / ' + N; settle(); }, { passive: true });
    settle();
  }
};

/* --- Explorar (cuadrícula) --- */
VIEWS.explorar = () => {
  view.innerHTML = `<div class="wrap page has-tabbar">
    <div class="pagehead"><div><span class="eyebrow">${T('exp.eyebrow', 'Catálogo')}</span><h1 style="margin-top:12px">${T('exp.title', 'Explorar')}</h1><p class="muted">${hasTaste() ? 'Ordenado según tus gustos: lo que más encaja contigo aparece primero.' : 'Haz el test de estilo para ver qué encaja contigo.'}</p></div>
      ${hasTaste() ? '<button class="btn ghost small" data-act="gustos">Ajustar gustos</button>' : '<button class="btn small" data-act="gustos">Hacer el test</button>'}</div>
    <div class="toolbar">
      <input type="search" id="q" placeholder="Busca por prenda, marca o estilo" aria-label="Buscar" value="${esc(S.q)}">
      <select id="sort" aria-label="Ordenar por">
        <option value="match"${S.sort === 'match' ? ' selected' : ''}>${hasTaste() ? 'Mejor para ti' : 'Destacados'}</option>
        <option value="new"${S.sort === 'new' ? ' selected' : ''}>Novedades</option>
        <option value="price-asc"${S.sort === 'price-asc' ? ' selected' : ''}>Precio: de menor a mayor</option>
        <option value="price-desc"${S.sort === 'price-desc' ? ' selected' : ''}>Precio: de mayor a menor</option>
      </select>
    </div>
    <div class="filters">
      <div class="frow"><span>Prenda</span><div class="chips" role="group" aria-label="Categorías">${['Todo', ...C.categories].map(c => `<button class="chip" data-act="cat" data-v="${esc(c)}" aria-pressed="${S.cat === c}">${esc(c)}</button>`).join('')}</div></div>
      <div class="frow"><span>Estilo</span><div class="chips" role="group" aria-label="Estilos">${['Todos', ...C.styles].map(c => `<button class="chip" data-act="fstyle" data-v="${esc(c)}" aria-pressed="${S.style === c}">${esc(c)}</button>`).join('')}</div></div>
      <div class="frow"><span>Talla</span><div class="chips" role="group" aria-label="Talla">${hasSizes()
        ? `<button class="chip" data-act="onlymine" data-v="1" aria-pressed="${S.onlyMine}">Solo mi talla · ${esc(mySizesLabel())}</button><button class="chip" data-act="onlymine" data-v="0" aria-pressed="${!S.onlyMine}">Todas las tallas</button><button class="chip ghostchip" data-act="gustos">Cambiar mi talla</button>`
        : '<button class="chip ghostchip" data-act="gustos">Añade tu talla para ver solo lo que te vale →</button>'}</div></div>
    </div>
    <p class="muted rescount" id="rescount"></p>
    <div id="gridwrap"></div></div>`;
  fillGrid();
};
function fillGrid() {
  const w = $('#gridwrap'); if (!w) return;
  const list = ranked(applyFilters(S.products));
  const rc = $('#rescount'); if (rc) rc.textContent = list.length + (list.length === 1 ? ' prenda' : ' prendas');
  w.innerHTML = `<div class="grid">${list.length ? list.map(cardHTML).join('') : `<div class="empty">No hay resultados. Prueba otra categoría o busca otra cosa.${hasSizes() && S.onlyMine ? '<br><button class="btn small" data-act="onlymine" data-v="0">Ver también otras tallas</button>' : ''}</div>`}</div>`;
}

/* --- Guardados --- */
VIEWS.guardados = () => {
  const list = ranked(S.products.filter(p => S.favs.has(p.id)));
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="pagehead"><div><span class="eyebrow">${T('fav.eyebrow', 'Tu selección')}</span><h1 style="margin-top:12px">${T('fav.title', 'Guardados')}</h1><p class="muted">${list.length ? list.length + (list.length === 1 ? ' prenda guardada.' : ' prendas guardadas.') : 'Las prendas que guardes aparecerán aquí.'}</p></div></div>
    ${!S.user && list.length ? `<div class="card-box" style="margin-bottom:20px"><b>Crea una cuenta para no perder tus guardados.</b> <a href="#/entrar">Entrar o registrarme</a></div>` : ''}
    <div class="grid">${list.length ? list.map(cardHTML).join('') : `<div class="empty">Aún no has guardado nada.<br>Toca el corazón en las prendas que te gusten.<br><a class="btn" href="#/descubrir">Ir a descubrir</a></div>`}</div></div>`;
};

/* --- Perfil público de marca --- */
VIEWS.marca = id => {
  const list = ranked(S.products.filter(p => p.brand_id === id));
  const b = list[0];
  const own = S.user && S.user.id === id && S.profile;
  const bo = b ? { name: b.brand, color: b.color, logo: b.logo, cover: b.cover, bio: b.bio, contact: b.contact }
    : own ? { name: S.profile.brand_name || 'Tu marca', color: '#1C2240', logo: S.profile.logo_url, cover: S.profile.cover_url, bio: S.profile.brand_bio, contact: S.profile.contact_email }
    : { name: 'Marca', color: '#141414' };
  const minP = list.length ? Math.min(...list.map(p => p.price)) : 0;
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="brandhero${bo.cover ? ' hascover' : ''}" style="background:${bo.cover ? 'var(--deep)' : b ? softBg(b.color) : 'var(--soft)'}">
    ${bo.cover ? `<img class="bh-cover" src="${esc(bo.cover)}" alt="">` : ''}${avatar(bo, true)}
    <div><h1>${esc(bo.name)}</h1>${bo.bio ? `<p>${esc(bo.bio)}</p>` : ''}
      ${list.length ? `<div class="kpis"><div><b>${list.length}</b>${list.length === 1 ? 'prenda' : 'prendas'}</div><div><b>${money(minP)}</b>desde</div></div>` : ''}</div>
    <div class="bh-acts">${bo.contact ? `<a class="btn ghost small" href="mailto:${esc(bo.contact)}">Contactar</a>` : ''}<button class="btn ghost small" data-act="share" data-v="m" data-id="${esc(id)}">${ICON.share} Compartir</button></div></div>
    <div class="grid">${list.length ? list.map(cardHTML).join('') : '<div class="empty">Esta marca aún no tiene productos.</div>'}</div></div>`;
};

/* --- Gustos (cuestionario) --- */
VIEWS.gustos = () => {
  const d = S.draft || (S.draft = { styles: [...(S.taste?.styles || [])], cats: [...(S.taste?.cats || [])], budget: S.taste?.budget || 120, sizes: [...mySizes()] });
  const szRow = (label, list) => `<div class="szrow"><span>${label}</span><div class="chips">${list.map(s => `<button class="chip" data-act="qz" data-v="${esc(s)}" aria-pressed="${d.sizes.includes(s)}">${esc(s)}</button>`).join('')}</div></div>`;
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="quiz">
    <div class="qhead"><span class="eyebrow">${T('quiz.eyebrow', 'Test de estilo')}</span><h1 style="margin-top:14px">${T('quiz.title', 'Cuéntanos qué te *gusta*.')}</h1><p class="muted">${T('quiz.text', 'Con esto ordenamos las prendas para que veas primero lo que encaja contigo. Puedes cambiarlo cuando quieras.')}</p></div>
    <div class="qblock"><h2><small>01</small>Estilos</h2><p>Elige todos los que vayan contigo.</p>${C.styles.some(styleImg)
      ? `<div class="qstyles">${C.styles.map((s, i) => `<button class="qstyle" data-act="qs" data-v="${esc(s)}" aria-pressed="${d.styles.includes(s)}"><span class="qs-pic" style="background:${STYLE_COLORS[i % STYLE_COLORS.length]}">${styleImg(s) ? `<img src="${esc(styleImg(s))}" alt="" loading="lazy">` : ''}<span class="qs-ok" aria-hidden="true">✓</span></span><span class="qs-name">${esc(s)}</span></button>`).join('')}</div>`
      : `<div class="chips">${C.styles.map(s => `<button class="chip" data-act="qs" data-v="${esc(s)}" aria-pressed="${d.styles.includes(s)}">${esc(s)}</button>`).join('')}</div>`}</div>
    <div class="qblock"><h2><small>02</small>Prendas que buscas</h2><p>Opcional. Si no eliges ninguna, te enseñamos de todo.</p><div class="chips">${C.categories.map(s => `<button class="chip" data-act="qc" data-v="${esc(s)}" aria-pressed="${d.cats.includes(s)}">${esc(s)}</button>`).join('')}</div></div>
    <div class="qblock"><h2><small>03</small>Presupuesto máximo</h2><p>Por prenda.</p>
      <label class="range"><span class="sr">Presupuesto máximo</span><input type="range" id="bud" min="20" max="400" step="5" value="${d.budget}"><output id="budv">${d.budget} ${esc(C.currency)}</output></label></div>
    <div class="qblock"><h2><small>04</small>Tu talla</h2><p>Opcional. Si estás entre dos, marca las dos. Así no te enseñamos prendas que no quedan en tu talla.</p>
      ${szRow('Ropa', SIZES_ROPA)}${szRow('Calzado (EU)', SIZES_PIE)}</div>
    <p class="msg err" id="qerr" role="alert"></p>
    <div class="qacts"><button class="btn" data-act="apply">Guardar mis gustos <span class="arr">→</span></button><a class="btn ghost" href="#/descubrir">Cancelar</a></div>
  </div></div>`;
};

/* --- Entrar / registrarse --- */
VIEWS.entrar = () => {
  if (S.user) return go('cuenta');
  const up = S.authMode === 'up', brand = S.authRole === 'brand';
  const sample = ranked(S.products).slice(0, 4);
  const side = brand && up
    ? [T('auth.btitle', 'Tu marca, delante de quien la busca.'), [T('auth.b1', 'Publica prendas desde tu panel'), T('auth.b2', 'Los compradores te encuentran por estilo'), T('auth.b3', 'Mide cuántas veces guardan cada prenda')]]
    : [T('auth.title', 'La moda que *encaja* contigo.'), [T('auth.l1', 'Test de estilo en un minuto'), T('auth.l2', 'Prendas ordenadas según tus gustos'), T('auth.l3', 'Tus guardados en todos tus dispositivos')]];
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="authgrid">
    <aside class="auth-side"><div class="glow"></div><div><span class="eyebrow" style="color:inherit;opacity:.7">${esc(C.appName)}</span><h2 style="margin-top:16px">${side[0]}</h2>
      <ul>${side[1].map(x => `<li>${x}</li>`).join('')}</ul></div>
      ${sample.length ? `<div class="mini">${sample.map(p => `<div style="background:${tileBg(p)}">${pic(p)}</div>`).join('')}</div>` : ''}</aside>
    <div class="auth-main"><div class="auth" style="width:100%">
    <h1 style="margin-bottom:22px;font-size:clamp(36px,4vw,52px)">${up ? 'Crea tu cuenta' : 'Entra en ' + esc(C.appName)}</h1>
    <div class="seg" role="group" aria-label="Acción"><button data-act="authmode" data-v="in" aria-pressed="${!up}">Entrar</button><button data-act="authmode" data-v="up" aria-pressed="${up}">Crear cuenta</button></div>
    <form id="authForm" class="card-box" novalidate>
      ${up ? `<div class="seg" role="group" aria-label="Tipo de cuenta"><button type="button" data-act="authrole" data-v="buyer" aria-pressed="${!brand}">Soy comprador</button><button type="button" data-act="authrole" data-v="brand" aria-pressed="${brand}">Soy una marca</button></div>` : ''}
      ${up && brand ? '<label class="field"><span>Nombre de tu marca</span><input type="text" id="a-brand" maxlength="60" autocomplete="organization"></label>' : ''}
      <label class="field"><span>Correo</span><input type="email" id="a-email" autocomplete="email" required></label>
      <label class="field"><span>Contraseña${up ? ' (mínimo 6 caracteres)' : ''}</span><input type="password" id="a-pw" autocomplete="${up ? 'new-password' : 'current-password'}" required></label>
      <p class="msg" id="amsg" role="alert"></p>
      <button class="btn block" type="submit" id="asend">${up ? 'Crear cuenta' : 'Entrar'}</button>
    </form>
    ${api.live ? '' : '<p class="muted" style="margin-top:14px;font-size:14px">Modo demo: la cuenta se guarda solo en este navegador y la contraseña no se comprueba.</p>'}
  </div></div></div></div>`;
  $('#authForm').addEventListener('submit', onAuthSubmit);
};
async function onAuthSubmit(e) {
  e.preventDefault();
  const m = $('#amsg'), btn = $('#asend'); m.className = 'msg';
  const email = $('#a-email').value.trim(), pw = $('#a-pw').value, up = S.authMode === 'up', brand = S.authRole === 'brand';
  const brandName = up && brand ? $('#a-brand').value.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { m.classList.add('err'); m.textContent = 'Escribe un correo válido, por ejemplo tu@correo.com.'; return; }
  if (pw.length < 6 && (up || api.live)) { m.classList.add('err'); m.textContent = 'La contraseña debe tener al menos 6 caracteres.'; return; }
  if (up && brand && !brandName) { m.classList.add('err'); m.textContent = 'Escribe el nombre de tu marca.'; return; }
  btn.disabled = true; btn.textContent = 'Un momento…';
  try {
    if (up) {
      const r = await api.signUp({ email, password: pw, role: brand ? 'brand' : 'buyer', brandName });
      logSite('signup', brand ? 'marca' : 'comprador');
      if (r.needsConfirm) {
        if (brand && billingOn()) {
          const url = payUrl(r.userId, email);
          $('#authForm').outerHTML = `<div class="signup-ok"><b>Cuenta creada</b>
            <ol class="ksteps"><li><b>Confirma tu correo.</b> Te hemos enviado un enlace a ${esc(email)}.</li>
            <li><b>Activa tu suscripción mensual${subPrice() ? ' de ' + money(subPrice()) : ''}.</b> Hasta entonces tus prendas no se publican.</li></ol>
            ${url ? `<a class="btn block" href="${esc(url)}">Activar suscripción <span class="arr">→</span></a><p class="muted" style="font-size:13px;margin-top:10px">Pago seguro con Stripe. También puedes pagar más tarde desde tu panel.</p>` : '<p class="muted">Cuando confirmes el correo, entra y activa la suscripción desde tu panel.</p>'}</div>`;
          return;
        }
        m.classList.add('ok'); m.textContent = 'Cuenta creada. Revisa tu correo para confirmarla y luego entra.'; btn.disabled = false; btn.textContent = 'Crear cuenta'; return;
      }
    } else await api.signIn({ email, password: pw });
    await afterAuth(); await refreshProducts();
    toast(up ? '¡Bienvenido a ' + C.appName + '!' : 'Has entrado');
    go(isBrand() ? 'panel' : (hasTaste() ? 'descubrir' : 'gustos'));
  } catch (err) {
    m.classList.add('err'); m.textContent = traduce(err.message);
    btn.disabled = false; btn.textContent = up ? 'Crear cuenta' : 'Entrar';
  }
}
function traduce(msg) {
  const t = String(msg || '');
  if (/invalid login/i.test(t)) return 'Correo o contraseña incorrectos.';
  if (/already registered|already been registered/i.test(t)) return 'Ya existe una cuenta con ese correo.';
  if (/email not confirmed/i.test(t)) return 'Aún no has confirmado tu correo. Revisa tu bandeja de entrada.';
  if (/rate limit/i.test(t)) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (/FOUND_EMAIL_BLOQUEADO|Database error saving new user/i.test(t)) return 'No se puede crear una cuenta con este correo. Si crees que es un error, escríbenos.';
  return t;
}

/* --- Cuenta --- */
VIEWS.cuenta = () => {
  if (!S.user) return go('entrar');
  const nm = isBrand() ? (S.profile.brand_name || 'Tu marca') : S.user.email.split('@')[0];
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="pagehead"><div><span class="eyebrow">Perfil</span><h1 style="margin-top:12px">Tu cuenta</h1></div></div>
    <div class="acct">
    <div class="card-box who">${avatar({ name: nm, color: 'var(--accent)' }, true)}<h2>${esc(nm)}</h2><span class="tag">${isAdmin() ? 'Creador' : isBrand() ? 'Marca' : 'Comprador'}</span>
      <button class="btn dark block" data-act="logout" style="margin-top:12px">Cerrar sesión</button></div>
    <div class="card-box"><dl>
      <div><dt>Correo</dt><dd>${esc(S.user.email)}</dd></div>
      <div><dt>Tipo de cuenta</dt><dd>${isAdmin() ? 'Creador (administrador)' : isBrand() ? 'Marca · ' + esc(S.profile.brand_name || '') : 'Comprador'}</dd></div>
      <div><dt>Tus gustos</dt><dd>${hasTaste() ? `<div class="chips">${S.taste.styles.map(s => `<span class="tag">${esc(s)}</span>`).join('')}${S.taste.cats.map(s => `<span class="tag">${esc(s)}</span>`).join('')}<span class="tag">hasta ${S.taste.budget} ${esc(C.currency)}</span></div>` : '<span class="muted">Aún no has hecho el test de estilo.</span>'}</dd></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn ghost small" href="#/gustos">${hasTaste() ? 'Editar mis gustos' : 'Hacer el test'}</a><a class="btn ghost small" href="#/guardados">Mis guardados</a>${isBrand() ? '<a class="btn small" href="#/panel">Ir a mi panel</a>' : ''}${isAdmin() ? '<a class="btn small" href="#/admin">Panel de creador</a>' : ''}</div>
    </dl></div></div>
    ${api.live ? '' : '<p class="muted" style="margin-top:14px;font-size:14px">Estás en modo demo: los datos viven solo en este navegador. Conecta Supabase (mira el README) para tener usuarios y productos reales.</p><p style="margin-top:10px"><button class="btn ghost small" data-act="resetdemo">Restablecer datos de demo</button> ' + (isAdmin() ? '' : '<button class="btn small" data-act="makeadmin">Activar modo creador (demo)</button>') + '</p>'}
  </div>`;
};

/* --- Panel de creador --- */
VIEWS.admin = async () => {
  if (!S.user) { toast('Entra con tu cuenta de creador.'); S.authMode = 'in'; return go('entrar'); }
  if (!isAdmin()) {
    view.innerHTML = `<div class="wrap page has-tabbar"><div class="empty">Esta zona es solo para el creador de ${esc(C.appName)}.${api.live ? '' : '<br>En modo demo puedes activarla desde tu <a href="#/cuenta">cuenta</a>.'}</div></div>`;
    return;
  }
  await refreshProducts();
  const nPend = S.allProducts.filter(p => p.status === 'pending').length;
  let nRep = 0; try { const rr = api.adminReports ? await api.adminReports() : null; nRep = rr && rr.list ? rr.list.length : 0; } catch {}
  const badge = n => n ? ` <span class="tabn">${n}</span>` : '';
  const tabs = [['resumen', 'Resumen'], ['revisar', 'Por revisar' + badge(nPend)], ['denuncias', 'Denuncias' + badge(nRep)], ['mensajes', 'Mensajes' + badge(S.unread)], ['salud', 'Salud del catálogo'], ['ranking', 'Ranking de marcas'], ['visitas', 'Visitas'], ['ajustes', 'Ajustes de la web'], ['productos', 'Productos'], ['usuarios', 'Usuarios']];
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="pagehead"><div><span class="eyebrow">Solo para ti</span><h1 style="margin-top:12px">Panel de creador</h1><p class="muted">Cambia ${esc(C.appName)} desde aquí, sin tocar código.</p></div></div>
    <div class="seg admtabs" role="group" aria-label="Secciones">${tabs.map(([k, l]) => `<button data-act="admintab" data-v="${k}" aria-pressed="${S.adminTab === k}">${l}</button>`).join('')}</div>
    <div id="adminbody"></div></div>`;
  await renderAdminTab();
};
/* ---------- pestaña Visitas ---------- */
const PAGE_NAMES = { inicio: 'Inicio', descubrir: 'Descubrir', explorar: 'Explorar', marcas: 'Directorio de marcas', marca: 'Página de una marca', prenda: 'Ficha de una prenda', vender: 'Vende en ' + C.appName, guardados: 'Guardados', gustos: 'Test de estilo', entrar: 'Entrar / crear cuenta', cuenta: 'Cuenta', panel: 'Panel de marca', pago: 'Pago', mensajes: 'Mensajes' };
const nfmt = n => Number(n || 0).toLocaleString('es-ES');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const shortDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' });
async function visitsTeaser() {
  if (!api.siteStats) return '';
  let r; try { r = await api.siteStats(7); } catch { return ''; }
  if (!r || r.missing) return `<section class="card-box editcta" style="max-width:760px;margin-bottom:18px"><div><h2 style="margin-bottom:6px">Activa las visitas</h2><p class="muted">Para ver cuánta gente entra y de dónde viene, ejecuta <b>supabase/analitica.sql</b> en Supabase &gt; SQL Editor.</p></div><button class="btn ghost" data-act="admintab" data-v="visitas">Ver cómo</button></section>`;
  return `<section class="card-box editcta" style="max-width:760px;margin-bottom:18px"><div><h2 style="margin-bottom:6px">${nfmt(r.visits)} ${r.visits === 1 ? 'visita' : 'visitas'} esta semana</h2><p class="muted">${nfmt(r.visitors)} ${r.visitors === 1 ? 'visitante' : 'visitantes'} · ${nfmt(r.signups)} ${r.signups === 1 ? 'registro nuevo' : 'registros nuevos'}${r.sources && r.sources[0] ? ' · la mayoría llega desde ' + esc(r.sources[0].k) : ''}</p></div><button class="btn" data-act="admintab" data-v="visitas">Ver visitas</button></section>`;
}
function hbars(list, label, total) {
  if (!list || !list.length) return '<p class="muted vempty">Aún no hay datos.</p>';
  const max = Math.max(...list.map(x => x.n));
  return `<ul class="hbars">${list.map(x => `<li><span class="hb-k">${esc(label ? label(x.k) : x.k)}</span><span class="hb-bar" aria-hidden="true"><i style="width:${Math.max(2, Math.round(x.n / max * 100))}%"></i></span><span class="hb-n">${nfmt(x.n)}${total ? `<small>${pct(x.n, total)} %</small>` : ''}</span></li>`).join('')}</ul>`;
}
function vchart(daily) {
  let pts = daily || [];
  if (pts.length > 92) { const w = []; for (let i = 0; i < pts.length; i += 7) { const g = pts.slice(i, i + 7); w.push({ d: g[0].d, n: g.reduce((a, x) => a + x.n, 0), week: true }); } pts = w; }
  const max = Math.max(1, ...pts.map(x => x.n));
  const nice = max <= 5 ? max : Math.ceil(max / 5) * 5;
  const lbl = x => (x.week ? 'Semana del ' : '') + shortDate(x.d) + ': ' + nfmt(x.n) + (x.n === 1 ? ' visita' : ' visitas');
  const ticks = pts.length > 1 ? [0, Math.floor((pts.length - 1) / 2), pts.length - 1] : [0];
  return `<div class="vchart" role="img" aria-label="Visitas por ${pts[0] && pts[0].week ? 'semana' : 'día'}">
    <div class="vc-y" aria-hidden="true"><span>${nfmt(nice)}</span><span>0</span></div>
    <div class="vc-plot">${pts.map(x => `<div class="vc-col" tabindex="0" aria-label="${esc(lbl(x))}"><i style="height:${x.n ? Math.max(2, x.n / nice * 100) : 0}%"></i><span class="vc-tip">${esc(lbl(x))}</span></div>`).join('')}</div>
    <div class="vc-x" aria-hidden="true">${ticks.map(i => `<span style="left:${pts.length > 1 ? i / (pts.length - 1) * 100 : 0}%">${shortDate(pts[i].d)}</span>`).join('')}</div>
  </div>`;
}
function siteStatsHTML(r) {
  const periods = [['7', '7 días'], ['30', '30 días'], ['90', '90 días'], ['all', 'Desde el inicio']];
  const seg = `<div class="statshead" style="max-width:980px"><span class="muted">Periodo</span><div class="seg mini" role="group" aria-label="Periodo">${periods.map(([v, l]) => `<button data-act="sitedays" data-v="${v}" aria-pressed="${String(S.siteDays || 'all') === v}">${l}</button>`).join('')}</div></div>`;
  if (!r || r.missing) return `<section class="card-box" style="max-width:760px"><h2 style="margin-bottom:10px">Activa las visitas</h2>
    <p class="muted" style="margin-bottom:14px">Falta un paso en la base de datos para empezar a contar visitas. Solo hay que hacerlo una vez:</p>
    <ol class="ksteps"><li>Abre Supabase &gt; <b>SQL Editor</b> &gt; <b>New query</b>.</li><li>Pega todo el archivo <b>supabase/analitica.sql</b> y pulsa <b>Run</b>.</li><li>Vuelve aquí y recarga la página. Las visitas empiezan a contar desde ese momento.</li></ol></section>`;
  const delta = r.prevVisits === null || r.prevVisits === undefined ? '' : r.prevVisits === 0 ? (r.visits ? '<small class="up">nuevo</small>' : '') : (() => { const d = Math.round((r.visits - r.prevVisits) / r.prevVisits * 100); return `<small class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${d} % que el periodo anterior</small>`; })();
  const devs = r.devices || [], dTot = devs.reduce((a, x) => a + x.n, 0), mob = (devs.find(x => x.k === 'movil') || {}).n || 0;
  if (!r.visits && !r.pages) return seg + `<div class="empty" style="max-width:980px">Aún no hay visitas en este periodo. Aparecerán aquí en cuanto alguien entre en la web.<br><small>Tus propias visitas como creador no cuentan.</small></div>`;
  const funnel = [['Entraron en la web', r.visitors], ['Hicieron el test de estilo', r.tests], ['Crearon una cuenta', r.signups], ['Fueron a la tienda de una marca', r.buyers]];
  return seg + `<div class="vgrid">
    <div class="stats vkpis">
      <div class="stat hl"><b>${nfmt(r.visits)}</b><span>visitas</span>${delta}</div>
      <div class="stat"><b>${nfmt(r.visitors)}</b><span>visitantes</span></div>
      <div class="stat"><b>${nfmt(r.pages)}</b><span>páginas vistas</span></div>
      <div class="stat"><b>${nfmt(r.signups)}</b><span>${r.signups === 1 ? 'cuenta nueva' : 'cuentas nuevas'}</span></div>
    </div>
    <section class="card-box vwide"><h3>Visitas por ${r.daily && r.daily.length > 92 ? 'semana' : 'día'}</h3>${vchart(r.daily)}</section>
    <section class="card-box"><h3>De dónde vienen</h3>${hbars(r.sources, null, r.visits)}</section>
    <section class="card-box"><h3>Qué miran</h3>${hbars(r.topPages, k => PAGE_NAMES[k] || k)}</section>
    <section class="card-box"><h3>Del visitante a la tienda</h3><ul class="hbars funnel">${funnel.map(([k, n], i) => `<li><span class="hb-k">${k}</span><span class="hb-bar" aria-hidden="true"><i style="width:${r.visitors ? Math.max(n ? 2 : 0, Math.round(n / r.visitors * 100)) : 0}%"></i></span><span class="hb-n">${nfmt(n)}${i ? `<small>${pct(n, r.visitors)} %</small>` : ''}</span></li>`).join('')}</ul>
      <p class="muted vnote">Se han compartido ${nfmt(r.shares)} ${r.shares === 1 ? 'vez' : 'veces'} prendas o marcas, y hubo ${nfmt(r.buys)} ${r.buys === 1 ? 'clic' : 'clics'} en «Comprar» o «Preguntar a la marca».</p></section>
    <section class="card-box vwide"><h3>Qué buscan</h3>${r.searches === undefined ? '<p class="muted vempty">Para ver las búsquedas, vuelve a ejecutar <b>supabase/analitica.sql</b> en Supabase.</p>' : !r.searchCount ? '<p class="muted vempty">Aún nadie ha usado el buscador de Explorar en este periodo.</p>' : `<div class="vsearch">
      <div><h4>Lo más buscado</h4>${hbars((r.searches || []).map(x => ({ k: x.k, n: x.n, zero: x.zero })), k => k)}</div>
      <div><h4>Buscado sin resultados</h4>${(r.zeroSearches || []).length ? hbars(r.zeroSearches, k => k) : '<p class="muted vempty">Todas las búsquedas encontraron algo.</p>'}
        ${(r.zeroSearches || []).length ? '<p class="muted vnote">Esto es lo que la gente quiere y aún no tienes: buenas pistas para buscar marcas nuevas.</p>' : ''}</div></div>`}</section>
    <section class="card-box"><h3>Desde qué dispositivo</h3>${dTot ? `<div class="vsplit" role="img" aria-label="${pct(mob, dTot)} % desde el móvil, ${100 - pct(mob, dTot)} % desde el ordenador"><i style="width:${pct(mob, dTot)}%"></i></div>
      <div class="vsplit-l"><span><b>${pct(mob, dTot)} %</b> móvil · ${nfmt(mob)}</span><span><b>${100 - pct(mob, dTot)} %</b> ordenador · ${nfmt(dTot - mob)}</span></div>` : '<p class="muted vempty">Aún no hay datos.</p>'}</section>
  </div>
  <p class="muted vnote" style="max-width:980px">Sin cookies ni datos personales: una misma persona cuenta como un visitante por día. Una visita empieza cuando alguien abre la web y termina al cerrar la pestaña. Tus visitas como creador no cuentan. Los datos se guardan 13 meses.</p>`;
}
/* ---------- Resumen: lo que hay que hacer hoy ---------- */
async function todayHTML() {
  await refreshProducts();
  const items = [];
  const pend = S.allProducts.filter(p => p.status === 'pending').length;
  if (pend) items.push(['revisar', `${pend} ${pend === 1 ? 'prenda espera' : 'prendas esperan'} tu revisión`, 'Revisar', true]);
  try { const r = await api.adminReports(); if (r.list && r.list.length) items.push(['denuncias', `${r.list.length} ${r.list.length === 1 ? 'denuncia pendiente' : 'denuncias pendientes'}`, 'Ver denuncias', true]); } catch {}
  let users = []; try { const r = await api.adminUsers(); users = r.list || []; } catch {}
  const h = catalogHealth(users), nb = h.brands.length;
  if (nb) items.push(['salud', `${nb} ${nb === 1 ? 'marca tiene' : 'marcas tienen'} cosas por mejorar en su catálogo`, 'Ver detalles']);
  const week = Date.now() - 7 * 864e5, newB = users.filter(u => u.role === 'brand' && u.created_at && new Date(u.created_at).getTime() > week).length;
  if (newB) items.push(['usuarios', `${newB} ${newB === 1 ? 'marca nueva' : 'marcas nuevas'} esta semana: dales la bienvenida`, 'Ver marcas', false, 'brand']);
  try { const st = await api.siteStats(7); if (st && st.zeroSearches && st.zeroSearches.length) items.push(['visitas', `${st.zeroSearches.length} ${st.zeroSearches.length === 1 ? 'búsqueda' : 'búsquedas'} sin resultados esta semana (p. ej. «${esc(st.zeroSearches[0].k)}»)`, 'Ver búsquedas']); } catch {}
  return `<section class="card-box todaybox" style="max-width:760px;margin-bottom:18px"><h2 style="margin-bottom:12px">Para hoy</h2>
    ${items.length ? `<ul class="todo">${items.map(([tab, txt, btn, hot, role]) => `<li${hot ? ' class="hot"' : ''}><span>${txt}</span><button class="btn ${hot ? '' : 'ghost '}small" data-act="gotab" data-v="${tab}"${role ? ` data-role="${role}"` : ''}>${btn}</button></li>`).join('')}</ul>`
      : '<p class="todo-ok">Todo al día. No hay nada pendiente.</p>'}</section>`;
}

/* ---------- Salud del catálogo ---------- */
const HEALTH_TYPES = {
  sinvender: ['No se puede comprar', 'No tiene enlace a la tienda ni correo de contacto: nadie puede comprarla.'],
  foto: ['Sin foto', 'Se ve con una ilustración en lugar de una foto real.'],
  tallas: ['Sin tallas', 'No aparece a quien filtra por su talla.'],
  enlace: ['Sin enlace a la tienda', 'Solo se puede preguntar por correo.'],
  desc: ['Descripción corta', 'Menos de 30 caracteres.'],
  logo: ['Marca sin logo', 'Su página y sus prendas se ven con una inicial.'],
  bio: ['Marca sin descripción', 'Su página no cuenta quiénes son.'],
  vacia: ['Marca sin prendas', 'Se registró pero aún no ha subido nada.']
};
function catalogHealth(users) {
  const brands = new Map(), counts = {};
  const reg = id => (users || []).find(u => u.id === id) || {};
  const get = (id, name, contact) => { if (!brands.has(id)) brands.set(id, { id, name: name || reg(id).brand_name || reg(id).email || 'Marca', email: contact || reg(id).email || '', issues: [] }); return brands.get(id); };
  const add = (b, type, what) => { b.issues.push({ type, what }); counts[type] = (counts[type] || 0) + 1; };
  const seen = new Set();
  S.allProducts.filter(p => p.status !== 'rejected').forEach(p => {
    const b = get(p.brand_id, p.brand, p.contact);
    if (!isUrl(p.buy_url) && !p.contact) add(b, 'sinvender', p.name);
    else if (!isUrl(p.buy_url)) add(b, 'enlace', p.name);
    if (!p.image) add(b, 'foto', p.name);
    if (!p.sizes.length) add(b, 'tallas', p.name);
    if (!p.desc || p.desc.trim().length < 30) add(b, 'desc', p.name);
    if (!seen.has(p.brand_id)) { seen.add(p.brand_id); if (!p.logo) add(b, 'logo', ''); if (!p.bio) add(b, 'bio', ''); }
  });
  (users || []).filter(u => u.role === 'brand' && !S.allProducts.some(p => p.brand_id === u.id)).forEach(u => add(get(u.id, u.brand_name, u.contact_email), 'vacia', ''));
  const order = Object.keys(HEALTH_TYPES);
  const list = [...brands.values()].filter(b => b.issues.length).sort((a, b) => b.issues.length - a.issues.length);
  list.forEach(b => b.issues.sort((x, y) => order.indexOf(x.type) - order.indexOf(y.type)));
  return { brands: list, counts };
}
function healthText(b) {
  const tips = { sinvender: 'no tiene enlace a tu tienda ni correo de contacto, así que nadie puede comprarla', foto: 'no tiene foto (las prendas con foto reciben muchos más clics)', tallas: 'no tiene tallas (no aparece a quien filtra por su talla)', enlace: 'no tiene enlace a tu tienda online', desc: 'tiene una descripción muy corta (materiales, corte y cuidados ayudan a vender)' };
  const lines = b.issues.map(i => i.type === 'logo' ? '- Tu página aún no tiene logo.' : i.type === 'bio' ? '- Tu página aún no tiene una descripción de la marca.' : i.type === 'vacia' ? '- Aún no has subido ninguna prenda: ¡te ayudamos si lo necesitas!' : `- «${i.what}» ${tips[i.type]}.`);
  return { lines, body: `Hola, equipo de ${b.name}:\n\nGracias por estar en ${C.appName}. Hemos revisado tu catálogo y hay unos detalles que te ayudarían a vender más:\n\n${lines.join('\n')}\n\nPuedes cambiarlo todo desde «Mi panel» en ${baseUrl()}\n\nSi tienes cualquier duda, responde a este correo.\n\nUn saludo,\nEl equipo de ${C.appName}` };
}
function healthMail(b) {
  const { body } = healthText(b);
  return `mailto:${encodeURIComponent(b.email).replace('%40', '@')}?subject=${encodeURIComponent('Tu marca en ' + C.appName + ': unos detalles para vender más')}&body=${encodeURIComponent(body)}`;
}
function healthHTML(h) {
  const types = Object.keys(HEALTH_TYPES).filter(k => h.counts[k]);
  if (!h.brands.length) return '<div class="empty" style="max-width:820px">Todo en orden: ninguna marca tiene cosas pendientes en su catálogo.</div>';
  return `<p class="muted" style="max-width:820px;margin-bottom:14px">Lo que conviene mejorar, marca por marca. Pulsa «Mensaje» para escribirle dentro de la web con la lista ya redactada, o «Por correo» para abrir tu correo.</p>
    <div class="hchips">${types.map(k => `<span class="hchip${k === 'sinvender' ? ' bad' : ''}" title="${esc(HEALTH_TYPES[k][1])}"><b>${h.counts[k]}</b> ${esc(HEALTH_TYPES[k][0].toLowerCase())}</span>`).join('')}</div>
    <div class="plist" style="max-width:820px">${h.brands.map(b => `<article class="hitem"><div class="h-head"><div><b>${esc(b.name)}</b><small>${esc(b.email || 'Sin correo')}</small></div>
      <div class="acts">${chatBtn(b.id, null, 'Mensaje en ' + esc(C.appName), `Hola, equipo de ${b.name}: hemos revisado vuestro catálogo y hay unos detalles que os ayudarían a vender más:\n\n${healthText(b).lines.join('\n')}\n\nPodéis cambiarlo todo desde «Mi panel». ¡Gracias!`).replace('btn ghost small', 'btn small')}${b.email ? `<a class="btn ghost small" href="${esc(healthMail(b))}">Por correo</a>` : ''}<a class="btn ghost small" href="#/marca/${esc(b.id)}">Ver su página</a></div></div>
      <ul class="hlist">${b.issues.map(i => `<li class="${i.type === 'sinvender' ? 'bad' : ''}"><span class="htag">${esc(HEALTH_TYPES[i.type][0])}</span>${i.what ? esc(i.what) : esc(HEALTH_TYPES[i.type][1])}</li>`).join('')}</ul></article>`).join('')}</div>`;
}

/* ---------- Ranking de marcas ---------- */
async function brandRanking(days) {
  let ev = null, saves = null;
  try { ev = await api.eventCounts(days); } catch {}
  try { saves = api.adminSaveCounts ? await api.adminSaveCounts() : null; } catch {}
  const m = new Map();
  S.allProducts.forEach(p => {
    if (!m.has(p.brand_id)) m.set(p.brand_id, { id: p.brand_id, name: p.brand, n: 0, views: 0, buys: 0, saves: 0 });
    const r = m.get(p.brand_id), e = (ev && ev[p.id]) || {};
    r.n++; r.views += e.views || 0; r.buys += e.buys || 0; r.saves += (saves && saves[p.id]) || 0;
  });
  const rows = [...m.values()].sort((a, b) => b.buys - a.buys || b.views - a.views || b.saves - a.saves);
  rows.noEvents = !ev; rows.noSaves = !saves;
  return rows;
}
function rankingHTML(rows) {
  const periods = [['7', '7 días'], ['30', '30 días'], ['all', 'Siempre']];
  const per = S.rankDays ? `en los últimos ${S.rankDays} días` : 'desde el principio';
  const seg = `<div class="statshead" style="max-width:980px"><span class="muted">Periodo de clics y visitas</span><div class="seg mini" role="group" aria-label="Periodo">${periods.map(([v, l]) => `<button data-act="rankdays" data-v="${v}" aria-pressed="${String(S.rankDays || 'all') === v}">${l}</button>`).join('')}</div></div>`;
  if (!rows.length) return seg + '<div class="empty" style="max-width:980px">Aún no hay marcas con prendas.</div>';
  const txt = r => `Hola, equipo de ${r.name}: ${per} vuestras prendas en ${C.appName} han tenido ${nfmt(r.views)} ${r.views === 1 ? 'clic' : 'clics'} y ${nfmt(r.buys)} ${r.buys === 1 ? 'visita' : 'visitas'} a vuestra tienda, y se han guardado ${nfmt(r.saves)} ${r.saves === 1 ? 'vez' : 'veces'} en total. ¡Gracias por estar en ${C.appName}!`;
  return seg + `${rows.noEvents ? '<p class="muted vnote">Los clics y visitas a la tienda aparecerán cuando esté activado estadisticas.sql.</p>' : ''}${rows.noSaves ? '<p class="muted vnote">Para ver los guardados de todas las marcas, ejecuta supabase/panel.sql.</p>' : ''}
    <div class="rankwrap" style="max-width:980px"><table class="rank"><thead><tr><th>#</th><th>Marca</th><th>Prendas</th><th>Clics</th><th>Visitas a su tienda</th><th>Van a la tienda</th><th>Guardados</th><th></th></tr></thead>
    <tbody>${rows.map((r, i) => `<tr><td class="rk">${i + 1}</td><td><a href="#/marca/${esc(r.id)}"><b>${esc(r.name)}</b></a></td><td>${r.n}</td><td>${nfmt(r.views)}</td><td><b>${nfmt(r.buys)}</b></td><td>${r.views ? pct(r.buys, r.views) + ' %' : '—'}</td><td>${nfmt(r.saves)}</td>
      <td><button class="linkbtn" data-act="copyrank" data-text="${esc(encodeURIComponent(txt(r)))}">Copiar resumen</button> · <button class="linkbtn" data-act="chatto" data-id="${esc(r.id)}" data-text="${esc(encodeURIComponent(txt(r)))}">Enviar por mensaje</button></td></tr>`).join('')}</tbody></table></div>
    <p class="muted vnote" style="max-width:980px">Ordenado por visitas a su tienda. «Copiar resumen» copia un mensaje con sus números para enviárselo a la marca. Los guardados son desde siempre.</p>`;
}
async function copyText(t, okMsg) {
  try { await navigator.clipboard.writeText(t); toast(okMsg); }
  catch { const a = document.createElement('textarea'); a.value = t; a.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(a); a.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {} a.remove(); toast(ok ? okMsg : 'No se pudo copiar.'); }
}

/* ---------- Exportar a Excel (CSV) ---------- */
function exportBarHTML() {
  return `<div class="exportbar" style="max-width:820px"><span class="muted">Descargar en Excel:</span><button class="btn ghost small" data-act="export" data-v="prendas">Prendas</button><button class="btn ghost small" data-act="export" data-v="marcas">Marcas y estadísticas</button><button class="btn ghost small" data-act="export" data-v="usuarios">Usuarios</button></div>`;
}
function csvCell(v) {
  let t = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; // evita fórmulas al abrirlo en Excel
  return /[";\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}
function downloadCSV(name, rows) {
  const csv = '\ufeff' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
async function exportCSV(kind) {
  const day = madridDay(Date.now());
  try {
    await refreshProducts();
    if (kind === 'prendas') {
      let ev = null, sv = null; try { ev = await api.eventCounts(30); } catch {} try { sv = api.adminSaveCounts ? await api.adminSaveCounts() : null; } catch {}
      const st = { approved: 'Publicada', pending: 'En revisión', rejected: 'Rechazada' };
      downloadCSV(`found-prendas-${day}.csv`, [['Prenda', 'Marca', 'Categoría', 'Precio', 'Estilos', 'Tallas', 'Estado', 'Destacada', 'Enlace a la tienda', 'Clics (30 días)', 'Visitas a la tienda (30 días)', 'Guardados', 'Publicada el', 'ID'],
        ...S.allProducts.map(p => [p.name, p.brand, p.cat, String(p.price).replace('.', ','), p.tags.join(', '), sortSizes(p.sizes).join(' '), st[p.status] || p.status, p.featured ? 'Sí' : 'No', p.buy_url, ev ? ((ev[p.id] || {}).views || 0) : '', ev ? ((ev[p.id] || {}).buys || 0) : '', sv ? (sv[p.id] || 0) : '', p.created ? p.created.slice(0, 10) : '', p.id])]);
    } else if (kind === 'marcas') {
      const rows = await brandRanking(30); let users = []; try { users = (await api.adminUsers()).list || []; } catch {}
      const brands = users.filter(u => u.role === 'brand');
      const all = [...rows.map(r => ({ ...r, u: users.find(x => x.id === r.id) || {} })), ...brands.filter(u => !rows.some(r => r.id === u.id)).map(u => ({ id: u.id, name: u.brand_name, n: 0, views: 0, buys: 0, saves: 0, u }))];
      downloadCSV(`found-marcas-${day}.csv`, [['Marca', 'Correo de registro', 'Correo de contacto', 'Prendas', 'Clics (30 días)', 'Visitas a su tienda (30 días)', 'Guardados', 'Alta', 'ID'],
        ...all.map(r => [r.name || r.u.brand_name, r.u.email || '', (S.allProducts.find(p => p.brand_id === r.id) || {}).contact || r.u.contact_email || '', r.n, r.views, r.buys, r.saves, r.u.created_at ? String(r.u.created_at).slice(0, 10) : '', r.id])]);
    } else {
      const users = (await api.adminUsers()).list || [], tipo = { buyer: 'Comprador', brand: 'Marca', admin: 'Creador' };
      downloadCSV(`found-usuarios-${day}.csv`, [['Correo', 'Tipo', 'Marca', 'Alta', 'Última vez', 'ID'], ...users.map(u => [u.email || u.contact_email || '', tipo[u.role] || u.role, u.brand_name || '', u.created_at ? String(u.created_at).slice(0, 10) : '', u.last_sign_in_at ? String(u.last_sign_in_at).slice(0, 10) : '', u.id])]);
    }
    toast('Descargado. Ábrelo con Excel, Numbers o Google Sheets.');
  } catch (e) { toast('No se pudo descargar: ' + e.message); }
}

/* ---------- Editar cualquier prenda (creador) ---------- */
function openAdminEdit(id) {
  const p = findProduct(id); if (!p) return;
  S.formTags = [...p.tags]; S.formSizes = [...p.sizes];
  dlg.innerHTML = `<div style="position:relative"><button class="close" data-act="closeDlg" aria-label="Cerrar">×</button>
    <div class="aedit"><span class="eyebrow">Editar como creador</span><h2 style="margin:12px 0 4px">${esc(p.name)}</h2><p class="muted" style="margin-bottom:18px">${esc(p.brand)} · los cambios se ven al momento. La foto solo la puede cambiar la marca.</p>
      <label class="field"><span>Nombre</span><input type="text" id="f-name" maxlength="80" value="${esc(p.name)}"></label>
      <div class="row2"><label class="field"><span>Precio (${esc(C.currency)})</span><input type="number" id="f-price" min="0.5" step="0.5" value="${esc(p.price)}"></label>
        <label class="field"><span>Categoría</span><select id="f-cat">${[...new Set([...C.categories, p.cat])].map(c => `<option${c === p.cat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label></div>
      <div class="field"><span>Tallas disponibles</span><div id="f-sizes">${formSizesHTML(p.cat)}</div></div>
      <div class="field"><span>Estilos</span><div class="chips">${[...new Set([...C.styles, ...p.tags])].map(s => `<button type="button" class="chip" data-act="ft" data-v="${esc(s)}" aria-pressed="${S.formTags.includes(s)}">${esc(s)}</button>`).join('')}</div></div>
      <label class="field"><span>Descripción</span><textarea id="f-desc" maxlength="500">${esc(p.desc)}</textarea></label>
      <label class="field"><span>Enlace a la tienda</span><input type="url" id="f-buy" value="${esc(p.buy_url)}" placeholder="https://..."></label>
      <p class="msg" id="aemsg" role="alert"></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-act="adminsave" data-id="${esc(p.id)}">Guardar cambios</button><button class="btn ghost" data-act="closeDlg">Cancelar</button></div></div></div>`;
  if (!dlg.open) dlg.showModal(); dlg.scrollTop = 0;
}
async function saveAdminEdit(id, btn) {
  const m = $('#aemsg'), bad = t => { m.className = 'msg err'; m.textContent = t; };
  const f = { name: $('#f-name').value.trim(), price: parseFloat($('#f-price').value), cat: $('#f-cat').value, tags: [...S.formTags], sizes: sortSizes(S.formSizes), desc: $('#f-desc').value.trim(), buy_url: $('#f-buy').value.trim() };
  if (!f.name) return bad('Escribe el nombre.');
  if (!(f.price > 0)) return bad('El precio debe ser mayor que 0.');
  if (!f.tags.length) return bad('Elige al menos un estilo.');
  if (f.buy_url && !isUrl(f.buy_url)) return bad('El enlace debe empezar por http:// o https://');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try { await api.adminUpdateProduct(id, f); await refreshProducts(); S.formTags = []; S.formSizes = []; dlg.close(); toast('Prenda actualizada'); renderAdminTab(); }
  catch (e) { bad('No se pudo guardar: ' + e.message); btn.disabled = false; btn.textContent = 'Guardar cambios'; }
}

/* ---------- Correos bloqueados ---------- */
async function renderBlocked() {
  const box = $('#blockbox'); if (!box || !api.adminBlocked) return;
  let r; try { r = await api.adminBlocked(); } catch (e) { box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; return; }
  box.innerHTML = `<h2 style="margin-bottom:6px">Correos bloqueados</h2>
    ${r.missing ? '<p class="muted">Para poder bloquear correos, ejecuta <b>supabase/panel.sql</b> en Supabase &gt; SQL Editor.</p>' : `<p class="muted" style="margin-bottom:14px">Un correo bloqueado no puede crear una cuenta nueva. Bloquear no borra la cuenta si ya existe.</p>
    <div class="blkform"><input type="email" id="blk-email" placeholder="correo@ejemplo.com" aria-label="Correo a bloquear"><input type="text" id="blk-reason" maxlength="200" placeholder="Motivo (opcional, solo lo ves tú)" aria-label="Motivo"><button class="btn small" data-act="block">Bloquear</button></div>
    ${r.list.length ? `<ul class="blklist">${r.list.map(x => `<li><div><b>${esc(x.email)}</b><small>${esc(x.reason || 'Sin motivo')} · ${fmtShort(x.created_at)}</small></div><button class="linkbtn" data-act="unblock" data-v="${esc(x.email)}">Desbloquear</button></li>`).join('')}</ul>` : '<p class="muted" style="font-size:14px;margin-top:10px">No hay correos bloqueados.</p>'}`}`;
}

/* ---------- fotos de los estilos ---------- */
async function saveStylePic(style, url) {
  const prev = S.settings || {};
  const styleImages = { ...(prev.styleImages || {}) };
  if (url) styleImages[style] = url; else delete styleImages[style];
  const v = { ...prev, styleImages };
  try { await api.saveSettings(v); applySettings(v); toast(url ? 'Foto de «' + style + '» guardada' : 'Foto quitada'); renderAdminTab(); }
  catch (e) { toast('No se pudo guardar: ' + e.message); }
}
document.addEventListener('change', async e => {
  const style = e.target.dataset && e.target.dataset.stylepic; if (!style) return;
  const f = e.target.files[0]; if (!f) return;
  if (!/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 15e6) { toast('Elige una imagen PNG, JPG o WEBP de menos de 15 MB.'); return; }
  const lab = e.target.closest('label'); if (lab) lab.firstChild.textContent = 'Subiendo…';
  try { const url = await api.uploadBrandImage(S.user.id, f, 'style'); await saveStylePic(style, url); }
  catch (err) { toast('No se pudo subir: ' + err.message); if (lab) lab.firstChild.textContent = 'Subir foto'; }
});

/* ---------- pestañas Por revisar y Denuncias ---------- */
const REPORT_REASONS = { falsificacion: 'Falsificación o copia de otra marca', inapropiado: 'Contenido inapropiado u ofensivo', enlace: 'El enlace o la tienda no funciona', enganoso: 'Información falsa o engañosa', otro: 'Otro motivo' };
// en el móvil las pestañas se deslizan: deja la elegida a la vista
function centerTab() {
  const row = $('.admtabs'), b = row && row.querySelector('[aria-pressed="true"]');
  if (row && b && row.scrollWidth > row.clientWidth) row.scrollLeft = b.offsetLeft - (row.clientWidth - b.offsetWidth) / 2;
}
function setTabCount(tab, n) {
  const b = $(`[data-act="admintab"][data-v="${tab}"]`); if (!b) return;
  const base = tab === 'revisar' ? 'Por revisar' : tab === 'mensajes' ? 'Mensajes' : 'Denuncias';
  b.innerHTML = base + (n ? ` <span class="tabn">${n}</span>` : '');
}
function modItemHTML(p) {
  return `<article class="moditem" data-id="${esc(p.id)}">
    <button class="mod-pic" data-act="open" data-id="${esc(p.id)}" aria-label="Ver ${esc(p.name)}" style="background:${tileBg(p)}">${pic(p)}</button>
    <div class="mod-info"><b>${esc(p.name)}</b><small>${esc(p.brand)} · ${esc(p.cat)} · ${money(p.price)} · ${p.created ? fmtShort(p.created) : ''}</small>
      <div class="chips" style="gap:5px;margin-top:6px">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}${p.sizes.length ? `<span class="tag">Tallas: ${esc(sortSizes(p.sizes).join(' '))}</span>` : '<span class="tag">Sin tallas</span>'}</div>
      ${p.desc ? `<p class="mod-desc">${esc(p.desc)}</p>` : ''}
      ${p.buy_url ? `<a class="mod-link" href="${esc(p.buy_url)}" target="_blank" rel="noopener noreferrer">Comprobar el enlace de su tienda ↗</a>` : '<small class="muted">Sin enlace de compra (se contacta por correo).</small>'}
      <div class="mod-acts"><button class="btn small" data-act="modok" data-id="${esc(p.id)}">Aprobar</button><button class="btn ghost small" data-act="modno" data-id="${esc(p.id)}">Rechazar…</button>${chatBtn(p.brand_id, p.id)}</div>
      <div class="mod-reject" hidden><label class="field" style="margin:10px 0 8px"><span>Motivo (lo verá la marca en su panel)</span>
        <input type="text" class="mod-reason" maxlength="140" placeholder="Ej. La foto está borrosa: sube una con buena luz"></label>
        <div class="chips" style="gap:6px;margin-bottom:10px">${['La foto está borrosa o es de poca calidad', 'No parece una marca independiente', 'Faltan datos: precio, tallas o descripción', 'El enlace de compra no funciona'].map(x => `<button type="button" class="chip" data-act="modpreset" data-v="${esc(x)}">${esc(x)}</button>`).join('')}</div>
        <button class="btn small danger-solid" data-act="modreject" data-id="${esc(p.id)}">Rechazar prenda</button></div>
    </div></article>`;
}
function reportItemHTML(pid, reps) {
  const p = findProduct(pid);
  const head = p ? `<button class="mod-pic" data-act="open" data-id="${esc(pid)}" aria-label="Ver ${esc(p.name)}" style="background:${tileBg(p)}">${pic(p)}</button>` : '<div class="mod-pic"></div>';
  return `<article class="moditem">${head}
    <div class="mod-info"><b>${p ? esc(p.name) : 'Prenda'}</b><small>${p ? esc(p.brand) + ' · ' : ''}${reps.length} ${reps.length === 1 ? 'denuncia' : 'denuncias'}${p && p.status !== 'approved' ? ' · ya está retirada' : ''}</small>
      <ul class="replist">${reps.map(x => `<li><b>${esc(REPORT_REASONS[x.reason] || x.reason)}</b>${x.details ? `<span>«${esc(x.details)}»</span>` : ''}<small>${fmtShort(x.created_at)}</small></li>`).join('')}</ul>
      <div class="mod-acts">${p && p.status === 'approved' ? `<button class="btn small danger-solid" data-act="rephide" data-id="${esc(pid)}">Retirar la prenda</button>` : ''}<button class="btn ghost small" data-act="repok" data-id="${esc(pid)}">Todo bien, marcar como revisada</button>${p ? chatBtn(p.brand_id, p.id) : ''}</div>
    </div></article>`;
}
// mensaje automático a la marca con el motivo (si los mensajes están activados; si no, no pasa nada)
async function notifyRejected(pid, reason) {
  const p = findProduct(pid); if (!p || !api.chatSend) return;
  try { await api.chatSend(p.brand_id, `Hemos revisado «${p.name}» y por ahora no se puede publicar.\n\nMotivo: ${reason || 'sin indicar'}\n\nPuedes corregirla desde «Mi panel» con el botón «Editar» y volveremos a revisarla. Si tienes dudas, contéstanos aquí.`, pid, true); } catch {}
}
async function modSet(id, status, reason, okMsg) {
  try { await api.adminSetStatus(id, status, reason); if (status === 'rejected') notifyRejected(id, reason); await refreshProducts(); toast(okMsg); renderAdminTab(); }
  catch (e) { toast('No se pudo guardar: ' + e.message); }
}

/* ---------- pestaña Usuarios ---------- */
const fmtShort = iso => iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
function fillUsers() {
  const box = $('#ulist'); if (!box) return;
  const q = (S.userQ || '').trim().toLowerCase(), role = S.userRole || 'all', bills = S.adminBills || {};
  const list = (S.adminUsers || []).filter(u => (role === 'all' || u.role === role) && (!q || [u.email, u.brand_name, u.contact_email].join(' ').toLowerCase().includes(q)));
  const c = $('#ucount'); if (c) c.textContent = list.length + (list.length === 1 ? ' cuenta' : ' cuentas');
  const subTag = u => {
    if (u.role !== 'brand' || !billingOn()) return '';
    const x = bills[u.id] || {}, paid = ['active', 'trialing', 'past_due'].includes(x.status);
    const label = paid ? (x.status === 'past_due' ? 'Pago pendiente' : 'Pagando') : x.manual ? 'Activa sin pago' : x.status === 'canceled' ? 'Cancelada' : 'Sin suscripción';
    return `<div class="subadm"><span class="tag ${paid || x.manual ? 'on' : 'off'}">${label}</span>${paid ? '' : `<button class="linkbtn" data-act="submanual" data-id="${esc(u.id)}" data-v="${x.manual ? 'off' : 'on'}">${x.manual ? 'Quitar activación' : 'Activar sin pago'}</button>`}</div>`;
  };
  const me = u => S.user && u.id === S.user.id;
  box.innerHTML = list.length ? list.map(u => {
    const title = u.brand_name || u.email || (u.role === 'admin' ? 'Creador' : 'Comprador');
    const meta = [u.brand_name && u.email ? u.email : '', !u.email && u.contact_email ? u.contact_email : '', u.created_at ? 'alta ' + fmtShort(u.created_at) : '', u.last_sign_in_at ? 'última vez ' + fmtShort(u.last_sign_in_at) : '', u.role === 'brand' && u.products !== null && u.products !== undefined ? u.products + (u.products === 1 ? ' prenda' : ' prendas') : ''].filter(Boolean).join(' · ') || String(u.id).slice(0, 8);
    const canDel = !me(u) && u.role !== 'admin' && !S.adminUsersMissing;
    return `<div class="pitem uitem"><div><b>${esc(title)}${me(u) ? ' (tú)' : ''}</b><small>${esc(meta)}</small>${subTag(u)}</div>
      <div class="acts"><label><span class="sr">Tipo de cuenta</span><select class="rolesel" data-id="${esc(u.id)}" ${me(u) ? 'disabled' : ''}>${[['buyer', 'Comprador'], ['brand', 'Marca'], ['admin', 'Creador']].map(([v, l]) => `<option value="${v}"${u.role === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
      ${u.role === 'brand' ? chatBtn(u.id, null, 'Mensaje') : ''}${canDel ? `<button class="btn ghost small danger" data-act="deluser" data-id="${esc(u.id)}">Borrar</button>` : ''}</div></div>`;
  }).join('') : '<div class="empty">No hay cuentas con ese filtro.</div>';
}
async function deleteUser(id, btn) {
  const u = (S.adminUsers || []).find(x => x.id === id); if (!u) return;
  const name = u.brand_name || u.email || 'esta cuenta';
  const n = u.role === 'brand' ? (u.products ?? S.allProducts.filter(p => p.brand_id === id).length) : 0;
  const what = u.role === 'brand' ? `Se borrarán también sus ${n} ${n === 1 ? 'prenda' : 'prendas'}, sus fotos, su página de marca y sus estadísticas.` : 'Se borrarán también sus gustos y sus guardados.';
  if (!confirm(`¿Borrar la cuenta de ${name}?\n\n${what}\n\nNo se puede deshacer.`)) return;
  btn.disabled = true; btn.textContent = 'Borrando…';
  try {
    await api.adminDeleteUser(id);
    S.adminUsers = S.adminUsers.filter(x => x.id !== id);
    await refreshProducts(); fillUsers(); toast('Cuenta borrada');
    if (u.email && api.adminBlock && confirm(`¿Bloquear también ${u.email} para que no pueda volver a registrarse?`)) {
      try { await api.adminBlock(u.email, 'Cuenta borrada desde el panel'); toast('Correo bloqueado'); renderBlocked(); } catch (e) { toast(e.message); }
    }
  } catch (e) { btn.disabled = false; btn.textContent = 'Borrar'; toast('No se pudo borrar: ' + e.message); }
}
const parseList = str => [...new Set(String(str).split(/[,\n]/).map(x => x.trim().slice(0, 30)).filter(Boolean))].slice(0, 20);
async function renderAdminTab() {
  const box = $('#adminbody'); if (!box) return;
  $$('[data-act="admintab"]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S.adminTab));
  centerTab();
  const t = S.adminTab;
  try {
    if (t === 'resumen') {
      const o = await api.adminOverview();
      const bills = billingOn() ? Object.values(await api.adminBilling()) : [];
      const paying = bills.filter(x => ['active', 'trialing', 'past_due'].includes(x.status)).length;
      const free = bills.filter(x => x.manual && !['active', 'trialing', 'past_due'].includes(x.status)).length;
      const today = await todayHTML();
      box.innerHTML = `${today}<div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));max-width:760px">
        <div class="stat"><b>${o.buyers}</b><span>compradores</span></div><div class="stat"><b>${o.brands}</b><span>marcas</span></div>
        <div class="stat"><b>${o.products}</b><span>productos</span></div><div class="stat"><b>${o.favs}</b><span>guardados en total</span></div></div>
 ${billingOn() ? `<div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));max-width:760px">
        <div class="stat"><b>${paying}</b><span>marcas pagando</span></div><div class="stat"><b>${free}</b><span>activadas sin pago</span></div>
        <div class="stat"><b>${subPrice() ? money(paying * subPrice()) : '—'}</b><span>ingresos al mes (aprox.)</span></div></div>` : ''}
        ${!billingOn() || isUrl(BILL().payLink) || !api.live ? '' : '<section class="card-box editcta" style="max-width:760px;margin-bottom:18px"><div><h2 style="margin-bottom:6px">Conecta el cobro</h2><p class="muted">Aún no has puesto tu enlace de pago de Stripe. Hasta entonces las marcas nuevas no pueden activar la suscripción (tú sí puedes activarlas a mano en Usuarios).</p></div><button class="btn" data-act="admintab" data-v="ajustes">Ir a Ajustes</button></section>'}
        ${await visitsTeaser()}
        <section class="card-box editcta" style="max-width:760px;margin-bottom:18px"><div><h2 style="margin-bottom:6px">Edita la web directamente</h2><p class="muted">Pulsa sobre cualquier texto de las páginas para cambiarlo y elige los colores viendo el resultado. Nada cambia para los visitantes hasta que pulses «Publicar».</p></div><button class="btn" data-act="editon">Activar modo edición</button></section>
        <section class="card-box" style="max-width:760px"><h2 style="margin-bottom:10px">Qué puedes hacer aquí</h2>
        <p class="muted"><b>Ajustes de la web:</b> nombre, frase, color principal, aviso superior, estilos y categorías.<br>
        <b>Productos:</b> destacar los que quieras empujar o eliminar los que no deban estar.<br>
        <b>Usuarios:</b> ver quién se ha registrado y cambiar su tipo de cuenta.</p></section>`;
    } else if (t === 'mensajes') {
      await refreshProducts();
      await renderChatAdmin(box);
    } else if (t === 'salud') {
      await refreshProducts();
      let users = []; try { const r = await api.adminUsers(); users = r.list || []; } catch {}
      box.innerHTML = healthHTML(catalogHealth(users));
    } else if (t === 'ranking') {
      await refreshProducts();
      box.innerHTML = '<p class="muted" style="padding:20px 0">Calculando…</p>';
      const rows = await brandRanking(S.rankDays);
      if (S.adminTab === 'ranking') box.innerHTML = rankingHTML(rows);
    } else if (t === 'revisar') {
      await refreshProducts();
      const list = S.allProducts.filter(p => p.status === 'pending').sort((a, b) => String(a.created).localeCompare(String(b.created)));
      const rej = S.allProducts.filter(p => p.status === 'rejected');
      setTabCount('revisar', list.length);
      box.innerHTML = `${S.modMissing ? `<section class="card-box editcta" style="max-width:820px;margin-bottom:16px"><div><h2 style="margin-bottom:6px">Activa la revisión de prendas</h2><p class="muted">Ejecuta <b>supabase/moderacion.sql</b> en Supabase &gt; SQL Editor. Desde ese momento, las prendas nuevas esperarán aquí a que las apruebes.</p></div></section>` : ''}
        <p class="muted" style="max-width:820px;margin-bottom:16px">${modOn() ? 'Las prendas nuevas, o las que cambian de foto o nombre, esperan aquí hasta que las apruebes. Nadie más las ve mientras tanto.' : 'La revisión está <b>apagada</b>: las prendas nuevas se publican al momento. Puedes activarla en Ajustes de la web.'}</p>
        <div class="plist modlist" style="max-width:820px">${list.length ? list.map(p => modItemHTML(p)).join('') : '<div class="empty">No hay nada pendiente de revisar.</div>'}</div>
        ${rej.length ? `<h3 style="margin:30px 0 12px">Rechazadas (${rej.length})</h3><div class="plist" style="max-width:820px">${rej.map(p => `<div class="pitem"><div class="th" style="background:${tileBg(p)}">${pic(p)}</div><div><b>${esc(p.name)}</b><small>${esc(p.brand)}${p.reason ? ' · Motivo: ' + esc(p.reason) : ''}</small></div><div class="acts">${chatBtn(p.brand_id, p.id, 'Escribir')}<button class="btn ghost small" data-act="modok" data-id="${esc(p.id)}">Aprobar</button></div></div>`).join('')}</div>` : ''}`;
    } else if (t === 'denuncias') {
      await refreshProducts();
      const r = await api.adminReports();
      setTabCount('denuncias', r.list.length);
      const groups = {}; r.list.forEach(x => { (groups[x.product_id] = groups[x.product_id] || []).push(x); });
      const ids = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
      box.innerHTML = `${r.missing ? `<section class="card-box editcta" style="max-width:820px;margin-bottom:16px"><div><h2 style="margin-bottom:6px">Activa las denuncias</h2><p class="muted">Ejecuta <b>supabase/moderacion.sql</b> en Supabase &gt; SQL Editor. Desde ese momento, cada prenda tendrá un enlace «Denunciar esta prenda» y los avisos llegarán aquí.</p></div></section>` : ''}
        <p class="muted" style="max-width:820px;margin-bottom:16px">Avisos que envían los visitantes desde la ficha de una prenda. Revísalos y decide: retirar la prenda o marcar el aviso como revisado si todo está bien.</p>
        <div class="plist" style="max-width:820px">${ids.length ? ids.map(pid => reportItemHTML(pid, groups[pid])).join('') : '<div class="empty">No hay denuncias pendientes.</div>'}</div>`;
    } else if (t === 'visitas') {
      box.innerHTML = '<p class="muted" style="padding:20px 0">Cargando visitas…</p>';
      const r = await api.siteStats(S.siteDays);
      if (S.adminTab === 'visitas') box.innerHTML = siteStatsHTML(r);
    } else if (t === 'ajustes') {
      const st = S.settings || {};
      box.innerHTML = `<section class="card-box" style="max-width:720px"><h2>Ajustes de la web</h2><p class="muted" style="margin:6px 0 18px">Los cambios se ven al instante en toda la web.</p>
        <label class="field"><span>Nombre de la web</span><input type="text" id="s-name" maxlength="24" value="${esc(C.appName)}"></label>
        <label class="field"><span>Frase corta</span><input type="text" id="s-tag" maxlength="80" value="${esc(C.tagline)}"></label>
        <label class="field"><span>Color principal</span><input type="color" id="s-color" value="${isHex(st.colors && st.colors.accent) ? st.colors.accent : isHex(st.accent) ? st.accent : DEFAULT_ACCENT}"></label>
        <p class="muted" style="font-size:14px;margin:-6px 0 16px">Para cambiar los textos de las páginas y el resto de colores, usa el <button class="linkbtn" data-act="editon">modo edición</button>.</p>
        <label class="field"><span>Aviso en la parte superior (déjalo vacío para quitarlo)</span><input type="text" id="s-ann" maxlength="120" value="${esc(C.announcement || '')}" placeholder="Ej. Envío gratis en las marcas piloto"></label>
        <label class="field"><span>Estilos (separados por comas)</span><textarea id="s-styles">${esc(C.styles.join(', '))}</textarea></label>
        <label class="field"><span>Categorías (separadas por comas)</span><textarea id="s-cats">${esc(C.categories.join(', '))}</textarea></label>
        <p class="muted" style="font-size:14px;margin-bottom:12px">Los productos ya subidos conservan sus estilos y categorías anteriores.</p>
        <h3 style="margin:26px 0 6px">Fotos de los estilos</h3>
        <p class="muted" style="font-size:14px;margin-bottom:14px">Salen en las tarjetas «Encuentra tu tribu» de la portada y en el test de estilo. Mejor en vertical (3:4), con la prenda bien visible. Se guardan al elegirlas.</p>
        <div class="stylepics">${C.styles.map((s, i) => { const img = styleImg(s); return `<div class="sp-item"><div class="sp-pic" style="background:${STYLE_COLORS[i % STYLE_COLORS.length]}">${img ? `<img src="${esc(img)}" alt="">` : '<span>Sin foto</span>'}</div>
          <b>${esc(s)}</b><label class="btn ghost small sp-up">${img ? 'Cambiar' : 'Subir foto'}<input type="file" accept="image/png,image/jpeg,image/webp" class="sr" data-stylepic="${esc(s)}"></label>${img ? `<button type="button" class="linkbtn" data-act="rmstylepic" data-v="${esc(s)}">Quitar</button>` : ''}</div>`; }).join('')}</div>
        <h3 style="margin:26px 0 6px">Revisión de prendas</h3>
        <label class="check"><input type="checkbox" id="s-mod"${modOn() ? ' checked' : ''}> <span>Revisar las prendas nuevas antes de publicarlas</span></label>
        <p class="muted" style="font-size:14px;margin:-8px 0 12px">Si lo apagas, las marcas publican al momento. Las denuncias siguen funcionando igual.</p>
        <h3 style="margin:26px 0 6px">Cobro a las marcas (Stripe)</h3>
        <p class="muted" style="font-size:14px;margin-bottom:12px">Ahora mismo está ${billingOn() ? '<b>activado</b>: las marcas pagan una suscripción mensual para publicar.' : '<b>apagado</b>: las marcas publican gratis y no ven nada de pagos.'} Para activarlo más adelante sigue el README, apartado «Para más adelante: cobrar a las marcas».</p>
        <label class="check"><input type="checkbox" id="s-billon"${billingOn() ? ' checked' : ''}> <span>Cobrar una suscripción mensual a las marcas</span></label>
        <label class="field"><span>Precio mensual que se muestra (${esc(C.currency)}, IVA incluido)</span><input type="number" id="s-price" min="0" step="0.01" value="${esc(BILL().price || '')}" placeholder="Ej. 29"></label>
        <label class="field"><span>Enlace de pago de Stripe (Payment Link)</span><input type="url" id="s-paylink" value="${esc(BILL().payLink || '')}" placeholder="https://buy.stripe.com/..."></label>
        <label class="field"><span>Enlace del portal de clientes de Stripe (para que las marcas cancelen o cambien la tarjeta)</span><input type="url" id="s-portal" value="${esc(BILL().portal || '')}" placeholder="https://billing.stripe.com/p/login/..."></label>
        <p class="msg" id="smsg" role="alert"></p>
        <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" data-act="savesettings">Guardar ajustes</button><button class="btn ghost" data-act="resetsettings">Volver a los valores originales</button></div></section>`;
    } else if (t === 'productos') {
      await refreshProducts();
      let evAll = null; try { evAll = api.eventCounts ? await api.eventCounts(30) : null; } catch {}
      box.innerHTML = `${exportBarHTML()}<div class="plist" style="max-width:820px">${S.allProducts.length ? S.allProducts.map(p => `<div class="pitem"><div class="th" style="background:${tileBg(p)}">${pic(p)}</div>
        <div><b>${esc(p.name)}${p.featured ? ' ★' : ''}</b>${p.status === 'pending' ? '<span class="stag pend">En revisión</span>' : p.status === 'rejected' ? '<span class="stag rej">Rechazada</span>' : ''}<small>${esc(p.brand)} · ${esc(p.cat)} · ${money(p.price)}${evAll ? ` · ${(evAll[p.id] || {}).views || 0} clics y ${(evAll[p.id] || {}).buys || 0} a tienda (30 días)` : ''}</small></div>
        <div class="acts">${chatBtn(p.brand_id, p.id, 'Escribir')}<button class="btn ghost small" data-act="adminedit" data-id="${esc(p.id)}">Editar</button><button class="btn ghost small" data-act="adminfeat" data-id="${esc(p.id)}">${p.featured ? 'Quitar destacado' : 'Destacar'}</button><button class="btn ghost small" data-act="admindel" data-id="${esc(p.id)}" aria-label="Eliminar ${esc(p.name)}">Eliminar</button></div></div>`).join('') : '<div class="empty">Aún no hay productos.</div>'}</div>`;
    } else if (t === 'usuarios') {
      const r = await api.adminUsers();
      S.adminUsers = r.list; S.adminUsersMissing = !!r.missing;
      const bills = billingOn() ? await api.adminBilling() : {};
      S.adminBills = bills;
      box.innerHTML = `${r.missing ? `<section class="card-box editcta" style="max-width:820px;margin-bottom:16px"><div><h2 style="margin-bottom:6px">Activa la gestión de cuentas</h2><p class="muted">Para ver el correo de cada cuenta y poder borrarlas, ejecuta <b>supabase/cuentas.sql</b> en Supabase &gt; SQL Editor y recarga esta página.</p></div></section>` : ''}
        <div class="toolbar ufilters" style="max-width:820px"><input type="search" id="usearch" placeholder="Busca por correo o nombre de marca" aria-label="Buscar usuarios" value="${esc(S.userQ || '')}">
          <div class="seg mini" role="group" aria-label="Tipo de cuenta">${[['all', 'Todas'], ['buyer', 'Compradores'], ['brand', 'Marcas'], ['admin', 'Creadores']].map(([v, l]) => `<button data-act="urole" data-v="${v}" aria-pressed="${(S.userRole || 'all') === v}">${l}</button>`).join('')}</div></div>
        <p class="muted rescount" id="ucount"></p>
        <div class="plist" id="ulist" style="max-width:820px"></div>
        <section class="card-box" id="blockbox" style="max-width:820px;margin-top:28px"></section>`;
      fillUsers(); renderBlocked();
    }
  } catch (e) { box.innerHTML = `<div class="empty">No se pudo cargar esta sección: ${esc(e.message)}</div>`; }
}
async function saveSiteSettings() {
  const m = $('#smsg'); m.className = 'msg';
  const bad = x => { m.classList.add('err'); m.textContent = x; };
  const v = { appName: $('#s-name').value.trim(), tagline: $('#s-tag').value.trim(), accent: $('#s-color').value, announcement: $('#s-ann').value.trim(), styles: parseList($('#s-styles').value), categories: parseList($('#s-cats').value) };
  if (!v.appName) return bad('La web necesita un nombre.');
  if (!v.styles.length) return bad('Añade al menos un estilo.');
  if (!v.categories.length) return bad('Añade al menos una categoría.');
  if (!isHex(v.accent)) return bad('El color no es válido.');
  const billing = { enabled: $('#s-billon').checked, price: $('#s-price').value ? Math.round(parseFloat($('#s-price').value) * 100) / 100 : '', payLink: $('#s-paylink').value.trim(), portal: $('#s-portal').value.trim() };
  if (billing.enabled && api.live && !billing.payLink) return bad('Para activar el cobro, pon antes el enlace de pago de Stripe.');
  if (billing.payLink && !/^https:\/\/(buy\.stripe\.com|checkout\.stripe\.com)\//.test(billing.payLink)) return bad('El enlace de pago debe ser un enlace de Stripe (empieza por https://buy.stripe.com/).');
  if (billing.portal && !/^https:\/\/billing\.stripe\.com\//.test(billing.portal)) return bad('El enlace del portal debe empezar por https://billing.stripe.com/.');
  if (billing.price !== '' && !(billing.price > 0)) return bad('El precio debe ser mayor que 0.');
  const prev = S.settings || {};
  const full = { ...prev, ...v, billing, moderation: $('#s-mod') ? $('#s-mod').checked : modOn(), colors: { ...(prev.colors || {}), accent: v.accent } };
  try { await api.saveSettings(full); applySettings(full); renderNav(); m.classList.add('ok'); m.textContent = 'Guardado. Ya se ve en toda la web.'; }
  catch (e) { bad('No se pudo guardar: ' + e.message + (api.live ? ' (¿ejecutaste la última versión de schema.sql?)' : '')); }
}

/* ==========================================================
   MENSAJES · chat interno entre cada marca y el creador
   ========================================================== */
// frases rápidas para el creador (se pueden cambiar aquí)
const CHAT_PRESETS = [
  'Hola, hemos revisado tu prenda y hay algo que corregir:',
  'La foto no se ve bien. ¿Puedes subir una con buena luz y fondo limpio?',
  'Falta el enlace a tu tienda: sin él no se puede comprar.',
  'El precio parece incorrecto. ¿Puedes revisarlo?',
  'Faltan las tallas disponibles. Edita la prenda y márcalas.',
  'La descripción es muy corta: añade materiales, corte y cuidados.',
  '¡Gracias! Ya está todo bien.'
];
const chatTime = iso => new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const chatDay = iso => { const d = madridDay(iso), t = madridDay(Date.now()); return d === t ? 'Hoy' : d === addDays(t, -1) ? 'Ayer' : new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }); };
const chatUser = id => (S.adminUsers || []).find(x => x.id === id) || {};
const chatBrandName = id => { const p = S.allProducts.find(x => x.brand_id === id); return (p && p.brand) || chatUser(id).brand_name || chatUser(id).email || 'Marca'; };
const chatBrandEmail = id => { const u = chatUser(id), p = S.allProducts.find(x => x.brand_id === id); return u.email || (p && p.contact) || u.contact_email || ''; };
const chatOnScreen = () => S.route === 'mensajes' || (S.route === 'admin' && S.adminTab === 'mensajes');

function chatThreadHTML(msgs, asAdmin) {
  if (!msgs.length) return `<div class="chat-empty">${asAdmin ? 'Aún no os habéis escrito. Escribe el primer mensaje abajo.' : 'Aquí verás los mensajes del equipo de ' + esc(C.appName) + ' sobre tus prendas. También puedes escribirnos tú cuando quieras.'}</div>`;
  let last = '';
  return msgs.map(m => {
    const mine = asAdmin ? m.from_admin : !m.from_admin;
    const day = madridDay(m.created_at), sep = day !== last ? `<div class="chat-day">${chatDay(m.created_at)}</div>` : ''; last = day;
    const p = m.product_id ? findProduct(m.product_id) : null;
    const prod = p ? `<button class="chat-prod" data-act="open" data-id="${esc(p.id)}"><span class="th" style="background:${tileBg(p)}">${pic(p)}</span><span><small>Sobre la prenda</small><b>${esc(p.name)}</b></span></button>`
      : m.product_id ? '<span class="chat-prod gone">Sobre una prenda que ya no está</span>' : '';
    const who = asAdmin ? (mine ? 'Tú' : chatBrandName(m.brand_id)) : (mine ? 'Tú' : esc(C.appName));
    return `${sep}<div class="msg-row${mine ? ' mine' : ''}"><div class="bubble"><span class="sr">${esc(who)}:</span>${prod}<p>${esc(m.body).replace(/\n/g, '<br>')}</p><time datetime="${esc(m.created_at)}">${chatTime(m.created_at)}${mine && m.read_at ? ' · Leído' : ''}</time></div></div>`;
  }).join('');
}
function chatComposerHTML(asAdmin, brandId) {
  const prods = S.allProducts.filter(p => p.brand_id === brandId);
  const draft = S.chat.draft || ''; S.chat.draft = '';
  return `<div class="chat-compose">
    ${asAdmin ? `<div class="chat-presets" aria-label="Frases rápidas">${CHAT_PRESETS.map(t => `<button type="button" class="chip" data-act="chatpreset" data-v="${esc(t)}" title="${esc(t)}">${esc(t.length > 36 ? t.slice(0, 34) + '…' : t)}</button>`).join('')}</div>` : ''}
    ${prods.length ? `<label class="chat-opts"><span>Sobre la prenda</span><select id="chat-prod"><option value="">Ninguna en concreto</option>${prods.map(p => `<option value="${esc(p.id)}"${p.id === S.chat.product ? ' selected' : ''}>${esc(p.name)}${p.status === 'pending' ? ' (en revisión)' : p.status === 'rejected' ? ' (rechazada)' : ''}</option>`).join('')}</select></label>` : ''}
    <div class="chat-input"><label class="sr" for="chat-text">Mensaje</label><textarea id="chat-text" rows="2" maxlength="2000" placeholder="Escribe un mensaje…">${esc(draft)}</textarea><button class="btn" data-act="chatsend">Enviar</button></div>
    <small class="muted chat-hint">Intro para enviar · Mayús + Intro para hacer un salto de línea</small>
  </div>`;
}
const chatMissingHTML = () => `<section class="card-box" style="max-width:760px"><h2 style="margin-bottom:10px">Activa los mensajes</h2>
  <p class="muted" style="margin-bottom:14px">Falta un paso en la base de datos para poder escribir a las marcas. Solo hay que hacerlo una vez:</p>
  <ol class="ksteps"><li>Abre Supabase &gt; <b>SQL Editor</b> &gt; <b>New query</b>.</li><li>Pega todo el archivo <b>supabase/mensajes.sql</b> y pulsa <b>Run</b>.</li><li>Vuelve aquí y recarga la página.</li></ol></section>`;

/* --- creador: lista de conversaciones + conversación abierta --- */
async function renderChatAdmin(box) {
  if (!S.adminUsers) { try { const r = await api.adminUsers(); S.adminUsers = r.list; S.adminUsersMissing = !!r.missing; } catch {} }
  const r = await api.chatList();
  if (S.adminTab !== 'mensajes') return;
  if (r.missing) { box.innerHTML = chatMissingHTML(); return; }
  const b = S.chat.brand, email = b ? chatBrandEmail(b) : '';
  const brands = new Map();
  (S.adminUsers || []).filter(u => u.role === 'brand').forEach(u => brands.set(u.id, u.brand_name || u.email || 'Marca'));
  S.allProducts.forEach(p => { if (!brands.has(p.brand_id)) brands.set(p.brand_id, p.brand); });
  const opts = [...brands.entries()].sort((x, y) => String(x[1]).localeCompare(String(y[1]), 'es'));
  const mail = email ? `mailto:${encodeURIComponent(email).replace('%40', '@')}?subject=${encodeURIComponent('Tienes un mensaje en ' + C.appName)}&body=${encodeURIComponent('Hola, equipo de ' + chatBrandName(b) + ':\n\nTe hemos escrito un mensaje en ' + C.appName + '. Puedes leerlo y contestar desde «Mensajes» en ' + baseUrl() + '#/mensajes\n\nUn saludo,\nEl equipo de ' + C.appName)}` : '';
  box.innerHTML = `<p class="muted" style="max-width:980px;margin-bottom:14px">Escribe a una marca cuando haya algo que corregir. Ella lo ve en «Mensajes» de su panel y te contesta aquí. Al rechazar una prenda, la marca también recibe aquí el motivo.</p>
    <div class="chat" data-has="${b ? 1 : 0}">
      <aside class="chat-side" aria-label="Conversaciones">
        <label class="chat-new"><span>Escribir a una marca</span><select id="chat-new"><option value="">Elige una marca…</option>${opts.map(([id, n]) => `<option value="${esc(id)}"${id === b ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        <ul class="chat-list" id="chat-list"></ul>
      </aside>
      <section class="chat-main" aria-label="Conversación">${b ? `
        <header class="chat-head"><button class="linkbtn chat-back" data-act="chatback">← Volver</button>
          <div class="ch-who"><b>${esc(chatBrandName(b))}</b><small>${esc(email || 'Sin correo')}</small></div>
          <div class="acts"><a class="btn ghost small" href="#/marca/${esc(b)}">Su página</a>${mail ? `<a class="btn ghost small" href="${esc(mail)}" title="Abre tu correo con un aviso para que entre a leerlo">Avisar por correo</a>` : ''}</div></header>
        <div class="chat-thread" id="chat-thread" aria-live="polite"><p class="muted" style="margin:auto">Cargando…</p></div>
        ${chatComposerHTML(true, b)}` : '<div class="chat-empty">Elige una conversación o escribe a una marca nueva.</div>'}</section>
    </div>`;
  fillChatSide(r.list);
  if (b) await loadChatThread(true);
}
async function fillChatSide(list) {
  const ul = $('#chat-list'); if (!ul) return;
  if (!list) { try { const r = await api.chatList(); list = r.list || []; } catch { return; } }
  const conv = new Map();
  list.forEach(m => {
    const c = conv.get(m.brand_id) || { id: m.brand_id, last: null, unread: 0 };
    if (!c.last || m.created_at > c.last.created_at) c.last = m;
    if (!m.from_admin && !m.read_at) c.unread++;
    conv.set(m.brand_id, c);
  });
  if (S.chat.brand && !conv.has(S.chat.brand)) conv.set(S.chat.brand, { id: S.chat.brand, last: null, unread: 0 });
  const rows = [...conv.values()].sort((a, b) => String(b.last ? b.last.created_at : '9999').localeCompare(String(a.last ? a.last.created_at : '9999')));
  ul.innerHTML = rows.length ? rows.map(c => `<li><button data-act="chatopen" data-id="${esc(c.id)}" aria-current="${c.id === S.chat.brand}">
      <b>${esc(chatBrandName(c.id))}</b>${c.unread ? `<span class="tabn" aria-label="${c.unread} sin leer">${c.unread}</span>` : ''}
      <small>${c.last ? (c.last.from_admin ? 'Tú: ' : '') + esc(c.last.body.slice(0, 70)) : 'Nueva conversación'}</small>
      ${c.last ? `<time>${madridDay(c.last.created_at) === madridDay(Date.now()) ? chatTime(c.last.created_at) : new Date(c.last.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</time>` : ''}</button></li>`).join('')
    : '<li class="muted chat-none">Aún no hay conversaciones. Elige una marca arriba para escribirle.</li>';
}
async function loadChatThread(forceBottom) {
  const el = $('#chat-thread'); if (!el || !S.chat.brand) return;
  const asAdmin = isAdmin(), brand = S.chat.brand;
  let msgs;
  try { msgs = await api.chatThread(brand); }
  catch (e) { el.innerHTML = `<div class="chat-empty">${e.message === 'FOUND_CHAT_MISSING' ? (asAdmin ? 'Falta ejecutar supabase/mensajes.sql en Supabase.' : 'Los mensajes aún no están activados. Vuelve a intentarlo más tarde.') : 'No se pudieron cargar los mensajes: ' + esc(e.message)}</div>`; return; }
  if (brand !== S.chat.brand || !$('#chat-thread')) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  const changed = JSON.stringify(msgs.map(m => [m.id, m.read_at])) !== JSON.stringify((S.chat.thread || []).map(m => [m.id, m.read_at]));
  S.chat.thread = msgs;
  if (changed || forceBottom) { el.innerHTML = chatThreadHTML(msgs, asAdmin); if (forceBottom || nearBottom) el.scrollTop = el.scrollHeight; }
  if (msgs.some(m => (asAdmin ? !m.from_admin : m.from_admin) && !m.read_at) && !document.hidden) {
    await api.chatRead(brand); refreshUnread(); if (asAdmin) fillChatSide();
  }
}
async function chatSend(btn) {
  const ta = $('#chat-text'); if (!ta || !S.chat.brand) return;
  const body = ta.value.trim(); if (!body) { ta.focus(); return; }
  const sel = $('#chat-prod'), pid = sel ? sel.value : '';
  btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    await api.chatSend(S.chat.brand, body, pid || null, isAdmin());
    ta.value = ''; S.chat.product = null; if (sel) sel.value = '';
    await loadChatThread(true); if (isAdmin()) fillChatSide();
  } catch (e) { toast('No se pudo enviar: ' + e.message); }
  btn.disabled = false; btn.textContent = 'Enviar'; ta.focus({ preventScroll: true });
}
// abre la conversación con una marca desde cualquier parte del panel (opcional: sobre una prenda y con un texto ya escrito)
function openChatWith(brandId, productId, text) {
  S.chat.brand = brandId; S.chat.product = productId || null; S.chat.draft = text || ''; S.chat.thread = [];
  S.adminTab = 'mensajes';
  if (S.route !== 'admin') go('admin'); else { renderAdminTab(); window.scrollTo(0, 0); }
  setTimeout(() => { const t = $('#chat-text'); if (t) { t.focus({ preventScroll: true }); t.setSelectionRange(t.value.length, t.value.length); } }, 400);
}
const chatBtn = (brandId, productId, label = 'Escribir a la marca', text = '') => `<button class="btn ghost small" data-act="chatto" data-id="${esc(brandId)}"${productId ? ` data-p="${esc(productId)}"` : ''}${text ? ` data-text="${esc(encodeURIComponent(text))}"` : ''}>${label}</button>`;

/* --- marca: su conversación con el creador --- */
VIEWS.mensajes = async () => {
  if (!S.user) { toast('Entra con tu cuenta de marca.'); S.authMode = 'in'; return go('entrar'); }
  if (isAdmin()) { S.adminTab = 'mensajes'; return go('admin'); }
  if (!isBrand()) { view.innerHTML = '<div class="wrap page has-tabbar"><div class="empty">Los mensajes son para las marcas de ' + esc(C.appName) + '.</div></div>'; return; }
  S.chat.brand = S.user.id; S.chat.thread = [];
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="pagehead"><div><span class="eyebrow">Panel de marca</span><h1 style="margin-top:12px">Mensajes</h1><p class="muted">Tu conversación con el equipo de ${esc(C.appName)}: avisos sobre tus prendas, dudas y sugerencias.</p></div>
      <a class="btn ghost small" href="#/panel">Volver a mi panel</a></div>
    <div class="chat solo"><section class="chat-main" aria-label="Conversación con ${esc(C.appName)}">
      <header class="chat-head"><div class="ch-who"><b>Equipo de ${esc(C.appName)}</b><small>Te contestamos lo antes posible</small></div></header>
      <div class="chat-thread" id="chat-thread" aria-live="polite"><p class="muted" style="margin:auto">Cargando…</p></div>
      ${chatComposerHTML(false, S.user.id)}</section></div></div>`;
  await loadChatThread(true);
};

/* --- avisos de mensajes nuevos: al momento (Supabase Realtime) y, por si acaso, cada 30 s --- */
let chatTimer = 0;
async function refreshUnread() {
  if (!S.user || !(isBrand() || isAdmin()) || !api.chatUnread) { S.unread = 0; return; }
  let n = 0; try { n = await api.chatUnread(isAdmin()); } catch {}
  S.unread = n;
  $$('[data-unread]').forEach(x => { x.textContent = n; x.hidden = !n; });
  const tab = $('[data-act="admintab"][data-v="mensajes"]'); if (tab) tab.innerHTML = 'Mensajes' + (n ? ` <span class="tabn">${n}</span>` : '');
  const pb = $('#panel-msgs'); if (pb) pb.innerHTML = panelMsgsHTML();
}
function onChatPing() {
  refreshUnread();
  if (!chatOnScreen()) return;
  if (S.route === 'admin') fillChatSide();
  loadChatThread(false);
}
function stopChatWatch() { clearInterval(chatTimer); chatTimer = 0; if (api.chatUnsubscribe) api.chatUnsubscribe(); S.unread = 0; }
function startChatWatch() {
  stopChatWatch();
  if (!S.user || !(isBrand() || isAdmin()) || !api.chatUnread) return;
  refreshUnread();
  chatTimer = setInterval(() => { if (!document.hidden) onChatPing(); }, 30000);
  if (api.chatSubscribe) api.chatSubscribe(onChatPing);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && chatTimer) onChatPing(); });
// en el panel de la marca: aviso de mensajes nuevos
const panelMsgsHTML = () => S.unread
  ? `<a class="msgalert" href="#/mensajes"><b>${S.unread === 1 ? 'Tienes 1 mensaje nuevo' : `Tienes ${S.unread} mensajes nuevos`} de ${esc(C.appName)}</b><span>Leer y contestar →</span></a>`
  : '';
document.addEventListener('keydown', e => {
  if (e.target.id !== 'chat-text' || e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  e.preventDefault(); const b = $('[data-act="chatsend"]'); if (b && !b.disabled) chatSend(b);
});
document.addEventListener('change', e => {
  if (e.target.id === 'chat-new' && e.target.value) openChatWith(e.target.value);
  if (e.target.id === 'chat-prod') S.chat.product = e.target.value || null;
});

/* --- Vuelta desde Stripe tras pagar --- */
VIEWS.pago = async () => {
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="card-box payok" id="payok"><div class="spinner" aria-hidden="true"></div><h1>¡Gracias!</h1><p class="muted">Estamos activando tu suscripción. Tarda solo unos segundos.</p></div></div>`;
  if (!S.user) { $('#payok').innerHTML = '<h1>¡Pago recibido!</h1><p class="muted">Entra con tu cuenta de marca para empezar a publicar. Si aún no has confirmado tu correo, hazlo primero.</p><a class="btn" href="#/entrar">Entrar</a>'; return; }
  for (let i = 0; i < 15 && S.route === 'pago'; i++) {
    await refreshBilling();
    if (subActive(S.billing)) { await refreshProducts(); toast('Suscripción activada. Ya puedes publicar.'); return go('panel'); }
    await new Promise(r => setTimeout(r, 2000));
  }
  if (S.route === 'pago') $('#payok').innerHTML = '<h1>Casi está</h1><p class="muted">Stripe aún no nos ha confirmado el pago. Suele tardar menos de un minuto; vuelve a tu panel en un momento. Si no se activa, escríbenos.</p><a class="btn" href="#/panel">Ir a mi panel</a>';
};

/* --- Panel de marca --- */
VIEWS.panel = async () => {
  if (!S.user) { toast('Entra con una cuenta de marca para ver tu panel.'); S.authMode = 'up'; S.authRole = 'brand'; return go('entrar'); }
  if (!isBrand()) { view.innerHTML = '<div class="wrap page has-tabbar"><div class="empty">Tu cuenta es de comprador. Para vender, crea una cuenta de marca con otro correo.</div></div>'; return; }
  try { S.counts = await api.saveCounts(S.user.id); } catch { S.counts = {}; }
  try { S.ev = api.eventCounts ? await api.eventCounts(S.statsDays) : null; } catch { S.ev = null; }
  await refreshBilling();
  await refreshUnread();
  renderPanel();
};
function subStatusBox() {
  const b = S.billing;
  if (!b || b.missing) return '';
  let line;
  if (b.manual && !['active', 'trialing', 'past_due'].includes(b.status)) line = 'Activada por ' + esc(C.appName);
  else if (b.status === 'past_due') line = '<span class="warn">No hemos podido cobrar el último mes.</span> Stripe lo reintentará; revisa tu tarjeta.';
  else if (b.cancel_at_period_end && b.current_period_end) line = 'Se cancelará el ' + fmtDate(b.current_period_end) + '. Hasta entonces todo sigue igual.';
  else line = (subPrice() ? money(subPrice()) + ' al mes' : 'Mensual') + (b.current_period_end ? ' · se renueva el ' + fmtDate(b.current_period_end) : '');
  const portal = isUrl(BILL().portal) ? `<a class="btn ghost small" href="${esc(BILL().portal)}" target="_blank" rel="noopener noreferrer">Gestionar suscripción</a>` : '';
  return `<div class="substatus"><span class="dot"></span><div><b>Suscripción activa</b><small>${line}</small></div>${portal}</div>`;
}
function paywallHTML() {
  const b = S.billing;
  const was = b && (b.status === 'canceled' || b.status === 'unpaid')
    ? `<p class="pw-note">Tu suscripción terminó${b.current_period_end ? ' el ' + fmtDate(b.current_period_end) : ''}. Tus prendas siguen guardadas, pero no se muestran hasta que la renueves.</p>`
    : b && b.status === 'incomplete' ? '<p class="pw-note">El pago no se completó. Vuelve a intentarlo.</p>' : '';
  return `<section class="card-box paywall" aria-label="Suscripción">
    <span class="eyebrow">Último paso</span>
    <h2>${T('plan.title', 'Activa tu suscripción mensual')}</h2>
    <p class="muted">${T('plan.text', 'Para publicar tus prendas en ' + C.appName + ' necesitas la suscripción de marca. Se cobra cada mes y puedes cancelarla cuando quieras.')}</p>
    ${was}
    <div class="pw-price">${subPrice() ? `<b>${money(subPrice())}</b><span>al mes · IVA incluido</span>` : '<b>Mensual</b>'}</div>
    <ul class="pw-list">${PLAN_FEATURES().map(f => `<li>${f}</li>`).join('')}</ul>
    <div class="pw-acts">${payButton('Pagar y activar')}<button class="btn ghost" data-act="checkpay">Ya he pagado</button></div>
    <p class="muted" style="font-size:13px">Pago seguro con Stripe. Al terminar vuelves aquí y tu cuenta se activa sola en unos segundos.</p>
  </section>`;
}
function renderPanel() {
  const mine = S.allProducts.filter(p => p.brand_id === S.user.id);
  const saves = mine.reduce((a, p) => a + (S.counts[p.id] || 0), 0);
  const evOf = p => (S.ev && S.ev[p.id]) || { views: 0, buys: 0 };
  const views = mine.reduce((a, p) => a + evOf(p).views, 0), buys = mine.reduce((a, p) => a + evOf(p).buys, 0);
  const maxV = Math.max(1, ...mine.map(p => evOf(p).views));
  if (S.ev) mine.sort((a, b) => evOf(b).views - evOf(a).views);
  const ed = S.editing ? mine.find(p => p.id === S.editing) : null;
  const d = S.draft && S.draft.form ? S.draft.form : (ed ? { name: ed.name, price: ed.price, cat: ed.cat, color: ed.color, desc: ed.desc, buy_url: ed.buy_url } : { name: '', price: '', cat: C.categories[0], color: '#E6335F', desc: '', buy_url: '' });
  const act = isActiveBrand();
  view.innerHTML = `<div class="wrap page has-tabbar"><div class="pagehead"><div><span class="eyebrow">Panel de marca</span><h1 style="margin-top:12px">${esc(S.profile.brand_name || 'Tu marca')}</h1><p class="muted">Sube productos y mira cómo responden los compradores.${modOn() && !S.modMissing ? ' Cada prenda nueva la revisamos antes de mostrarla.' : ''}</p></div>
      <div class="ph-acts"><a class="btn ghost small" href="#/mensajes">Mensajes <span class="tabn" data-unread${S.unread ? '' : ' hidden'}>${S.unread}</span></a><a class="btn ghost small" href="#/marca/${esc(S.user.id)}">Ver mi página pública</a></div></div>
    <div id="panel-msgs">${panelMsgsHTML()}</div>
    ${act && billingOn() ? subStatusBox() : ''}
    <div class="panel${act ? ' act' : ''}${ed ? ' editing' : ''}">
      <div style="display:grid;gap:22px">
        ${act ? '' : paywallHTML()}
        <section class="card-box" aria-label="Producto"${act ? '' : ' hidden'}>
          <h2 style="margin-bottom:14px">${ed ? 'Editar producto' : 'Sube un producto'}</h2>
          <label class="field"><span>Nombre del producto</span><input type="text" id="f-name" maxlength="80" value="${esc(d.name)}" placeholder="Ej. Camisa oversize lino"></label>
          <div class="row2">
            <label class="field"><span>Precio (${esc(C.currency)})</span><input type="number" id="f-price" min="0.5" step="0.5" value="${esc(d.price)}"></label>
            <label class="field"><span>Categoría</span><select id="f-cat">${C.categories.map(c => `<option${c === d.cat ? ' selected' : ''}>${esc(c)}</option>`).join('')}</select></label>
          </div>
          <div class="field"><span>Tallas disponibles</span><div id="f-sizes">${formSizesHTML(d.cat)}</div></div>
          <div class="field"><span>Etiquetas de estilo (elige las que describan la prenda)</span>
            <div class="chips">${C.styles.map(s => `<button type="button" class="chip" data-act="ft" data-v="${esc(s)}" aria-pressed="${S.formTags.includes(s)}">${esc(s)}</button>`).join('')}</div></div>
          <div class="field"><span>Fotos de la prenda (hasta ${MAX_PHOTOS})</span><div id="f-photos">${photosHTML()}</div></div>
          <label class="field"><span>Color de la prenda (para la ilustración)</span><input type="color" id="f-color" value="${esc(d.color)}"></label>
          <label class="field"><span>Descripción</span><textarea id="f-desc" maxlength="500" placeholder="Materiales, corte, cómo se cuida…">${esc(d.desc)}</textarea></label>
          <label class="field"><span>Enlace para comprar (tu tienda online)</span><input type="url" id="f-buy" value="${esc(d.buy_url)}" placeholder="https://tutienda.com/producto"></label>
          <p class="msg" id="fmsg" role="alert"></p>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="fsend" data-act="publish">${ed ? 'Guardar cambios' : 'Publicar producto'}</button>${ed ? '<button class="btn ghost" data-act="canceledit">Cancelar</button>' : ''}</div>
        </section>
        <section class="card-box" aria-label="Perfil de marca">
          <h2 style="margin-bottom:14px">Perfil de marca</h2>
          <div class="brandprev" aria-label="Vista previa de la cabecera de tu página">
            <div class="bp-cover" id="bp-cover">${S.profile.cover_url ? `<img src="${esc(S.profile.cover_url)}" alt="">` : '<span>Tu portada</span>'}</div>
            <div class="bp-row"><span class="bp-logo" id="bp-logo">${S.profile.logo_url ? `<img src="${esc(S.profile.logo_url)}" alt="">` : esc((S.profile.brand_name || '?').trim().charAt(0).toUpperCase())}</span><b id="bp-name">${esc(S.profile.brand_name || 'Tu marca')}</b></div>
          </div>
          <div class="row2">
            <div class="field"><span>Logo</span><input type="file" id="p-logo" accept="image/png,image/jpeg,image/webp">
              <small class="muted">Cuadrado, mínimo 300 × 300 px. Un PNG con fondo transparente queda mejor.</small>
              ${S.profile.logo_url ? '<button type="button" class="linkbtn" data-act="rmimg" data-v="logo">Quitar logo</button>' : ''}</div>
            <div class="field"><span>Foto de portada</span><input type="file" id="p-cover" accept="image/png,image/jpeg,image/webp">
              <small class="muted">Horizontal, mínimo 1600 × 600 px. Se recorta para adaptarse a cada pantalla.</small>
              ${S.profile.cover_url ? '<button type="button" class="linkbtn" data-act="rmimg" data-v="cover">Quitar portada</button>' : ''}</div>
          </div>
          <label class="field"><span>Nombre de la marca</span><input type="text" id="p-brand" maxlength="60" value="${esc(S.profile.brand_name || '')}"></label>
          <label class="field"><span>Correo de contacto público</span><input type="email" id="p-contact" value="${esc(S.profile.contact_email || '')}"></label>
          <label class="field"><span>Quiénes sois</span><textarea id="p-bio" maxlength="300">${esc(S.profile.brand_bio || '')}</textarea></label>
          <p class="msg" id="pmsg" role="alert"></p>
          <button class="btn ghost" id="psave" data-act="saveprofile">Guardar perfil</button>
        </section>
      </div>
      <section class="card-box" aria-label="Tus productos">
        <h2 style="margin-bottom:14px">Tus productos</h2>
        <div class="statshead"><span class="muted">Estadísticas</span><div class="seg mini" role="group" aria-label="Periodo">${[['7', '7 días'], ['30', '30 días'], ['all', 'Siempre']].map(([v, l]) => `<button data-act="statsdays" data-v="${v}" aria-pressed="${String(S.statsDays || 'all') === v}">${l}</button>`).join('')}</div></div>
        <div class="stats four">
          <div class="stat hl"><b>${S.ev ? views : '—'}</b><span>${views === 1 ? 'clic' : 'clics'} en tus prendas</span></div>
          <div class="stat hl"><b>${S.ev ? buys : '—'}</b><span>${buys === 1 ? 'visita' : 'visitas'} a tu tienda</span></div>
          <div class="stat"><b>${saves}</b><span>guardados <small>(siempre)</small></span></div>
          <div class="stat"><b>${mine.length}</b><span>productos</span></div>
        </div>
        ${S.ev && views ? `<p class="conv">El <b>${Math.round(buys / views * 100)} %</b> de los clics acaban en tu tienda.</p>` : S.ev ? '<p class="conv muted">Los clics aparecerán aquí cuando los compradores abran tus prendas.</p>' : ''}
        <div class="plist">${mine.length ? mine.map(p => `<div class="pitem"><div class="th" style="background:${tileBg(p)}">${pic(p)}</div>
          <div><b>${esc(p.name)}</b>${p.status === 'pending' ? '<span class="stag pend">En revisión</span>' : p.status === 'rejected' ? `<span class="stag rej">Rechazada${p.reason ? ': ' + esc(p.reason) : ''}</span><span class="stag-help">Corrígela con «Editar» y se volverá a revisar. ¿Dudas? <a href="#/mensajes">Escríbenos</a>.</span>` : ''}<small>${S.ev ? `<span class="num">${evOf(p).views}</span> ${evOf(p).views === 1 ? 'clic' : 'clics'} · <span class="num">${evOf(p).buys}</span> a tu tienda · ` : ''}${S.counts[p.id] || 0} ${(S.counts[p.id] || 0) === 1 ? 'guardado' : 'guardados'} · ${money(p.price)}${p.sizes.length ? '' : ' · <span class="nosz">sin tallas: edítala y añádelas</span>'}</small>${S.ev ? `<span class="vbar" aria-hidden="true"><i style="width:${Math.round(evOf(p).views / maxV * 100)}%"></i></span>` : ''}</div>
          <div class="acts">${act ? `<button class="btn ghost small" data-act="edit" data-id="${esc(p.id)}">Editar</button>` : ''}<button class="btn ghost small" data-act="del" data-id="${esc(p.id)}" aria-label="Eliminar ${esc(p.name)}">Eliminar</button></div></div>`).join('') : (act ? '<div class="empty">Aún no tienes productos. Sube el primero con el formulario.</div>' : '<div class="empty">Cuando actives la suscripción podrás subir tus prendas.</div>')}</div>
        ${!act && mine.length ? '<p class="muted" style="font-size:13px;margin-top:12px">Estas prendas no se muestran a los compradores hasta que actives la suscripción.</p>' : ''}
      </section>
    </div></div>`;
}
function formSizesHTML(cat) {
  const k = sizeKind(cat);
  const hint = k === 'pie' ? 'Tallas europeas. Marca solo las que tienes en stock.' : k === 'uni' ? 'Si es de talla única, marca «Talla única».' : 'Marca solo las tallas que tienes en stock.';
  return `<div class="chips">${sizeOptions(cat).map(s => `<button type="button" class="chip" data-act="fz" data-v="${esc(s)}" aria-pressed="${S.formSizes.includes(s)}">${s === SIZE_UNI ? 'Talla única' : esc(s)}</button>`).join('')}</div><small class="muted">${hint} Los compradores pueden filtrar por su talla.</small>`;
}
// al cambiar la categoría, cambian las tallas que se pueden elegir
document.addEventListener('change', e => {
  if (e.target.id !== 'f-cat') return;
  const cat = e.target.value, ok = sizeOptions(cat);
  S.formSizes = S.formSizes.filter(s => ok.includes(s));
  if (!S.formSizes.length && sizeKind(cat) === 'uni') S.formSizes = [SIZE_UNI];
  const box = $('#f-sizes'); if (box) box.innerHTML = formSizesHTML(cat);
});
function readForm() {
  return { name: $('#f-name').value.trim(), price: parseFloat($('#f-price').value), cat: $('#f-cat').value, color: $('#f-color').value, desc: $('#f-desc').value.trim(), buy_url: $('#f-buy').value.trim() };
}
/* ---------- fotos de la prenda (hasta MAX_PHOTOS; la primera es la portada) ---------- */
function photosHTML() {
  const L = S.formPhotos;
  const items = L.map((x, i) => `<li class="ph${i === 0 ? ' first' : ''}"><img src="${esc(x.url || x.preview)}" alt="Foto ${i + 1}">
    ${i === 0 ? '<span class="phbadge">Portada</span>' : `<button type="button" class="phcover" data-act="phfirst" data-v="${i}">Hacer portada</button>`}
    <button type="button" class="phrm" data-act="phrm" data-v="${i}" aria-label="Quitar la foto ${i + 1}">×</button></li>`).join('');
  const add = L.length < MAX_PHOTOS ? `<li><label class="phadd"><input type="file" id="f-imgs" accept="image/png,image/jpeg,image/webp" multiple class="sr"><span aria-hidden="true">+</span><small>${L.length ? 'Añadir más' : 'Añadir fotos'}</small></label></li>` : '';
  return `<ul class="phgrid">${items}${add}</ul><small class="muted">${L.length}/${MAX_PHOTOS} · La primera es la portada. Mejor fotos verticales y con luz natural: de frente, de espalda, un detalle y la prenda puesta.${L.length ? '' : ' Sin fotos se mostrará una ilustración del color elegido.'}</small>`;
}
function refreshPhotos() { const w = $('#f-photos'); if (w) w.innerHTML = photosHTML(); }
function clearPhotos() { S.formPhotos.forEach(x => x.preview && URL.revokeObjectURL(x.preview)); S.formPhotos = []; }
function addPhotos(files) {
  let skipped = 0, bad = 0;
  for (const f of files) {
    if (!/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 15e6) { bad++; continue; }
    if (S.formPhotos.length >= MAX_PHOTOS) { skipped++; continue; }
    S.formPhotos.push({ file: f, preview: URL.createObjectURL(f) });
  }
  refreshPhotos();
  if (bad) toast('Algunas fotos no se han añadido: tienen que ser PNG, JPG o WEBP de menos de 15 MB.');
  else if (skipped) toast(`Como máximo ${MAX_PHOTOS} fotos por prenda.`);
}

async function publish() {
  const m = $('#fmsg'), btn = $('#fsend'); m.className = 'msg';
  const f = readForm(), photos = S.formPhotos.slice(0, MAX_PHOTOS), newPics = photos.filter(x => x.file).length;
  const bad = t => { m.classList.add('err'); m.textContent = t; };
  if (!f.name) return bad('Escribe el nombre del producto.');
  if (!(f.price > 0)) return bad('Indica un precio mayor que 0.');
  if (!S.formSizes.length) return bad('Marca las tallas que tienes disponibles (o «Talla única»).');
  if (!S.formTags.length) return bad('Elige al menos una etiqueta de estilo: así te encuentran los compradores adecuados.');
  if (f.buy_url && !isUrl(f.buy_url)) return bad('El enlace debe empezar por http:// o https://');
  if (!isHex(f.color)) return bad('El color no es válido.');
  const ed = S.editing ? findProduct(S.editing) : null;
  btn.disabled = true; btn.textContent = newPics ? (newPics === 1 ? 'Subiendo foto…' : `Subiendo ${newPics} fotos…`) : 'Guardando…';
  try {
    const r = await api.saveProduct(S.user.id, { ...f, tags: [...S.formTags], sizes: sortSizes(S.formSizes) }, photos, ed ? ed.id : null);
    await refreshProducts();
    S.editing = null; S.formTags = []; S.formSizes = []; S.draft = null; clearPhotos();
    const saved = ed ? findProduct(ed.id) : S.allProducts.filter(p => p.brand_id === S.user.id).sort((a, b) => String(b.created).localeCompare(String(a.created)))[0];
    const pending = saved && saved.status === 'pending';
    toast(r && r.imagesSkipped && photos.length > 1 ? 'Guardado solo con la primera foto: para guardar varias fotos falta ejecutar supabase/fotos.sql en Supabase.'
      : r && r.sizesSkipped ? 'Guardado, pero sin tallas: falta activar las tallas en la base de datos (tallas.sql).'
      : pending ? (ed ? 'Cambios guardados. La prenda vuelve a revisión antes de mostrarse.' : 'Prenda enviada. Se publicará en cuanto la revisemos.')
      : ed ? 'Cambios guardados' : 'Producto publicado. Ya aparece en el feed.');
    VIEWS.panel();
  } catch (e) { bad('No se pudo guardar: ' + e.message); btn.disabled = false; btn.textContent = ed ? 'Guardar cambios' : 'Publicar producto'; }
}

/* ==========================================================
   MODO EDICIÓN (solo creador)
   ========================================================== */
const pendingCount = () => Object.keys(S.textDraft).length + (S.colorDraft ? 1 : 0) + (S.resetTexts ? 1 : 0);
function renderEditBar() {
  let bar = $('#editbar');
  if (!isAdmin()) { if (bar) bar.remove(); document.body.classList.remove('editing'); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'editbar'; document.body.appendChild(bar); }
  document.body.classList.toggle('editing', S.editMode);
  if (!S.editMode) { bar.className = 'editfab'; bar.innerHTML = '<button class="btn dark small" data-act="editon" aria-label="Editar la web" title="Editar la web"><span aria-hidden="true">✎</span><span class="lbl"> Editar la web</span></button>'; return; }
  const n = pendingCount(), cd = S.colorDraft || { ...COLOR_DEFAULTS, ...((S.settings && S.settings.colors) || {}) };
  if (!isHex(cd.accent) && S.settings && isHex(S.settings.accent)) cd.accent = S.settings.accent;
  bar.className = 'editbar';
  bar.innerHTML = `${S.colorsOpen ? `<div class="colpanel" role="group" aria-label="Colores">
      <div class="colhead"><b>Colores</b><button class="linkbtn" data-act="colreset">Volver a los originales</button></div>
      ${COLOR_FIELDS.map(([k, l, h]) => `<label class="colrow"><input type="color" id="c-${k}" data-col="${k}" value="${isHex(cd[k]) ? cd[k] : COLOR_DEFAULTS[k]}"><span><b>${l}</b><small>${h}</small></span></label>`).join('')}
    </div>` : ''}
    <div class="editrow">
      <span class="edinfo"><b>Modo edición</b><span>Pulsa un texto con borde discontinuo para cambiarlo. Escribe *así* para la cursiva.</span></span>
      <div class="edacts">
        <button class="btn ghost small" data-act="colors" aria-pressed="${S.colorsOpen}">Colores</button>
        <button class="btn ghost small" data-act="textreset">Textos originales</button>
        <button class="btn ghost small" data-act="discard"${n ? '' : ' disabled'}>Descartar</button>
        <button class="btn small" data-act="publishedits"${n ? '' : ' disabled'}>Publicar${n ? ' (' + n + ')' : ''}</button>
        <button class="btn ghost small" data-act="editoff" aria-label="Salir del modo edición">Salir</button>
      </div>
    </div>`;
}
function rerender() { const y = window.scrollY; route(); window.scrollTo(0, y); }
async function publishEdits() {
  const prev = S.settings || {};
  const texts = { ...(S.resetTexts ? {} : (prev.texts || {})) };
  Object.entries(S.textDraft).forEach(([k, v]) => { if (v === TEXT_DEF[k]) delete texts[k]; else texts[k] = v; });
  const colors = S.colorDraft ? { ...S.colorDraft } : { ...(prev.colors || {}) };
  Object.keys(colors).forEach(k => { if (!isHex(colors[k]) || colors[k].toLowerCase() === (COLOR_DEFAULTS[k] || '').toLowerCase()) delete colors[k]; });
  const v = { ...prev, texts, colors };
  if (colors.accent) v.accent = colors.accent; else delete v.accent;
  try {
    await api.saveSettings(v); applySettings(v);
    S.textDraft = {}; S.colorDraft = null; S.resetTexts = false;
    renderNav(); rerender(); toast('Cambios publicados. Ya los ve todo el mundo.');
  } catch (e) { toast('No se pudieron publicar: ' + e.message); }
}
// al pulsar un texto editable no se navega ni se activa el botón que lo contiene
document.addEventListener('click', e => {
  if (!S.editMode) return;
  const ed = e.target.closest('[data-ed]');
  if (ed) { e.preventDefault(); e.stopPropagation(); if (document.activeElement !== ed) ed.focus(); }
}, true);
document.addEventListener('focusin', e => {
  const ed = e.target.closest && e.target.closest('[data-ed]'); if (!ed) return;
  ed.textContent = rawText(ed.dataset.ed);
});
document.addEventListener('focusout', e => {
  const ed = e.target.closest && e.target.closest('[data-ed]'); if (!ed) return;
  const k = ed.dataset.ed, val = ed.innerText.replace(/\s+/g, ' ').trim();
  const saved = (!S.resetTexts && S.settings && S.settings.texts && S.settings.texts[k]) || TEXT_DEF[k];
  if (!val || val === saved) delete S.textDraft[k]; else S.textDraft[k] = val;
  $$(`[data-ed="${k}"]`).forEach(x => { x.innerHTML = fmtText(rawText(k)); });
  renderEditBar();
});
document.addEventListener('keydown', e => {
  const ed = e.target.closest && e.target.closest('[data-ed]'); if (!ed) return;
  if (e.key === 'Enter') { e.preventDefault(); ed.blur(); }
  if (e.key === 'Escape') { e.preventDefault(); ed.textContent = rawText(ed.dataset.ed); ed.blur(); }
  if (e.key === ' ') e.stopPropagation();
});
document.addEventListener('keyup', e => { if (e.target.closest && e.target.closest('[data-ed]') && e.key === ' ') e.preventDefault(); }, true);
document.addEventListener('paste', e => {
  const ed = e.target.closest && e.target.closest('[data-ed]'); if (!ed) return;
  e.preventDefault();
  const t = (e.clipboardData || window.clipboardData).getData('text').replace(/\s+/g, ' ');
  document.execCommand('insertText', false, t);
});
document.addEventListener('input', e => {
  const k = e.target.dataset && e.target.dataset.col; if (!k) return;
  if (!S.colorDraft) S.colorDraft = { ...COLOR_DEFAULTS, ...((S.settings && S.settings.colors) || {}) };
  S.colorDraft[k] = e.target.value; applyColors(S.colorDraft);
  const pb = $('[data-act="publishedits"]'); if (pb) { pb.disabled = false; pb.textContent = 'Publicar (' + pendingCount() + ')'; }
  const db = $('[data-act="discard"]'); if (db) db.disabled = false;
});

/* ==========================================================
   DETALLE
   ========================================================== */
const dlg = $('#dlg');
function openProduct(id) {
  const p = S.products.find(x => x.id === id) || findProduct(id); if (!p) return;
  track(p.id, 'view'); logSite('page', 'prenda');
  const m = matchPct(p), fav = S.favs.has(p.id), fit = fitsMe(p);
  const sim = q => q.tags.filter(t => p.tags.includes(t)).length * 2 + (q.cat === p.cat ? 1 : 0) + (q.brand_id === p.brand_id ? 1 : 0);
  const related = S.products.filter(q => q.id !== p.id && sim(q) > 0).sort((a, b) => sim(b) - sim(a) || (matchPct(b) || 0) - (matchPct(a) || 0)).slice(0, 4);
  const buy = isUrl(p.buy_url)
    ? `<a class="btn" href="${esc(p.buy_url)}" target="_blank" rel="noopener noreferrer" data-track="buy" data-id="${esc(p.id)}">Comprar en la tienda de ${esc(p.brand)}</a>`
    : (p.contact ? `<a class="btn" data-track="buy" data-id="${esc(p.id)}" href="mailto:${esc(p.contact)}?subject=${encodeURIComponent('Me interesa: ' + p.name)}">Preguntar a ${esc(p.brand)}</a>` : '<span class="muted">Esta marca aún no ha añadido un enlace de compra.</span>');
  dlg.innerHTML = `<div style="position:relative"><button class="close" data-act="closeDlg" aria-label="Cerrar">×</button>
    <div class="dgrid"><div class="art" style="background:${tileBg(p)}">${galleryHTML(p)}${m !== null ? `<span class="hang">${m} % para ti</span>` : ''}</div>
    <div class="dinfo">
      <a href="#/marca/${esc(p.brand_id)}" data-act="closeDlg" class="muted dbrand">${miniLogo(p.logo)}${esc(p.brand)}</a>
      <h2>${esc(p.name)}</h2><div class="price">${money(p.price)}</div>
      <div class="chips" style="gap:6px">${p.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}<span class="tag">${esc(p.cat)}</span></div>
      ${p.sizes.length ? `<div class="szbox"><b>Tallas disponibles</b><div class="szlist">${sizeChips(p)}</div>
        ${fit === false ? `<small>No queda en tu talla (${esc(mySizesFor(p.cat).join(' · '))}).</small>` : !hasSizes() && sizeKind(p.cat) !== 'uni' ? '<small><button class="linkbtn" data-act="gustos">Añade tu talla</button> y te diremos si te vale.</small>' : ''}</div>` : ''}
      ${m !== null ? `<div class="why"><b>Por qué encaja contigo</b><span>${[
        ...p.tags.filter(t => S.taste.styles.includes(t)).map(t => '✓ ' + esc(t)),
        S.taste.cats.includes(p.cat) ? '✓ Buscas ' + esc(p.cat.toLowerCase()) : '',
        p.price <= S.taste.budget ? '✓ Dentro de tu presupuesto' : '· Por encima de tu presupuesto',
        fit === true ? '✓ Hay tu talla' : fit === false ? '· No hay tu talla' : ''
      ].filter(Boolean).join('<br>')}</span></div>` : ''}
      <p class="grow">${esc(p.desc || 'Sin descripción todavía.')}</p>
      ${buy}
      <div class="dacts"><button class="btn ghost" data-act="fav" data-id="${esc(p.id)}" aria-pressed="${fav}">${fav ? 'Quitar de guardados' : 'Guardar'}</button>
        <button class="btn ghost" data-act="share" data-v="p" data-id="${esc(p.id)}">${ICON.share} Compartir</button></div>
      ${isAdmin() || (S.user && S.user.id === p.brand_id) ? '' : `<div class="repwrap" id="repbox"><button class="linkbtn replink" data-act="report" data-id="${esc(p.id)}">Denunciar esta prenda</button></div>`}
    </div></div>
    ${related.length ? `<div class="related"><h3>También te puede gustar</h3><div class="rgrid">${related.map(r => `<button data-act="open" data-id="${esc(r.id)}" aria-label="Ver ${esc(r.name)}"><span class="rt" style="background:${tileBg(r)}">${pic(r)}</span><span class="rn">${esc(r.name)}</span><span class="rp">${money(r.price)}</span></button>`).join('')}</div></div>` : ''}</div>`;
  if (!dlg.open) dlg.showModal(); else dlg.scrollTop = 0;
  initGallery();
}
/* galería de la ficha: se desliza con el dedo; en el ordenador, con flechas y miniaturas */
function galleryHTML(p) {
  if (p.images.length < 2) return pic(p, p.name);
  const n = p.images.length;
  return `<div class="gal" data-n="${n}"><div class="gtrack" tabindex="0" aria-label="Fotos de ${esc(p.name)}">${p.images.map((u, i) => `<img src="${esc(u)}" alt="${esc(p.name)}, foto ${i + 1} de ${n}"${i ? ' loading="lazy"' : ''}>`).join('')}</div>
    <button type="button" class="gnav gprev" data-act="gal" data-v="-1" aria-label="Foto anterior">${ICON.left}</button><button type="button" class="gnav gnext" data-act="gal" data-v="1" aria-label="Foto siguiente">${ICON.right}</button>
    <span class="gcount" aria-live="polite">1 / ${n}</span>
    <div class="gthumbs">${p.images.map((u, i) => `<button type="button" data-act="galto" data-v="${i}" aria-label="Ver foto ${i + 1}"${i ? '' : ' aria-current="true"'}><img src="${esc(u)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
}
function initGallery() {
  const g = dlg.querySelector('.gal'); if (!g) return;
  const t = g.querySelector('.gtrack'), n = +g.dataset.n;
  const sync = () => { const i = Math.round(t.scrollLeft / t.clientWidth); g.querySelector('.gcount').textContent = (i + 1) + ' / ' + n; g.querySelectorAll('.gthumbs button').forEach((b, k) => b.toggleAttribute('aria-current', k === i)); g.classList.toggle('atstart', i === 0); g.classList.toggle('atend', i === n - 1); };
  t.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); galGo(e.key === 'ArrowRight' ? 1 : -1); } });
  sync();
}
function galGo(d, abs) {
  const t = dlg.querySelector('.gtrack'); if (!t) return;
  const i = abs ? d : Math.round(t.scrollLeft / t.clientWidth) + d;
  t.scrollTo({ left: Math.max(0, i) * t.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
}
dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

/* ---------- denunciar una prenda ---------- */
function openReportForm(id) {
  const box = $('#repbox'); if (!box) return;
  box.innerHTML = `<form class="repform" onsubmit="return false"><b>¿Qué pasa con esta prenda?</b>
    ${Object.entries(REPORT_REASONS).map(([k, l], i) => `<label class="rrow"><input type="radio" name="rreason" value="${k}"${i === 0 ? ' checked' : ''}> <span>${esc(l)}</span></label>`).join('')}
    <label class="field" style="margin:8px 0 10px"><span>Cuéntanos algo más (opcional)</span><textarea id="rdetails" maxlength="500" placeholder="Ej. Es una copia de la marca X"></textarea></label>
    <p class="msg" id="rmsg" role="alert"></p>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn small" data-act="sendreport" data-id="${esc(id)}">Enviar aviso</button><button type="button" class="btn ghost small" data-act="open" data-id="${esc(id)}">Cancelar</button></div>
    <small class="muted">Lo revisamos y, si incumple las normas, la retiramos. No le decimos a la marca quién ha avisado.</small></form>`;
  box.querySelector('input').focus();
}
async function sendReport(id, btn) {
  const reason = ($('input[name="rreason"]:checked') || {}).value, details = ($('#rdetails') || {}).value || '';
  const m = $('#rmsg'); btn.disabled = true; btn.textContent = 'Enviando…';
  try { await api.reportProduct(id, reason, details.trim()); $('#repbox').innerHTML = '<p class="repdone">Gracias por avisar. Lo revisaremos pronto.</p>'; }
  catch (e) { m.className = 'msg err'; m.textContent = e.message; btn.disabled = false; btn.textContent = 'Enviar aviso'; }
}

/* ==========================================================
   COMPARTIR
   Enlaces del tipo tuweb.com/?p=ID (prenda) o tuweb.com/?m=ID (marca).
   Sin "#" para que WhatsApp, Instagram, etc. vean el enlace completo.
   ========================================================== */
const baseUrl = () => location.href.split(/[?#]/)[0];
const shareUrl = (k, id) => baseUrl() + '?' + k + '=' + encodeURIComponent(id);
async function shareThing(kind, id) {
  let title, text, url; logSite('share');
  if (kind === 'p') {
    const p = S.products.find(x => x.id === id); if (!p) return;
    title = p.name + ' · ' + p.brand; text = `Mira esto en ${C.appName}: ${p.name} de ${p.brand}, ${money(p.price)}`; url = shareUrl('p', id);
  } else {
    const b = brandList().find(x => x.id === id) || (S.user && S.user.id === id && S.profile ? { name: S.profile.brand_name || 'Mi marca' } : { name: 'Marca' });
    title = b.name + ' en ' + C.appName; text = `Mira ${b.name} en ${C.appName}`; url = shareUrl('m', id);
  }
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(url); toast('Enlace copiado. Pégalo donde quieras.'); }
  catch { copyFallback(url); }
}
function copyFallback(url) {
  const t = document.createElement('textarea'); t.value = url; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
  (dlg.open ? dlg : document.body).appendChild(t); t.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch {}
  t.remove(); toast(ok ? 'Enlace copiado. Pégalo donde quieras.' : 'Copia este enlace: ' + url);
}

/* ==========================================================
   EVENTOS
   ========================================================== */
const tgl = (arr, v) => { const i = arr.indexOf(v); i > -1 ? arr.splice(i, 1) : arr.push(v); };
function syncFavUI(id) {
  const on = S.favs.has(id);
  $$(`[data-act="fav"]`).filter(b => b.dataset.id === id).forEach(b => {
    b.setAttribute('aria-pressed', on);
    if (b.classList.contains('btn')) b.textContent = on ? 'Quitar de guardados' : 'Guardar';
  });
}
async function toggleFav(id, forceOn) {
  const on = forceOn === undefined ? !S.favs.has(id) : forceOn;
  if (on === S.favs.has(id)) return;
  on ? S.favs.add(id) : S.favs.delete(id);
  syncFavUI(id);
  try {
    if (S.user) await api.setFav(S.user.id, id, on);
    else lsSet('found_guest_favs', [...S.favs]);
    toast(on ? 'Guardado' : 'Quitado de guardados');
    if (S.route === 'guardados' && !dlg.open) VIEWS.guardados();
  } catch (e) {
    on ? S.favs.delete(id) : S.favs.add(id); syncFavUI(id); toast('No se pudo guardar: ' + e.message);
  }
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, v = b.dataset.v, id = b.dataset.id;
  switch (a) {
    case 'open': openProduct(id); break;
    case 'closeDlg': dlg.close(); break;
    case 'gal': galGo(+v); break;
    case 'galto': galGo(+v, true); break;
    case 'fav': toggleFav(id); break;
    case 'cat': S.cat = v; VIEWS[S.route] && VIEWS[S.route](); break;
    case 'gustos': S.draft = null; go('gustos'); break;
    case 'style': S.cat = 'Todo'; S.q = ''; S.style = v; go('explorar'); break;
    case 'fstyle': S.style = v; VIEWS.explorar(); break;
    case 'gocat': e.preventDefault(); S.cat = v; S.style = 'Todos'; S.q = ''; if (S.route === 'explorar') { renderNav(); VIEWS.explorar(); } else go('explorar'); break;
    case 'editon': if (!isAdmin()) break; S.editMode = true; if (S.route === 'admin') go('inicio'); else rerender(); toast('Modo edición activado. Solo tú lo ves.'); break;
    case 'editoff': if (pendingCount() && !b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tienes cambios sin publicar. ¿Salir igual?'; break; }
      S.editMode = false; S.colorsOpen = false; S.textDraft = {}; S.colorDraft = null; S.resetTexts = false; applySettings(S.settings); renderNav(); rerender(); break;
    case 'colors': S.colorsOpen = !S.colorsOpen; renderEditBar(); break;
    case 'colreset': S.colorDraft = { ...COLOR_DEFAULTS }; applyColors(S.colorDraft); renderEditBar(); break;
    case 'textreset': S.resetTexts = true; S.textDraft = {}; rerender(); toast('Textos originales cargados. Pulsa «Publicar» para aplicarlos.'); break;
    case 'discard': S.textDraft = {}; S.colorDraft = null; S.resetTexts = false; applySettings(S.settings); rerender(); toast('Cambios descartados'); break;
    case 'publishedits': publishEdits(); break;
    case 'statsdays': S.statsDays = v === 'all' ? null : +v; try { S.ev = await api.eventCounts(S.statsDays); } catch { S.ev = null; } renderPanel(); break;
    case 'demopay': if (api.demoPay) { await api.demoPay(S.user.id); await refreshBilling(); await refreshProducts(); toast('Pago simulado. Suscripción activa.'); go('pago'); } break;
    case 'checkpay': b.disabled = true; b.textContent = 'Comprobando…'; await refreshBilling(); if (subActive(S.billing)) { await refreshProducts(); toast('Suscripción activa. Ya puedes publicar.'); renderPanel(); } else { b.disabled = false; b.textContent = 'Ya he pagado'; toast('Aún no nos consta el pago. Si acabas de pagar, espera unos segundos.'); } break;
    case 'submanual': try { await api.adminSetManual(id, v === 'on'); toast(v === 'on' ? 'Marca activada sin pago' : 'Activación manual quitada'); renderAdminTab(); } catch (err) { toast(err.message); } break;
    case 'brandsignup': if (isBrand()) go('panel'); else { S.authMode = 'up'; S.authRole = 'brand'; go('entrar'); } break;
    case 'rnav': { const r = $('#reel'); if (r) r.scrollBy({ top: (+v) * r.clientHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); break; }
    case 'qs': tgl(S.draft.styles, v); b.setAttribute('aria-pressed', S.draft.styles.includes(v)); break;
    case 'qc': tgl(S.draft.cats, v); b.setAttribute('aria-pressed', S.draft.cats.includes(v)); break;
    case 'qz': tgl(S.draft.sizes, v); b.setAttribute('aria-pressed', S.draft.sizes.includes(v)); break;
    case 'onlymine': S.onlyMine = v === '1'; if (VIEWS[S.route]) VIEWS[S.route](); break;
    case 'share': shareThing(v, id); break;
    case 'fz': tgl(S.formSizes, v); b.setAttribute('aria-pressed', S.formSizes.includes(v)); break;
    case 'apply': {
      if (!S.draft.styles.length) { $('#qerr').textContent = 'Elige al menos un estilo para personalizar tu feed.'; break; }
      S.taste = { styles: [...S.draft.styles], cats: [...S.draft.cats], budget: S.draft.budget, sizes: sortSizes(S.draft.sizes || []) };
      lsSet('found_taste', S.taste); S.draft = null; S.onlyMine = true; logSite('test');
      if (S.user) { try { await api.saveProfile(S.user.id, { styles: S.taste.styles, cats: S.taste.cats, budget: S.taste.budget, sizes: S.taste.sizes });S.profile = { ...S.profile, ...S.taste }; } catch (err) { toast('Tus gustos se guardaron en este dispositivo, pero no en tu cuenta: ' + err.message); } }
      toast('Gustos guardados'); go('descubrir'); break; }
    case 'authmode': S.authMode = v; VIEWS.entrar(); break;
    case 'authrole': S.authRole = v; VIEWS.entrar(); break;
    case 'logout': stopChatWatch(); S.chat = { brand: null, product: null, draft: '', thread: [] }; S.billing = null; S.editMode = false; S.textDraft = {}; S.colorDraft = null; await api.signOut(); S.user = null; S.profile = null; S.favs = guestFavs(); S.editing = null; renderNav(); toast('Has cerrado sesión'); go('inicio'); break;
    case 'resetdemo': try { localStorage.removeItem('found_demo_v1'); localStorage.removeItem('found_guest_favs'); localStorage.removeItem('found_taste'); } catch {} location.hash = '#/descubrir'; location.reload(); break;
    case 'ft': tgl(S.formTags, v); b.setAttribute('aria-pressed', S.formTags.includes(v)); break;
    case 'publish': publish(); break;
    case 'edit': { const p = findProduct(id); S.editing = id; S.formTags = [...p.tags]; S.formSizes = [...p.sizes]; clearPhotos(); S.formPhotos = p.images.map(url => ({ url })); S.draft = null; renderPanel(); window.scrollTo(0, 0); break; }
    case 'canceledit': S.editing = null; S.formTags = []; S.formSizes = []; clearPhotos(); S.draft = null; renderPanel(); break;
    case 'phrm': { const [x] = S.formPhotos.splice(+v, 1); if (x && x.preview) URL.revokeObjectURL(x.preview); refreshPhotos(); break; }
    case 'phfirst': { const [x] = S.formPhotos.splice(+v, 1); S.formPhotos.unshift(x); refreshPhotos(); break; }
    case 'del': if (confirm('¿Eliminar este producto? No se puede deshacer.')) { try { await api.removeProduct(id); await refreshProducts(); toast('Producto eliminado'); VIEWS.panel(); } catch (err) { toast('No se pudo eliminar: ' + err.message); } } break;
    case 'makeadmin': try { await api.saveProfile(S.user.id, { role: 'admin' }); S.profile = { ...S.profile, role: 'admin' }; renderNav(); toast('Modo creador activado'); go('admin'); } catch (err) { toast(err.message); } break;
    case 'admintab': S.adminTab = v; renderAdminTab(); break;
    case 'chatto': openChatWith(id, b.dataset.p, b.dataset.text ? decodeURIComponent(b.dataset.text) : ''); break;
    case 'chatopen': S.chat.brand = id; S.chat.product = null; S.chat.draft = ''; S.chat.thread = []; renderAdminTab(); break;
    case 'chatback': S.chat.brand = null; renderAdminTab(); break;
    case 'chatsend': chatSend(b); break;
    case 'chatpreset': { const t = $('#chat-text'); if (t) { t.value = t.value.trim() ? t.value.replace(/\s*$/, '\n') + v : v; t.focus(); t.setSelectionRange(t.value.length, t.value.length); } break; }
    case 'sitedays': S.siteDays = v === 'all' ? null : +v; renderAdminTab(); break;
    case 'urole': S.userRole = v; $$('[data-act="urole"]').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === v)); fillUsers(); break;
    case 'deluser': deleteUser(id, b); break;
    case 'modok': modSet(id, 'approved', null, 'Prenda aprobada. Ya se ve en la web.'); break;
    case 'modno': { const box = b.closest('.moditem').querySelector('.mod-reject'); box.hidden = !box.hidden; if (!box.hidden) box.querySelector('input').focus(); break; }
    case 'modpreset': { const inp = b.closest('.mod-reject').querySelector('input'); inp.value = v; inp.focus(); break; }
    case 'modreject': { const reason = b.closest('.mod-reject').querySelector('input').value.trim(); if (!reason) { toast('Escribe el motivo para que la marca sepa qué corregir.'); break; } modSet(id, 'rejected', reason, 'Prenda rechazada. La marca verá el motivo en su panel.'); break; }
    case 'rephide': if (confirm('¿Retirar esta prenda de la web? La marca la verá como rechazada y podrá corregirla.')) { try { await api.adminSetStatus(id, 'rejected', 'Retirada tras una denuncia'); notifyRejected(id, 'Retirada tras una denuncia de un visitante'); await api.adminResolveReportsFor(id); await refreshProducts(); toast('Prenda retirada'); renderAdminTab(); } catch (err) { toast('No se pudo retirar: ' + err.message); } } break;
    case 'repok': try { await api.adminResolveReportsFor(id); toast('Denuncia marcada como revisada'); renderAdminTab(); } catch (err) { toast(err.message); } break;
    case 'report': openReportForm(id); break;
    case 'rmstylepic': saveStylePic(v, null); break;
    case 'gotab': if (b.dataset.role) S.userRole = b.dataset.role; S.adminTab = v; renderAdminTab(); window.scrollTo(0, 0); break;
    case 'rankdays': S.rankDays = v === 'all' ? null : +v; renderAdminTab(); break;
    case 'copyrank': copyText(decodeURIComponent(b.dataset.text), 'Resumen copiado. Pégalo en tu correo o WhatsApp a la marca.'); break;
    case 'export': exportCSV(v); break;
    case 'adminedit': openAdminEdit(id); break;
    case 'adminsave': saveAdminEdit(id, b); break;
    case 'block': { const em = ($('#blk-email') || {}).value || '', rs = ($('#blk-reason') || {}).value || ''; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.trim())) { toast('Escribe un correo válido.'); break; } try { await api.adminBlock(em, rs.trim()); toast('Correo bloqueado'); renderBlocked(); } catch (err) { toast(err.message); } break; }
    case 'unblock': try { await api.adminUnblock(v); toast('Correo desbloqueado'); renderBlocked(); } catch (err) { toast(err.message); } break;
    case 'sendreport': sendReport(id, b); break;
    case 'savesettings': saveSiteSettings(); break;
    case 'resetsettings': if (confirm('¿Volver a los valores originales de la web?')) { try { await api.saveSettings(null); applySettings(null); renderNav(); renderAdminTab(); toast('Valores originales restaurados'); } catch (err) { toast('No se pudo restaurar: ' + err.message); } } break;
    case 'adminfeat': { const p = findProduct(id); try { await api.adminSetFeatured(id, !p.featured); await refreshProducts(); renderAdminTab(); } catch (err) { toast(err.message); } break; }
    case 'admindel': if (confirm('¿Eliminar este producto de la web? No se puede deshacer.')) { try { await api.removeProduct(id); await refreshProducts(); renderAdminTab(); toast('Producto eliminado'); } catch (err) { toast('No se pudo eliminar: ' + err.message); } } break;
    case 'saveprofile': {
      const m = $('#pmsg'); m.className = 'msg';
      const patch = { brand_name: $('#p-brand').value.trim(), contact_email: $('#p-contact').value.trim(), brand_bio: $('#p-bio').value.trim() };
      if (!patch.brand_name) { m.classList.add('err'); m.textContent = 'La marca necesita un nombre.'; break; }
      const files = { logo: $('#p-logo').files[0], cover: $('#p-cover').files[0] };
      const badF = Object.values(files).find(f => f && (!/^image\/(png|jpeg|webp)$/.test(f.type) || f.size > 15e6));
      if (badF) { m.classList.add('err'); m.textContent = 'Las imágenes deben ser PNG, JPG o WEBP y pesar menos de 15 MB.'; break; }
      const btn = $('#psave'); btn.disabled = true; btn.textContent = files.logo || files.cover ? 'Subiendo imágenes…' : 'Guardando…';
      try {
        if (files.logo) patch.logo_url = await api.uploadBrandImage(S.user.id, files.logo, 'logo');
        if (files.cover) patch.cover_url = await api.uploadBrandImage(S.user.id, files.cover, 'cover');
        await api.saveProfile(S.user.id, patch); S.profile = { ...S.profile, ...patch }; await refreshProducts();
        toast('Perfil guardado'); renderPanel();
      } catch (err) { m.classList.add('err'); m.textContent = 'No se pudo guardar: ' + err.message; btn.disabled = false; btn.textContent = 'Guardar perfil'; }
      break; }
    case 'rmimg': {
      const k = v === 'logo' ? 'logo_url' : 'cover_url';
      try { await api.saveProfile(S.user.id, { [k]: null }); S.profile = { ...S.profile, [k]: null }; await refreshProducts(); toast(v === 'logo' ? 'Logo quitado' : 'Portada quitada'); renderPanel(); }
      catch (err) { toast('No se pudo quitar: ' + err.message); }
      break; }
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.q = e.target.value; const h = $('#hq'); if (h) h.value = S.q; fillGrid(); logSearchSoon(); }
  // buscador de la cabecera: en Explorar filtra al momento; en otras páginas espera a que se pulse Intro
  if (e.target.id === 'hq' && S.route === 'explorar') { S.q = e.target.value; const q = $('#q'); if (q) q.value = S.q; fillGrid(); logSearchSoon(); }
  if (e.target.id === 'usearch') { S.userQ = e.target.value; fillUsers(); }
  if (e.target.id === 'bud' && S.draft) { S.draft.budget = +e.target.value; $('#budv').textContent = e.target.value + ' ' + C.currency; }
});
document.addEventListener('change', async e => {
  if (e.target.id === 'sort') { S.sort = e.target.value; fillGrid(); }
  if (e.target.classList.contains('rolesel')) {
    try { await api.adminSetRole(e.target.dataset.id, e.target.value); const u = (S.adminUsers || []).find(x => x.id === e.target.dataset.id); if (u) { u.role = e.target.value; fillUsers(); } toast('Tipo de cuenta actualizado'); }
    catch (err) { toast(err.message); renderAdminTab(); }
  }
});
document.addEventListener('change', e => {
  const id = e.target.id; if (id !== 'p-logo' && id !== 'p-cover') return;
  const f = e.target.files[0], box = $(id === 'p-logo' ? '#bp-logo' : '#bp-cover'); if (!f || !box) return;
  if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { toast('Elige una imagen PNG, JPG o WEBP.'); e.target.value = ''; return; }
  box.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">`;
  const m = $('#pmsg'); if (m) { m.className = 'msg'; m.textContent = 'Pulsa «Guardar perfil» para publicar los cambios.'; }
});
document.addEventListener('input', e => { if (e.target.id === 'p-brand') { const n = $('#bp-name'); if (n) n.textContent = e.target.value || 'Tu marca'; } });
document.addEventListener('dblclick', e => {
  const s = e.target.closest('.slide'); if (!s || !s.dataset.id || e.target.closest('button,a')) return;
  toggleFav(s.dataset.id, true);
  const b = document.createElement('div'); b.className = 'burst';
  b.innerHTML = '<svg viewBox="0 0 24 24" width="120" height="120"><path fill="#E0345B" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.7h2C14 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg>';
  s.appendChild(b); setTimeout(() => b.remove(), 700);
});
document.addEventListener('keydown', e => {
  if (S.route !== 'descubrir' || dlg.open) return;
  const r = $('#reel'); if (!r || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); r.scrollBy({ top: r.clientHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); }
  else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); r.scrollBy({ top: -r.clientHeight, behavior: reduceMotion ? 'auto' : 'smooth' }); }
});

/* ==========================================================
   ENRUTADOR E INICIO
   ========================================================== */
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'inicio';
  const [name, arg] = h.split('/');
  S.route = VIEWS[name] ? name : 'inicio';
  document.body.classList.remove('noscroll');
  if (S.route !== 'explorar') { S.q = ''; S.style = 'Todos'; }
  if (dlg.open) dlg.close();
  if (S.route !== 'gustos') S.draft = S.route === 'panel' ? S.draft : null;
  if (S.route !== 'panel') { S.editing = null; if (S.route !== 'gustos') { S.formTags = []; S.formSizes = []; clearPhotos(); } }
  renderNav();
  VIEWS[S.route](arg);
  renderEditBar();
  trackPage();
  if (S.route !== 'descubrir') window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
// buscador de la cabecera: al pulsar Intro lleva a Explorar con lo escrito
document.addEventListener('change', e => { if (e.target.id === 'f-imgs') { addPhotos([...e.target.files]); } });
document.addEventListener('submit', e => {
  if (e.target.id !== 'hsearch') return;
  e.preventDefault();
  S.q = $('#hq').value; S.cat = 'Todo'; S.style = 'Todos';
  if (S.route === 'explorar') { renderNav(); VIEWS.explorar(); } else go('explorar');
  logSearchSoon();
});

(async function start() {
  if (/[?&]pago=/.test(location.search)) history.replaceState(null, '', location.pathname + '#/pago');
  // enlaces compartidos: ?p=ID abre la prenda, ?m=ID abre la página de la marca
  const qs = new URLSearchParams(location.search), sharedP = qs.get('p'), sharedM = qs.get('m');
  if (sharedP || sharedM) history.replaceState(null, '', location.pathname + (sharedM ? '#/marca/' + encodeURIComponent(sharedM) : (location.hash || '#/inicio')));
  if (configured && !hasLib) toast('No se pudo cargar Supabase. Revisa tu conexión y recarga la página.');
  try { await afterAuth(); } catch (e) { S.favs = guestFavs(); toast('No se pudo comprobar tu sesión: ' + e.message); }
  try { applySettings(await api.getSettings()); } catch { applySettings(null); }
  await refreshProducts();
  api.onChange(async () => { if (!S.user) { await afterAuth(); await refreshProducts(); route(); } });
  route();
  if (sharedP) { if (S.products.some(p => p.id === sharedP)) openProduct(sharedP); else toast('Esta prenda ya no está disponible. Mira otras parecidas.'); }
})();
})();
