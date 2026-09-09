# Prestige Importaciones — tienda online

Tienda de perfumes construida con **Next.js** (frontend + backend en un solo
proyecto) y **Supabase** (base de datos, autenticación y seguridad). Incluye
tu catálogo real de 128 perfumes importado del PDF, carrito, checkout que
escribe pedidos reales, integración con WhatsApp, y un panel administrativo
completo protegido con usuario y contraseña reales.

## 1. Qué tecnología usa y por qué

- **Next.js** (React): frontend y backend en el mismo proyecto. Se despliega
  gratis en **Vercel**, hecho por los mismos creadores de Next.js.
- **Supabase**: Postgres (base de datos real), autenticación de usuarios, y
  almacenamiento — todo con un generoso plan gratuito. Es la alternativa
  open-source a Firebase.
- Sin frameworks de pago, sin licencias. Todo el stack tiene plan gratuito
  suficiente para una tienda que está empezando.

## 2. Antes de empezar: crear tu proyecto de Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta (gratis).
2. Crea un nuevo proyecto (elige la región más cercana a Colombia, ej. `us-east-1`).
3. Guarda la contraseña de base de datos que te pida — la puedes necesitar más adelante.
4. Ve a **SQL Editor** → pega el contenido completo de `supabase/schema.sql` → **Run**.
   Esto crea todas las tablas, la seguridad y la fila de configuración inicial.
5. Ve a **Authentication → Users → Add user** y crea tu usuario administrador
   (tu correo + una contraseña segura). Con esa cuenta entras al panel admin
   — no hay una contraseña "de la app", la seguridad la maneja Supabase.
6. Ve a **Project Settings → API** y copia:
   - `Project URL` → esto es tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → esto es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` → esto es tu `SUPABASE_SERVICE_ROLE_KEY`
     (**nunca la compartas ni la subas a un repositorio público** — solo se
     usa para importar el catálogo una vez, desde tu computador)

## 3. Configurar el proyecto en tu computador

```bash
# 1) Instala las dependencias
npm install

# 2) Copia el archivo de variables de entorno y complétalo
cp .env.example .env.local
# abre .env.local y pega tus 3 valores de Supabase

# 3) Importa tu catálogo real (128 perfumes con foto)
npm run seed

