/* ==========================================================
   FOUND · configuración
   Edita este archivo para cambiar el nombre, los estilos,
   las categorías y para conectar tu base de datos real.
   ========================================================== */
window.FOUND_CONFIG = {
  appName: 'FOUND',
  tagline: 'La moda que encaja contigo',
  currency: '€',

  // --- Base de datos real (Supabase). Mientras esté vacío, FOUND funciona en MODO DEMO
  //     (los datos se guardan solo en tu navegador). Mira el README para rellenarlo.
  supabaseUrl: 'https://jysxlckreelzsvhroezz.supabase.co',        // ej. 'https://abcdxyz.supabase.co'
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5c3hsY2tyZWVsenN2aHJvZXp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1Njg1ODEsImV4cCI6MjEwNzE0NDU4MX0.EjUsX8uPD8IRNH_gksxkg7CkdLXgakKFd0yvYwlAfws',    // la clave "anon public" (es pública por diseño)
  imageBucket: 'product-images',

  // --- Contacto (aparece en el pie de la web). Déjalo vacío para no mostrarlo.
  contactEmail: '',          // ej. 'hola@found.es'
  instagram: '',             // ej. 'https://instagram.com/found'

  // --- Contenido editable
  styles: ['Minimalista', 'Streetwear', 'Vintage', 'Elegante', 'Deportivo', 'Bohemio', 'Sostenible'],
  categories: ['Camisetas', 'Vestidos', 'Chaquetas', 'Pantalones', 'Calzado', 'Complementos']
};
