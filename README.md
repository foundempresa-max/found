# FOUND · marketplace de moda personalizado

Web real con cuentas de usuario, marcas que suben productos con foto, feed
estilo TikTok personalizado por gustos, favoritos y panel de marca.

No necesita instalar nada: son archivos estáticos (HTML, CSS y JS) + una base
de datos gratuita en Supabase.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página |
| `style.css` | Colores, tipografías y diseño (variables al inicio) |
| `config.js` | **Nombre, estilos, categorías y claves de la base de datos** |
| `app.js` | Toda la lógica (cuentas, productos, feed, panel) |
| `supabase/schema.sql` | Tablas y reglas de seguridad de la base de datos |
| `supabase/marcas.sql` | Solo la parte nueva de logo y portada de las marcas |
| `supabase/estadisticas.sql` | Solo la parte nueva de estadísticas de clics |
| `supabase/tallas.sql` | Solo la parte nueva de tallas |
| `supabase/analitica.sql` | Solo la parte nueva de visitas de la web |
| `supabase/cuentas.sql` | Solo la parte nueva de gestionar y borrar cuentas |
| `supabase/moderacion.sql` | Solo la parte nueva de revisión de prendas y denuncias |
| `supabase/fotos-estilos.sql` | Permiso para que el creador suba las fotos de los estilos |
| `supabase/panel.sql` | Ranking de marcas (guardados) y correos bloqueados |
| `supabase/mensajes.sql` | Mensajes entre las marcas y tú (chat interno) |
| `supabase/fotos.sql` | Hasta 5 fotos por prenda |
| `og.png` | Imagen que sale al compartir un enlace de la web |
| `.nojekyll` | Archivo vacío que necesita GitHub Pages para publicar la web tal cual (no lo borres) |
| `supabase/mas-adelante-cobro/` | Cobro a marcas con Stripe, **apagado** (ver el final de este archivo) |

## 1. Probarlo ya (modo demo)
Abre `index.html` con doble clic, o mejor sírvelo en local:
`python3 -m http.server 8000` y entra en http://localhost:8000
Verás la etiqueta **DEMO**: los datos se guardan solo en tu navegador.
Puedes crear una cuenta de marca y subir productos para ver todo el flujo.

## 2. Hacerlo real con Supabase (gratis para empezar)
1. Crea una cuenta en https://supabase.com y un proyecto nuevo.
2. Ve a **SQL Editor > New query**, pega todo `supabase/schema.sql` y pulsa **Run**.
3. Ve a **Project Settings > API** y copia:
   - **Project URL**
   - **anon public key**
4. Pégalos en `config.js`:
   ```js
   supabaseUrl: 'https://TU-PROYECTO.supabase.co',
   supabaseAnonKey: 'tu-clave-anon-public',
   ```
   La clave *anon* es pública por diseño: la seguridad la dan las reglas RLS
   del `schema.sql`. **Nunca pegues la clave `service_role`.**
5. En **Authentication > Providers > Email**: para pruebas puedes desactivar
   "Confirm email"; en producción déjalo activado.
6. Recarga la web: la etiqueta DEMO desaparece y todo se guarda en tu base de datos.

## 2a. Editar la web sin tocar código (modo edición)
Con tu cuenta de creador verás el botón **✎ Editar la web** abajo a la derecha (o en Creador > Resumen).
- Pulsa cualquier texto con borde discontinuo y escríbelo de nuevo. *Palabra* entre asteriscos = subrayada con una «costura» del color de marca.
- **Colores**: color de marca, fondo, tarjetas, texto, bloques oscuros y etiqueta «% para ti», viendo el resultado al momento.
- Nada cambia para los visitantes hasta que pulses **Publicar**. **Descartar** deshace lo no publicado; **Textos originales** y **Volver a los originales** restauran el diseño de fábrica.
- Se guarda en la tabla `site_settings` de Supabase: no hace falta volver a subir nada a GitHub.

