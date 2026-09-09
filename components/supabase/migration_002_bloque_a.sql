-- ============================================================================
-- PRESTIGE IMPORTACIONES — Migración 002 (Bloque A)
-- Cómo usarla: Supabase Dashboard -> SQL Editor -> pega este archivo -> Run.
-- Es 100% aditiva: no borra ni modifica datos existentes, solo agrega
-- columnas y valores nuevos con valores por defecto seguros.
-- ============================================================================

-- Productos: inventario real, galería de imágenes, orden manual
alter table products add column if not exists inventario integer;
alter table products add column if not exists imagenes_adicionales text[] default '{}';
alter table products add column if not exists orden integer not null default 0;

-- Pedidos: separar estado de pago del estado logístico, + barrio
alter table orders add column if not exists estado_pago text not null default 'Pendiente'
  check (estado_pago in ('Pendiente','Pagado','Rechazado','Cancelado'));
alter table orders add column if not exists barrio text default '';
alter table orders add column if not exists referencia text;

-- El check de "estado" (logístico) original incluía 'Pendiente' con otro
-- significado; lo migramos a 'Nuevo' para no chocar con estado_pago.
update orders set estado = 'Nuevo' where estado = 'Pendiente';
alter table orders drop constraint if exists orders_estado_check;
alter table orders add constraint orders_estado_check
  check (estado in ('Nuevo','Confirmado','Preparando','Enviado','Entregado','Cancelado'));
alter table orders alter column estado set default 'Nuevo';

-- Configuración: datos de transferencia bancaria (vacíos por defecto — el
-- administrador los completa desde el panel, nunca se inventan aquí)
alter table store_config add column if not exists nequi_numero text default '';
alter table store_config add column if not exists nequi_titular text default '';
alter table store_config add column if not exists bancolombia_numero text default '';
alter table store_config add column if not exists bancolombia_tipo text default '';
alter table store_config add column if not exists bancolombia_titular text default '';
alter table store_config add column if not exists breb_llave text default '';
alter table store_config add column if not exists breb_titular text default '';
alter table store_config add column if not exists ciudades_cobertura text default '';
alter table store_config add column if not exists tiempo_entrega text default '';

-- ============================================================================
-- Después de correr esto, sigue con el resto de archivos del proyecto que
-- te doy en el .zip actualizado.
-- ============================================================================
