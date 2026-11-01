/* ==========================================================
   FOUND · configuración
   Edita este archivo para cambiar el nombre, los estilos,
   las categorías y para conectar tu base de datos real.
   ⚠️ Los campos marcados con «RELLENAR» son obligatorios antes de abrir la web al público.
   ========================================================== */
window.FOUND_CONFIG = {
  appName: 'FOUND',
  tagline: 'La moda que encaja contigo',
  currency: '€',

  // --- Dirección pública de la web, con / al final. RELLENAR
  //     Con GitHub Pages: 'https://tu-usuario.github.io/found/'. Con dominio propio: 'https://found.es/'
  //     Si la cambias, cámbiala también en index.html, robots.txt, sitemap.xml y las páginas legales.
  siteUrl: 'https://foundempresa-max.github.io/found/',

  // --- Base de datos real (Supabase). Mientras esté vacío, FOUND funciona en MODO DEMO
  //     (los datos se guardan solo en tu navegador). Mira el README para rellenarlo.
  supabaseUrl: 'https://jysxlckreelzsvhroezz.supabase.co',        // ej. 'https://abcdxyz.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5c3hsY2tyZWVsenN2aHJvZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Njg1ODEsImV4cCI6MjEwNzE0NDU4MX0.EjUsX8uPD8IRNH_gksxkg7CkdLXgakKFd0yvYwlAfws',    // la clave "anon public" (es pública por diseño)
  imageBucket: 'product-images',
  supabaseRegion: 'la Unión Europea',  // dónde está tu proyecto de Supabase (Settings > General > Region). Sale en la política de privacidad.

  // --- Contacto (aparece en el pie de la web). Déjalo vacío para no mostrarlo.
  contactEmail: 'foundempresa@gmail.com',          // ej. 'hola@found.es'  · RELLENAR (también es el correo para ejercer derechos RGPD)
  instagram: '',             // ej. 'https://instagram.com/found'

  // --- Botón de WhatsApp (abajo a la derecha). Número con prefijo de país, sin + ni espacios. Vacío = no se muestra.
  whatsapp: '',              // ej. '34600111222'  · RELLENAR
  whatsappText: 'Hola, tengo una pregunta sobre FOUND',

  // --- Datos del titular de la web (Aviso legal y Privacidad). Obligatorios por la LSSI y el RGPD. RELLENAR
  legal: {
    owner: 'FOUND',
    nif: '[NIF / CIF]',
    address: '[Dirección completa, código postal y ciudad]',
    email: '',               // si lo dejas vacío se usa contactEmail
    registry: '',            // solo si eres sociedad: 'Registro Mercantil de Madrid, tomo X, folio Y, hoja M-Z'
    updated: '1 de noviembre de 2026'
  },

  // --- Analítica de Google (opcional). Pon tu ID de medición «G-XXXXXXX» de Google Analytics 4.
  //     Solo se carga si la persona acepta las cookies de analítica. Vacío = no se usa.
  gaId: '',

  // --- Protección antispam con Cloudflare Turnstile (opcional, gratis). Mira el README, apartado 2q.
  //     Vacío = solo la protección básica (campo trampa y tiempo mínimo), que ya funciona sin hacer nada.
  turnstileSiteKey: '',

  // --- Contenido editable
  styles: ['Minimalista', 'Streetwear', 'Vintage', 'Elegante', 'Deportivo', 'Bohemio', 'Sostenible'],
  categories: ['Camisetas', 'Vestidos', 'Chaquetas', 'Pantalones', 'Calzado', 'Complementos']
};