## 2b. Correos de confirmación en español (y que lleguen a todo el mundo)
1. **Plantilla:** Supabase > Authentication > Emails > *Confirm signup*. Asunto: `Confirma tu cuenta en FOUND`.
   Pega el contenido de `supabase/correo-confirmacion.html`. A las marcas les recuerda subir su logo y sus prendas.
2. **Servidor de correo propio (obligatorio para usuarios reales):** el correo que trae Supabase de serie
   solo envía a los miembros de tu equipo de Supabase y unos 2 correos por hora. Conecta un servicio como
   Brevo o Resend en Authentication > Emails > *SMTP Settings*, con un remitente tipo `hola@tudominio`.

## 2c. Estadísticas de clics para las marcas
Ejecuta `supabase/estadisticas.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- **Clic:** alguien abre la ficha de una prenda. **Visita a tu tienda:** pulsa «Comprar» o «Preguntar a la marca».
- No cuentan los clics de la propia marca ni los tuyos, y la misma persona repitiendo en menos de 30 minutos cuenta una vez.
- Cada marca ve las suyas en su panel (7 días, 30 días o siempre). Tú ves las de todas en Creador > Productos.
- Hasta que ejecutes el SQL, el panel muestra «—» en esas casillas y la web funciona igual.

## 2d. Logo y portada de las marcas
Ejecuta `supabase/marcas.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- Cada marca sube su **logo** (cuadrado; mejor PNG con fondo transparente) y su **foto de portada** (horizontal)
  en *Mi panel > Perfil de marca*, con vista previa antes de guardar. Puede quitarlos cuando quiera.
- Se ven en su página, en el directorio de marcas, en la ficha de cada prenda y en Descubrir.
- Se guardan en la carpeta `brand-images` de Supabase Storage. La base de datos solo acepta imágenes que
  la propia marca ha subido a su carpeta (nadie puede poner imágenes de otras webs).
- Hasta que ejecutes el SQL, la web funciona igual pero sin logos ni portadas.

## 2e. Tu panel de creador (solo para ti)
Es una zona dentro de la propia web (`#/admin`) para cambiar cosas sin tocar código:
- **Ajustes de la web:** nombre, frase, color principal, aviso superior, estilos y categorías.
- **Productos:** destacar los que quieras empujar o eliminar los que no deban estar.
- **Usuarios:** ver quién se ha registrado y cambiar su tipo de cuenta.
- **Resumen:** compradores, marcas, productos y guardados.

**Modo demo:** crea una cuenta, ve a *Cuenta* y pulsa **Activar modo creador (demo)**.

**Modo real (Supabase):**
1. Vuelve a ejecutar todo `supabase/schema.sql` (es seguro repetirlo; añade la parte de creador).
2. Regístrate en tu web con tu correo.
3. En el SQL Editor ejecuta (con tu correo):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'TU_CORREO@EJEMPLO.COM');
   ```
4. Cierra sesión y vuelve a entrar: aparecerá **Creador** en el menú.

Nadie puede ascenderse a creador desde la web: el cambio de rol solo lo puede hacer
un creador, o tú desde el SQL Editor.

## 2f. Tallas
Ejecuta `supabase/tallas.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- **Marcas:** al subir o editar una prenda marcan sus tallas disponibles. Las opciones cambian según la categoría:
  ropa XXS–XXL, calzado 35–46 (EU), complementos «Talla única». Es obligatorio marcar al menos una.
- **Prendas antiguas:** en *Mi panel* aparecen con el aviso «sin tallas». Basta con pulsar Editar, marcar las tallas y guardar.
- **Compradores:** en el test de estilo (paso 04) eligen su talla de ropa y de calzado (opcional).
  En Explorar y Descubrir ven solo lo que hay en su talla, con el botón «Todas las tallas» para quitar el filtro.
  Las prendas que aún no tienen tallas se siguen mostrando.
