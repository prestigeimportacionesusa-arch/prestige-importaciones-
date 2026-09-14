-- Corrección: la columna "tiktok" de store_config nunca se llegó a crear en
-- la base de datos real, lo que hacía que TODO el formulario de
-- Configuración fallara al guardar (Instagram, TikTok, y cualquier otro
-- campo que se intentara cambiar al mismo tiempo).
alter table store_config add column if not exists tiktok text default '';
