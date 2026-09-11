-- Migración 008: permite mostrar u ocultar el botón "Comprar ahora" sobre
-- cada banner, para banners que necesitan verse 100% limpios.
alter table banners add column if not exists mostrar_boton boolean not null default true;