- En la ficha de cada prenda se ven las tallas y se marca la del comprador.
- Hasta que ejecutes el SQL, la web funciona igual pero no guarda las tallas.
- Las tallas se deducen del nombre de la categoría: si creas una categoría nueva con «calzado», «zapato», «bota» o «sandalia»
  usará números; con «complemento», «bolso» o «joya», talla única; el resto, XXS–XXL.

## 2g. Compartir prendas y marcas
- Cada prenda (en su ficha y en Descubrir) y cada página de marca tienen un botón **Compartir**. En el móvil abre el menú
  de compartir del teléfono (WhatsApp, Instagram, etc.); en el ordenador copia el enlace.
- Los enlaces son del tipo `tu-usuario.github.io/found/?p=…` (prenda) o `/?m=…` (marca) y abren directamente esa prenda o marca.
- Al pegar un enlace de la web en WhatsApp, Instagram o X aparece la imagen `og.png` con tu marca.
  **Si cambias de dominio**, cambia la dirección en las líneas `og:url` y `og:image` de `index.html`.
- GitHub Pages solo sirve archivos fijos, así que al compartir una prenda concreta se ve siempre la imagen general `og.png`
  (no la foto de esa prenda). El enlace sí abre directamente la prenda o la marca.

## 2h. Visitas de la web (Panel de creador > Visitas)
Ejecuta `supabase/analitica.sql` en Supabase > SQL Editor (una vez; se puede repetir). Desde ese momento empiezan a contar las visitas.
- **Qué ves:** visitas, visitantes, páginas vistas y cuentas nuevas; una gráfica de visitas por día; de dónde llega la gente
  (Instagram, TikTok, Google, WhatsApp, enlace compartido, directo…); qué páginas miran; el recorrido de visitante a tienda
  (entran → hacen el test → crean cuenta → van a la tienda de una marca); y si entran desde el móvil o el ordenador.
- Periodos de 7, 30 o 90 días o desde el inicio, comparando con el periodo anterior. En *Resumen* tienes las visitas de la semana.
- **Sin cookies ni datos personales:** cada visitante es una huella anónima que cambia cada día, así que una misma persona
  cuenta como un visitante por día y no hace falta banner de cookies para esto. Tus visitas como creador no cuentan.
  Los datos se borran solos a los 13 meses.
- **Saber qué publicación funciona:** añade `?utm_source=` a los enlaces que pongas en redes, por ejemplo
  `tu-usuario.github.io/found/?utm_source=instagram-bio` o `?utm_source=tiktok-video1`, y aparecerán con ese nombre en «De dónde vienen».
- Instagram y TikTok a veces no dicen de dónde viene la visita: en ese caso sale como «Directo». Con `utm_source` siempre sale bien.

## 2i. Gestionar y borrar cuentas (Panel de creador > Usuarios)
Ejecuta `supabase/cuentas.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- Verás el **correo de registro** de cada cuenta, la fecha de alta, la última vez que entró y cuántas prendas tiene cada marca.
- Puedes **buscar** por correo o nombre de marca y filtrar por compradores, marcas o creadores.
- **Borrar** una cuenta elimina también todo lo suyo: perfil, prendas, fotos, página de marca, guardados y estadísticas.
  Antes te pide confirmación y **no se puede deshacer**.
- Por seguridad no puedes borrar tu propia cuenta ni otra cuenta de creador (cámbiala antes a comprador).
- Hasta que ejecutes el SQL, la lista se ve como antes y sin el botón de borrar.

## 2j. Revisión de prendas y denuncias (Panel de creador > Por revisar / Denuncias)
Ejecuta `supabase/moderacion.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- **Por revisar:** las prendas nuevas no se ven en la web hasta que las apruebas. También vuelven a revisión si la marca
  cambia la foto o el nombre de una prenda, o si corrige una rechazada. Las que ya estaban publicadas siguen publicadas.
- Puedes **aprobar** o **rechazar con un motivo** (hay motivos rápidos). La marca ve en su panel «En revisión» o
  «Rechazada: motivo» y puede corregirla con «Editar».
