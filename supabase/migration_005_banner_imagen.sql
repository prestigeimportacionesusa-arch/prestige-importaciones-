-- Migración 005: agrega imagen de fondo al banner principal.
alter table banners add column if not exists imagen text default '';
