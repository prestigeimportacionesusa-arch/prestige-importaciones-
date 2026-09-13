-- Migración 009: permite que las reseñas incluyan una foto opcional del
-- producto recibido (subida por el propio cliente).
alter table reviews add column if not exists foto text;