- La pestaña muestra cuántas prendas esperan. Puedes **apagar la revisión** en Ajustes de la web > Revisión de prendas.
- Esto lo garantiza la base de datos: una marca no puede aprobarse a sí misma, aunque toque el código de la web.
- **Denuncias:** cada prenda tiene un enlace «Denunciar esta prenda» (falsificación, contenido inapropiado, enlace roto,
  información engañosa u otro). Te llegan agrupadas por prenda: puedes **retirarla** (queda rechazada y la marca puede
  corregirla) o **marcar el aviso como revisado**. La misma persona solo puede denunciar una prenda una vez.

## 2k. Qué busca la gente (Panel de creador > Visitas)
Vuelve a ejecutar `supabase/analitica.sql` (ahora también guarda las búsquedas; no se pierde nada).
- En Visitas aparece **«Qué buscan»**: lo más buscado en Explorar y, sobre todo, **lo buscado sin resultados**,
  que es lo que la gente quiere y aún no tienes.
- Solo se guarda el texto buscado, sin datos de quién lo buscó.

## 2l. Fotos de los estilos (Panel de creador > Ajustes de la web)
Ejecuta `supabase/fotos-estilos.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- En **Ajustes de la web > Fotos de los estilos** sube una foto para cada estilo (Minimalista, Streetwear…).
  Se guarda al elegirla; puedes cambiarla o quitarla cuando quieras.
- Salen en las tarjetas «Encuentra tu tribu» de la portada y en el test de estilo (se elige tocando la foto).
- Mejor fotos verticales (3:4) con la prenda bien visible. Puedes usar fotos de tus marcas (con su permiso),
  de bancos gratuitos como Unsplash o Pexels, o hechas con IA.
- Si cambias el nombre de un estilo, vuelve a subir su foto.

## 2m. Más herramientas del panel de creador
Ejecuta `supabase/panel.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- **Resumen > Para hoy:** lo que tienes pendiente (prendas por revisar, denuncias, marcas con cosas por mejorar,
  marcas nuevas de la semana y búsquedas sin resultados), cada cosa con su botón.
- **Salud del catálogo:** marca por marca, qué falta (fotos, tallas, enlace a la tienda, descripción, logo…) y las
  que se registraron sin subir nada. «Escribir a la marca» abre tu correo con el mensaje ya redactado.
- **Ranking de marcas:** clics, visitas a su tienda y guardados por marca (7 días, 30 días o siempre).
  «Copiar resumen» copia un mensaje con sus números para enviárselo.
- **Productos > Editar:** corrige cualquier prenda (nombre, precio, categoría, tallas, estilos, descripción, enlace).
  La foto solo la cambia la marca.
- **Productos > Descargar en Excel:** prendas, marcas con sus estadísticas y usuarios. Sirve también de copia de seguridad.
- **Usuarios > Correos bloqueados:** un correo bloqueado no puede volver a registrarse. Al borrar una cuenta, la web
  te pregunta si quieres bloquear también su correo.

