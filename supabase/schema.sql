-- ============================================================================
-- PRESTIGE IMPORTACIONES — esquema de base de datos (Supabase / Postgres)
-- Cómo usarlo: Supabase Dashboard -> SQL Editor -> pega este archivo -> Run.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  logo text default '',
  descripcion text default ''
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  marca text not null,
  slug text not null unique,
  genero text not null default 'Unisex' check (genero in ('Hombre','Mujer','Unisex')),
  precio numeric not null default 0,
  precio_anterior numeric not null default 0,
  imagen text default '',
  imagenes_adicionales text[] default '{}',
  descripcion text default '',
  familia_olfativa text default '',
  acordes_principales text[] default '{}',
  notas_salida text[] default '{}',
  notas_corazon text[] default '{}',
  notas_fondo text[] default '{}',
  tamano_ml text default '',
  categoria text default '',
  disponibilidad boolean not null default true,
  inventario integer,
  orden integer not null default 0,
  destacado boolean not null default false,
  nuevo boolean not null default false,
  oferta boolean not null default false,
  revisar boolean not null default false,
  pagina_catalogo integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_marca_idx on products (marca);
create index if not exists products_genero_idx on products (genero);
create index if not exists products_categoria_idx on products (categoria);

create table if not exists banners (
  id uuid primary key default gen_random_uuid(),
  activo boolean not null default true,
  titulo text not null default '',
  subtitulo text not null default '',
  cta text not null default 'Comprar ahora',
  promo_badge text default '',
  tono text not null default 'gold',
  orden integer not null default 0
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  tipo text not null check (tipo in ('fijo','porcentaje','envio_gratis')),
  valor numeric not null default 0,
  alcance text not null check (alcance in ('todos','marca','categoria','producto')),
  alcance_valor text default '',
  activa boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Pedidos
-- ---------------------------------------------------------------------------

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  numero integer not null,
  fecha timestamptz not null default now(),
  estado text not null default 'Nuevo'
    check (estado in ('Nuevo','Confirmado','Preparando','Enviado','Entregado','Cancelado')),
  estado_pago text not null default 'Pendiente'
    check (estado_pago in ('Pendiente','Pagado','Rechazado','Cancelado')),
  cliente_nombre text not null,
  cliente_celular text not null,
  cliente_correo text not null,
  cliente_direccion text not null,
  cliente_ciudad text not null,
  cliente_departamento text not null,
  barrio text default '',
  info_adicional text default '',
  subtotal numeric not null default 0,
  envio numeric not null default 0,
  recargo numeric not null default 0,
  total numeric not null default 0,
  metodo_pago text not null,
  referencia text
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  nombre text not null,
  marca text not null,
  qty integer not null default 1,
  precio numeric not null default 0,
  subtotal numeric not null default 0
);
create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists wholesale_leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  whatsapp text not null,
  ciudad text not null,
  cantidad text default '',
  productos text default '',
  mensaje text default '',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  nombre text not null,
  estrellas integer not null check (estrellas between 1 and 5),
  comentario text default '',
  aprobada boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists reviews_product_idx on reviews (product_id);

-- ---------------------------------------------------------------------------
-- Configuración de la tienda (una sola fila, id = 1)
-- ---------------------------------------------------------------------------

create table if not exists store_config (
  id integer primary key default 1,
  nombre_tienda text not null default 'Prestige Importaciones',
  whatsapp text not null default '573000000000',
  instagram text default '',
  facebook text default '',
  tiktok text default '',
  costo_envio numeric not null default 12000,
  envio_gratis_desde numeric not null default 350000,
  ciudades text default 'Todo Colombia',
  ciudades_cobertura text default '',
  tiempo_entrega text default '',
  metodos_pago jsonb not null default '{"contraentrega":true,"tarjeta":true,"pse":true,"transferencia":true}',
  recargos jsonb not null default '{
    "contraentrega": {"tipo":"fijo","valor":15000},
    "tarjeta": {"tipo":"porcentaje","valor":6},
    "pse": {"tipo":"porcentaje","valor":6},
    "transferencia": {"tipo":"fijo","valor":0}
  }',
  nequi_numero text default '',
  nequi_titular text default '',
  bancolombia_numero text default '',
  bancolombia_tipo text default '',
  bancolombia_titular text default '',
  breb_llave text default '',
  breb_titular text default '',
  constraint store_config_singleton check (id = 1)
);
insert into store_config (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Seguridad: Row Level Security
-- El público (anon) solo puede leer catálogo/config y crear pedidos/reseñas/
-- solicitudes mayoristas. Solo un usuario autenticado (el admin que crees en
-- Supabase Auth) puede leer y modificar todo lo demás.
-- ---------------------------------------------------------------------------

alter table brands enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table banners enable row level security;
alter table promotions enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table wholesale_leads enable row level security;
alter table reviews enable row level security;
alter table store_config enable row level security;

-- Catálogo: lectura pública, escritura solo admin autenticado
create policy "public read brands" on brands for select using (true);
create policy "admin write brands" on brands for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read categories" on categories for select using (true);
create policy "admin write categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read products" on products for select using (true);
create policy "admin write products" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read banners" on banners for select using (true);
create policy "admin write banners" on banners for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read promotions" on promotions for select using (true);
create policy "admin write promotions" on promotions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read config" on store_config for select using (true);
create policy "admin write config" on store_config for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Pedidos: cualquiera puede crear uno (checkout), solo admin puede leer/editar
create policy "public create orders" on orders for insert with check (true);
create policy "admin manage orders" on orders for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
-- admin manage orders ya cubre select/update/delete para autenticados;
-- para insert también dejamos pasar al admin (por si crea pedidos manuales):
create policy "admin insert orders" on orders for insert with check (auth.role() = 'authenticated');

create policy "public create order_items" on order_items for insert with check (true);
create policy "admin manage order_items" on order_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Mayoristas: cualquiera puede enviar el formulario, solo admin lo ve
create policy "public create wholesale_leads" on wholesale_leads for insert with check (true);
create policy "admin manage wholesale_leads" on wholesale_leads for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Reseñas: cualquiera puede escribir una y leer las aprobadas; admin ve/gestiona todas
create policy "public read approved reviews" on reviews for select using (aprobada = true);
create policy "public create reviews" on reviews for insert with check (true);
create policy "admin manage reviews" on reviews for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- Después de correr este script:
-- 1) Ve a Authentication -> Users -> Add user, y crea tu usuario admin
--    (correo + contraseña). Con eso ya puedes entrar a /admin/login.
-- 2) Corre el script de importación del catálogo: npm run seed
--    (ver README.md para el detalle).
-- ============================================================================