# 4) Pruébalo en tu computador
npm run dev
# abre http://localhost:3000
```

Si `npm run seed` te dice que faltan variables, revisa que `.env.local` esté
completo y en la raíz del proyecto (junto a `package.json`).

## 4. Publicar la tienda (gratis)

1. Sube este proyecto a un repositorio de GitHub (puedes arrastrar la carpeta
   en [github.com/new](https://github.com/new) o usar `git`).
2. Ve a [vercel.com](https://vercel.com), inicia sesión con GitHub, y elige
   **Import Project** sobre tu repositorio.
3. En **Environment Variables**, agrega las mismas 3 variables de tu
   `.env.local` (la `service_role` solo hace falta si vas a correr el seed
   desde Vercel también; para producción normal solo se usan las dos
   `NEXT_PUBLIC_*` en el navegador/servidor).
4. Dale a **Deploy**. En un par de minutos tienes una URL pública
   (`tu-proyecto.vercel.app`), y puedes conectar tu propio dominio después
   desde la pestaña **Domains** del proyecto en Vercel.

## 5. Cómo usar el panel administrativo

Entra a `tudominio.com/admin` (o `/login` si no tienes sesión). Usa el correo
y contraseña que creaste en Supabase Authentication.

- **Productos**: crea, edita, elimina. Marca destacado/nuevo/oferta/disponible
  directamente en la lista. Los ~30 productos que el OCR no pudo leer del
  todo quedan marcados **"revisar"** — complétalos ahí.
- **Marcas / Categorías**: agrégalas o edítalas libremente, no están escritas
  en el código.
- **Promociones**: descuento fijo, porcentual o envío gratis; aplicable a
  todos los productos, una marca, una categoría o un producto puntual.
- **Banners**: cambia el mensaje principal del inicio.
- **Pedidos**: ve todos los pedidos reales que lleguen desde el checkout, y
  cambia su estado (Pendiente → Confirmado → Preparando → Enviado → Entregado).
- **Mayoristas**: solicitudes del formulario de venta mayorista.
- **Reseñas**: aprueba, oculta o elimina reseñas de clientes.
- **Configuración**: nombre de la tienda, WhatsApp, costo de envío, envío
  gratis desde cierto monto, y los recargos por método de pago (ya
  configurados según lo que pediste: contraentrega +$15.000, tarjeta y PSE
  +6%, transferencia sin recargo).

### Cómo agregar un nuevo administrador
Ve a tu proyecto de Supabase → **Authentication → Users → Add user**. No hay
límite práctico en el plan gratuito para esto.

### Cómo cambiar las fotos de los productos
En **Productos → Editar**, pega la URL de tu propia foto en el campo de
imagen (puedes subir tus fotos a Supabase Storage, Imgur, o cualquier
servicio que te dé un link directo a la imagen). Si lo dejas vacío, se
muestra un ícono de frasco genérico.

## 6. Configurar los métodos de pago reales

Ahora mismo el checkout registra el pedido con el método elegido, pero **no
procesa el cobro** — eso necesita conectar una pasarela real:

- **Wompi** (Bancolombia): la más usada en Colombia para tarjetas, PSE,
  Nequi. Cuenta gratis, cobra comisión solo por transacción exitosa. Su
  integración típica es: el checkout crea un "link de pago" o widget de
  Wompi con el monto total, y Wompi te notifica por webhook cuando el pago
  se confirma (ahí puedes actualizar el pedido a "Confirmado"
  automáticamente). Documentación: https://docs.wompi.co
- **Pago contra entrega**: no necesita integración, ya funciona tal cual.
- **Transferencia bancaria**: el cliente transfiere manualmente y te avisa
  por WhatsApp (el botón de confirmación ya arma el mensaje con el total).

Si quieres, puedo ayudarte a conectar Wompi de verdad en una siguiente
sesión — es la pieza que falta para cobrar automáticamente en línea.

## 7. Límites del plan gratuito (y cuándo tocaría pagar)

| Servicio | Límite gratis | Cuándo pagarías |
|---|---|---|
| **Vercel** (hosting) | 100 GB de tráfico/mes, generoso para una tienda que empieza | Si tienes mucho tráfico simultáneo o necesitas funciones avanzadas de equipo |
| **Supabase** (base de datos) | 500 MB de base de datos, 1 GB de almacenamiento de archivos, 50.000 usuarios activos de auth/mes, el proyecto se pausa tras 1 semana sin uso (se reactiva solo al recibir tráfico) | Cuando el catálogo + pedidos + imágenes superen esos límites (esto es *mucho* volumen — cientos de miles de productos/pedidos) |
| **Wompi** | Sin costo fijo | Comisión por transacción exitosa (revisa su tabla de tarifas vigente) |
| **Dominio propio** (ej. prestigeimportaciones.com) | — | Este es el único costo casi seguro: ~$15-20 USD/año en un registrador como Namecheap o GoDaddy |

En resumen: puedes operar la tienda completa gratis, y el único gasto
realista al inicio es el dominio si quieres uno propio (`.com`, `.co`, etc.)
en vez del subdominio gratis que te da Vercel.

## 8. Estructura del proyecto

```
app/                    Páginas (rutas) — cada carpeta es una URL
  admin/                Panel administrativo (protegido)
  producto/[slug]/      Página de cada perfume
  tienda/                Catálogo con filtros
  checkout/, carrito/   Proceso de compra
components/             Piezas de interfaz reutilizables
lib/
  supabase/             Conexión a la base de datos (cliente y servidor)
  actions.js            Todas las operaciones de escritura del admin
  data.js               Todas las lecturas de datos (con manejo de errores)
  utils.js              Precios, promociones, recargos, formato de moneda
  whatsapp.js           Mensajes de WhatsApp
supabase/schema.sql     El esquema completo de la base de datos
scripts/seed.mjs        Importa tu catálogo real a Supabase
```

## 9. Qué falta o queda simplificado (siguiente iteración)

Para tener un MVP real y funcionando ya, dejé estas simplificaciones a
propósito — dime si quieres que las resolvamos:

- **Cobro automático real**: el checkout registra el pedido, pero no cobra
  por sí solo (ver sección 6, Wompi).
- **Subida directa de fotos**: hoy se pega una URL; se puede conectar
  Supabase Storage para subir el archivo directo desde el panel.
- **Número de pedido**: se genera aleatorio (4 dígitos); para evitar
  colisiones a gran volumen, se puede mover a una secuencia real de la base
  de datos.
- **SEO avanzado** (sitemap.xml, robots.txt): las páginas ya tienen
  metadatos y datos estructurados de producto; falta generar el sitemap.
- **Analítica** (Meta Pixel, Google Analytics): la estructura está lista
  para agregarlos en `app/layout.jsx`, solo falta pegar tus IDs.
