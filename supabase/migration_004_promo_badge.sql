-- Migración 004: agrega una etiqueta de promoción destacada al banner principal.
alter table banners add column if not exists promo_badge text default '';