## 2n. Mensajes con las marcas (Panel de creador > Mensajes)
Ejecuta `supabase/mensajes.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- **Tú:** en *Creador > Mensajes* eliges una marca y le escribes. Puedes indicar **sobre qué prenda** es el mensaje
  (la marca la ve con su foto) y usar **frases rápidas** («La foto no se ve bien…», «Falta el enlace a tu tienda…»).
- **Botón «Escribir a la marca»** en *Por revisar*, *Denuncias*, *Productos* y *Usuarios*: abre la conversación con esa prenda ya elegida.
  En *Salud del catálogo* el mensaje sale ya redactado con todo lo que falta, y en *Ranking de marcas* puedes enviar el resumen de sus números.
- **Al rechazar o retirar una prenda**, la marca recibe automáticamente un mensaje con el motivo.
- **La marca:** ve «Mensajes» en el menú (con el número de mensajes sin leer) y un aviso en su panel. Contesta desde ahí.
- Los mensajes llegan **al momento**, sin recargar, y se marcan como «Leído». Ves los no leídos en el menú *Creador* y en la pestaña.
- La marca no recibe un correo automático: si quieres que se entere enseguida, pulsa **«Avisar por correo»** en la conversación.
- Cada marca solo puede ver y escribir en su propia conversación (lo garantiza la base de datos). Los mensajes no se pueden editar ni borrar.
- Hasta que ejecutes el SQL, la pestaña Mensajes te explica cómo activarlo y el resto de la web funciona igual.

## 2o. Varias fotos por prenda (hasta 5)
Ejecuta `supabase/fotos.sql` en Supabase > SQL Editor (una vez; se puede repetir).
- **Marcas:** en *Mi panel*, al subir o editar una prenda, pueden añadir hasta 5 fotos de golpe. La primera es la portada;
  con «Hacer portada» se cambia y con la × se quita una foto.
- **Compradores:** en la ficha de la prenda las fotos se pasan deslizando con el dedo (en el ordenador, con flechas y miniaturas).
  En las tarjetas, al pasar el ratón se ve la segunda foto, y en Descubrir aparece «Ver N fotos».
- Las prendas que ya tenían foto la conservan como portada.
- Si la revisión de prendas está activada, cambiar cualquier foto de una prenda aprobada la devuelve a revisión.
- La base de datos solo acepta fotos que la propia marca ha subido a su carpeta, y como máximo 5.
- Hasta que ejecutes el SQL, la web funciona igual pero solo guarda la primera foto (y avisa a la marca).

## 2p. Pulido para móvil (v18)
No hay que ejecutar nada en Supabase: basta con subir los archivos nuevos a GitHub.
- **Buscador de la cabecera:** en el móvil dice «Buscar en FOUND» en vez de un texto cortado.
- **Panel de marca:** en el móvil salen primero *Tus productos* y las estadísticas; el formulario para subir va debajo
  (al pulsar «Editar» en una prenda, el formulario sí aparece arriba).
- **Panel de creador:** las 10 pestañas van en una sola fila que se desliza con el dedo, y la elegida queda a la vista.
- **Botón «Editar la web»:** en el móvil es un botón redondo con el lápiz, para no tapar otros botones.
- **Listas de prendas:** los botones van en una cuadrícula de dos, y «Eliminar» sale en rojo.
- **Explorar:** el selector de orden ocupa todo el ancho.
- **Mensajes:** el chat cabe entero encima de la barra inferior.
- **Toques más fáciles:** los enlaces pequeños (nombre de marca, «Añade tu talla», «Denunciar», «Copiar resumen»…)
  tienen ahora una zona de toque de 44 px, sin cambiar cómo se ven.
- Todo está al final de `style.css`, desde la línea `v18 · PULIDO MÓVIL`.

## 3. Publicarlo en internet con GitHub Pages (gratis)
La web vive en GitHub y los datos siguen en Supabase. En los pasos, cambia `tu-usuario` por tu usuario de GitHub.

**Primera vez**
1. Entra en https://github.com y pulsa **+ > New repository**. Nombre: `found`. Marca **Public** y pulsa **Create repository**.
2. En la página del repositorio vacío, pulsa **uploading an existing file**. Abre la carpeta `FOUND` en tu ordenador,
   selecciona **todo lo que hay dentro** (no la carpeta en sí) y arrástralo. Pulsa **Commit changes**.
   - El archivo `.nojekyll` está oculto: en Mac pulsa `Cmd + Mayús + .` para verlo; en Windows, *Vista > Elementos ocultos*.
     Si no se sube, la web funciona igual casi siempre, pero es mejor que esté.
3. Ve a **Settings > Pages**. En *Source* elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y pulsa **Save**.
4. Espera 1 o 2 minutos y recarga: arriba sale *Your site is live at* `https://tu-usuario.github.io/found/`.
5. En `index.html` (puedes editarlo en GitHub con el lápiz ✎) cambia `TU-USUARIO` por tu usuario en las líneas `og:url` y `og:image`.

