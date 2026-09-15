-- Migración 015: guarda cuándo fue la última vez que entraste a ver los
-- pedidos, para que el número de "pedidos nuevos" del panel se reinicie
-- cada vez que abres esa sección, en vez de quedarse pegado hasta que
-- cambies el estado de cada pedido uno por uno.
alter table store_config add column if not exists pedidos_last_seen timestamptz not null default now();
