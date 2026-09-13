-- Migración 010: las reseñas ahora se muestran en todos los productos de la
-- misma marca (no solo en el producto exacto reseñado), y permiten hasta 3
-- fotos en vez de solo una.
alter table reviews add column if not exists marca text;
alter table reviews add column if not exists fotos text[] default '{}';

-- Recupera las marcas de las reseñas ya existentes, a partir del producto.
update reviews r set marca = p.marca
from products p
where r.product_id = p.id and r.marca is null;

-- Migra la foto vieja (si alguna reseña ya la tenía) al nuevo arreglo de fotos.
update reviews set fotos = array[foto] where foto is not null and (fotos is null or fotos = '{}');

create index if not exists reviews_marca_idx on reviews (marca);