**Avisa a Supabase de la nueva dirección** (si no, los correos de confirmación llevan a la web antigua)
6. Supabase > **Authentication > URL Configuration**:
   - **Site URL:** `https://tu-usuario.github.io/found/`
   - **Redirect URLs:** añade `https://tu-usuario.github.io/found/**`
7. Si tenías la web en Netlify, cuando todo funcione en GitHub puedes borrar el sitio de Netlify.

**Para subir una versión nueva:** en el repositorio pulsa **Add file > Upload files**, arrastra los archivos cambiados
(se sustituyen los que tienen el mismo nombre) y **Commit changes**. En 1 o 2 minutos se ve en la web.

**Dominio propio (found.es, por ejemplo):** Settings > Pages > *Custom domain*. GitHub te dice qué registros DNS poner
en tu proveedor del dominio. Después cambia la dirección en `index.html` y en Supabase (paso 6).

## 4. Cómo modificarlo
- **Nombre, estilos y categorías**: `config.js`.
- **Correo de contacto e Instagram del pie**: `contactEmail` e `instagram` en `config.js`.
- **Estilo «escaparate» (v4, el actual)**: está al final de `style.css`, desde la línea `v4 · ESCAPARATE` (colores en su `:root`). Si lo borras vuelve el estilo «etiqueta de ropa» (v3); cambia también la fuente en `index.html` (Hanken Grotesk → Archivo).
- **Colores y tipografías**: variables `:root` al inicio de `style.css`. El estilo «etiqueta de ropa» (v3) está al final de `style.css`; si lo borras desde la línea `v3 · ETIQUETA DE ROPA` vuelve el aspecto anterior (y cambia también `--display` y los colores de `:root`).
- **Textos y pantallas**: `app.js`, en el bloque `VIEWS` (una función por pantalla).
- **Cómo se calcula el "% para ti"**: función `matchPct` en `app.js`.
- **Orden de Descubrir**: función `feedOrder` y ajustes `FEED` en `app.js`. Lo que más encaja va arriba, pero se mezclan
  las prendas que encajan parecido (el orden cambia en cada visita), sube lo que la persona aún no ha visto, baja lo que
  ya pasó varias veces sin guardarlo, cada pocas prendas sale una «Algo distinto a tu estilo» y no salen seguidas dos
  prendas de la misma marca. Explorar mantiene su propio orden (el que elija la persona en el desplegable).

Si cambias las categorías o los estilos en `config.js`, no hay que tocar la base
de datos: se guardan como texto.

## Páginas (v2)
Inicio (`#/inicio`), Descubrir, Explorar, Marcas (`#/marcas`), página de cada marca, Vende en FOUND (`#/vender`),
Guardados, Test de estilo (`#/gustos`), Entrar, Cuenta, Panel de marca y Panel de creador.

## 5. Qué hace y qué NO hace todavía
Hace: registro y acceso, cuenta de comprador o marca, cuestionario de gustos,
feed vertical personalizado, explorar con búsqueda y filtros, favoritos, perfil
público de marca, panel para subir/editar/borrar productos con foto y ver
cuántas veces se guardan.

