-- Migración 006: marca de productos incluidos en la promoción "2 x $409.000".
alter table products add column if not exists combo_2x409 boolean not null default false;
create index if not exists products_combo_2x409_idx on products (combo_2x409) where combo_2x409 = true;
