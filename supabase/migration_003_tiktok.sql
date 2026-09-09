-- Migración 003: agrega el campo TikTok a la configuración de la tienda.
alter table store_config add column if not exists tiktok text default '';