Las marcas publican gratis (el cobro mensual está preparado pero apagado; ver el final). La compra de prendas se hace en **la tienda online de la marca** (campo "enlace para
comprar") o escribiéndole por correo. **No hay pagos dentro de FOUND.**

## 6. Siguientes pasos recomendados
1. **Activar el cobro mensual a las marcas** (ya preparado, ver el final de este archivo).
2. **Moderación**: revisar marcas y productos antes de publicarlos.
3. **Carrito y pedidos** dentro de la plataforma.
4. **Vídeo corto por producto** en el feed.
5. Aviso legal, política de privacidad y de cookies (obligatorio para operar
   en la UE con usuarios reales).

## Para más adelante: cobrar a las marcas (suscripción mensual con Stripe)
Ahora mismo el cobro está **apagado**: las marcas se registran y publican gratis y no ven nada de pagos.
Todo está preparado en `supabase/mas-adelante-cobro/`. Cuando quieras activarlo:

Las marcas pagan una suscripción mensual para publicar. Sin suscripción en vigor no pueden
subir prendas y sus prendas no se muestran. Esto lo garantiza la base de datos, no solo la web.

Empieza en **modo de prueba** de Stripe (interruptor «Test mode»). Cuando todo funcione, repite
los pasos 3 a 9 en modo real (los enlaces y el secreto son distintos).

1. **Base de datos.** En Supabase > SQL Editor ejecuta `supabase/mas-adelante-cobro/suscripciones.sql`.
   ⚠️ Desde ese momento las marcas sin suscripción dejan de mostrarse. Para las que quieras
   mantener sin cobrar, ve a Creador > Usuarios > **Activar sin pago**.
2. **Cuenta de Stripe** en https://dashboard.stripe.com (te pedirá los datos de tu negocio
   para poder cobrar en modo real).
3. **Producto:** Catálogo de productos > Añadir producto > «Plan Marca», precio **recurrente
   mensual** (por ejemplo 29 €).
4. **Enlace de pago:** Payment Links > Nuevo > elige ese producto. En «Después del pago»
   elige *No mostrar página de confirmación* y redirige a
   `https://tu-usuario.github.io/found/?pago=ok`. Copia el enlace (`https://buy.stripe.com/...`).
5. **Portal de clientes** (para que las marcas cancelen o cambien la tarjeta): Configuración >
   Facturación > Portal de clientes > activa cancelar suscripción y actualizar método de pago.
   Copia el enlace de inicio de sesión (`https://billing.stripe.com/p/login/...`).
6. **Función que recibe los avisos de Stripe:** Supabase > Edge Functions > *Deploy a new function* >
   *Via Editor*. Nombre: `stripe-webhook`. Pega todo `supabase/mas-adelante-cobro/functions/stripe-webhook/index.ts`
   y pulsa *Deploy*. Después, en los ajustes de la función, **desactiva «Verify JWT»**
   (Stripe no envía ese token; la seguridad la da la firma de Stripe).
   Su dirección es `https://TU-PROYECTO.supabase.co/functions/v1/stripe-webhook`.
7. **Webhook en Stripe:** Desarrolladores > Webhooks > Añadir destino > pega la dirección del paso 6
   y elige estos eventos: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`. Copia el
   **secreto de firma** (`whsec_...`).
8. **Secreto:** Supabase > Edge Functions > Secrets > añade `STRIPE_WEBHOOK_SECRET` con el `whsec_...`.
9. **En tu web:** Creador > Ajustes de la web > *Cobro a las marcas*: precio mensual, enlace de pago
   y enlace del portal, marca la casilla **Cobrar una suscripción mensual a las marcas** y guarda.
   Cambia también la plantilla del correo de confirmación por
   `supabase/mas-adelante-cobro/correo-confirmacion-con-suscripcion.html`.
10. **Prueba:** crea una cuenta de marca nueva y paga con la tarjeta de prueba `4242 4242 4242 4242`
    (cualquier fecha futura y CVC). Al volver a la web, la cuenta se activa sola en unos segundos.
    En Creador > Resumen verás «marcas pagando» e ingresos al mes.

**Cómo funciona por dentro:** el enlace de pago lleva el identificador de la marca
(`client_reference_id`). Al pagar, Stripe avisa a `stripe-webhook`, que comprueba la firma y guarda
el estado en la tabla `brand_billing`. Las renovaciones, los impagos (Stripe reintenta el cobro y
mientras tanto la marca sigue visible) y las cancelaciones llegan por el mismo camino.
